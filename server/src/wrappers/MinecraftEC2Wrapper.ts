import {
	CreateImageCommand, CreateImageCommandInput,
	DeleteSnapshotCommand, DeleteSnapshotCommandInput,
	DeregisterImageCommand, DeregisterImageCommandInput,
	DescribeImagesCommand, DescribeImagesCommandInput,
	DescribeImagesResult,
	DescribeInstancesCommand, DescribeInstancesCommandInput,
	DescribeSnapshotsCommand, DescribeSnapshotsCommandInput,
	DescribeSnapshotsResult,
	EC2Client,
	ImageState,
	RebootInstancesCommand, RebootInstancesCommandInput,
	RunInstancesCommand, RunInstancesCommandInput,
	RunInstancesCommandOutput,
	Snapshot,
	StartInstancesCommand,
	StopInstancesCommand, StopInstancesCommandInput,
	TerminateInstancesCommand,
} from '@aws-sdk/client-ec2';

import {MinecraftDBWrapper} from './MinecraftDynamoWrapper';

export class MinecraftEC2Wrapper {

    private static readonly AMI_NAME = 'Minecraft_Server';
    private static readonly SECURITY_GROUP_ID = 'sg-0bcf97234db49f1d4';
    private static readonly AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID || '';
    private static readonly INSTANCE_TYPE = process.env.EC2_INSTANCE_TYPE || '';
    private static readonly USER_DATA = 'KGNyb250YWIgLWwgMj4vZGV2L251bGw7IGVjaG8gIiovNSAqICAgKiAgICogICAqICAgd2dldCA' +
        'tcSAtTyAtICJodHRwczovL2lyb24tc3BpZGVyLmhlcm9rdWFwcC5jb20iID4vZGV2L251bGwgMj4mMSIpIHwgY3JvbnRhYiAtCnNoIG1pbm' +
        'VjcmFmdC9ydW5fc2VydmVyLnNo';
    private static readonly SERVER_DETAILS = new MinecraftDBWrapper();
    private static readonly EC2_CLIENT = new EC2Client({region: 'us-east-1'});

    private static IMAGE_ID: string | undefined;
    private static ourInstance: MinecraftEC2Wrapper;

    public static getInstance(): MinecraftEC2Wrapper {
        if (!MinecraftEC2Wrapper.ourInstance) {
            MinecraftEC2Wrapper.ourInstance = new MinecraftEC2Wrapper();
        }
        return MinecraftEC2Wrapper.ourInstance;
    }

    public async startInstance(): Promise<boolean> {
        if (!await MinecraftEC2Wrapper.SERVER_DETAILS.isServerRunning() || !await this.isInstanceUp()) {
            const runInstancesCommandInput: RunInstancesCommandInput = {
                ImageId: await MinecraftEC2Wrapper.SERVER_DETAILS.getAmiId(),
                InstanceType: MinecraftEC2Wrapper.INSTANCE_TYPE,
                MaxCount: 1,
                MinCount: 1,
                UserData: MinecraftEC2Wrapper.USER_DATA,
                SecurityGroupIds: [MinecraftEC2Wrapper.SECURITY_GROUP_ID],
                KeyName: 'Minecraft Server',
            };
            const runInstancesResponse = await MinecraftEC2Wrapper.EC2_CLIENT.send(new RunInstancesCommand(runInstancesCommandInput));
            const instanceId = await this.getInstanceId(runInstancesResponse);
            await MinecraftEC2Wrapper.SERVER_DETAILS.setInstanceId(instanceId);
            const request = new StartInstancesCommand({InstanceIds: [instanceId]});
            let success = false;
            await MinecraftEC2Wrapper.EC2_CLIENT
                .send(request)
                .then(response => {
                    success = !!(response.StartingInstances?.[0].CurrentState?.Code &&
                        response.StartingInstances?.[0].CurrentState?.Code < 32);
                })
                .catch(error => console.error(error));
            if (success) {
                await console.info('Started server');
                MinecraftEC2Wrapper.IMAGE_ID = await MinecraftEC2Wrapper.SERVER_DETAILS.getAmiId();
                await MinecraftEC2Wrapper.SERVER_DETAILS.setServerRunning();
            }
            return success;
        } else {
            return false;
        }
    }

    private async getInstanceId(runInstancesResponse: RunInstancesCommandOutput): Promise<string> {
        const instanceList = runInstancesResponse.Instances || [];
        const idList: string[] = [];
        for (const instance of instanceList) {
            if (instance.InstanceId) {
                idList.push(instance.InstanceId);
            }
        }

        if (idList.length === 1) {
            return idList[0];
        } else {
            return 'error';
        }
    }

    public async stopInstance(): Promise<boolean> {
        if (await MinecraftEC2Wrapper.SERVER_DETAILS.isServerRunning() || await this.isInstanceUp()) {
            const instanceId = await MinecraftEC2Wrapper.SERVER_DETAILS.getInstanceId();
            const currentAMIId = await MinecraftEC2Wrapper.SERVER_DETAILS.getAmiId();
            const currentSnapshot = await MinecraftEC2Wrapper.SERVER_DETAILS.getSnapshotId();

            if (MinecraftEC2Wrapper.IMAGE_ID !== currentAMIId) {
                await console.error(`OLD AMI IS OUT OF DATE, oldami: ${MinecraftEC2Wrapper.IMAGE_ID} , 
                    dynamoAMI: ${currentAMIId}`);
            }

			const stopInstancesCommandInput: StopInstancesCommandInput = {
				InstanceIds: [instanceId]
			};
            await MinecraftEC2Wrapper.EC2_CLIENT.send(new StopInstancesCommand(stopInstancesCommandInput));

            await this.waitForServerStop(instanceId);
            await MinecraftEC2Wrapper.SERVER_DETAILS.setServerStopped();
            const amiId = await this.makeAMI(instanceId);
            await this.waitForSnapshotToBeCreated();
            await this.waitForAMIToBeCreated();

            await MinecraftEC2Wrapper.SERVER_DETAILS.setAmiId(amiId);
            await MinecraftEC2Wrapper.SERVER_DETAILS.setSnapshotId(await this.getNewestSnapshot());

            await console.info('Server Stopped');

            if (currentAMIId && currentSnapshot &&
                (await MinecraftEC2Wrapper.SERVER_DETAILS.getAmiId() !== currentAMIId)
                && (await MinecraftEC2Wrapper.SERVER_DETAILS.getSnapshotId() !== currentSnapshot)) {
                await console.info('Deleting old snapshot_id');
                await this.deleteOldAmi(currentAMIId, currentSnapshot);
            }

			const terminateInstancesCommandInput = {
				InstanceIds: [instanceId]
			};
            const terminateInstancesResult = await MinecraftEC2Wrapper.EC2_CLIENT.send(
				new TerminateInstancesCommand(terminateInstancesCommandInput));

            const success = !!(terminateInstancesResult.TerminatingInstances?.[0].CurrentState?.Code &&
                terminateInstancesResult.TerminatingInstances[0].CurrentState.Code > 32);
            if (success) {
                await console.info('Terminated Server');
            }

            await MinecraftEC2Wrapper.SERVER_DETAILS.setServerStopped();
            return success;
        } else {
            return false;
        }
    }

    private async waitForAMIToBeCreated(): Promise<void> {
        let response: DescribeImagesResult;

        do {
            await console.info('Waiting for ami to be created');
            await this.sleep(1000);

			const describeImagesCommandInput: DescribeImagesCommandInput = {
				ExecutableUsers: ['self'],
				Filters: [
					{
						Name: 'state',
						Values: ['pending', 'failed', 'error']
					}
				]
			};
            response = await MinecraftEC2Wrapper.EC2_CLIENT.send(new DescribeImagesCommand(describeImagesCommandInput));
            await console.info(response.toString());

            if (response.Images?.find(image => image.State === ImageState.failed || image.State === ImageState.error)) {
                await console.error('There is a failed ami');
            }
        } while (response.Images?.find(image => image.State === ImageState.pending));
    }

    private async waitForSnapshotToBeCreated(): Promise<void> {
        let response: DescribeSnapshotsResult;
        let finishedSnapshots: Snapshot[] = [];

        do {
            await console.info('Waiting for snapshot to be created');
            await this.sleep(5000);

			const describeSnapshotsCommandInput: DescribeSnapshotsCommandInput = {
				OwnerIds: [MinecraftEC2Wrapper.AWS_ACCOUNT_ID.replace(/-/g, '')]
			};
            response = await MinecraftEC2Wrapper.EC2_CLIENT.send(new DescribeSnapshotsCommand(describeSnapshotsCommandInput));

            if (response.Snapshots?.length && response.Snapshots?.length > 1) {
                finishedSnapshots = response.Snapshots.filter(snapshot => snapshot.Progress?.includes('100'));
            }
        } while ((finishedSnapshots.length !== response.Snapshots?.length) && (response.Snapshots?.length === 1));
    }

    private async waitForServerStop(instanceId: string): Promise<void> {
        await console.info(`Waiting for instance ${instanceId} to stop`);
        do {
            try {
                await this.sleep(5000);
            } catch (e) {
                await console.error(e);
            }
        } while (!await this.isInstanceStopped());
    }

    private async getNewestSnapshot(): Promise<string> {
		const describeSnapshotsCommandInput: DescribeSnapshotsCommandInput = {
			OwnerIds: [MinecraftEC2Wrapper.AWS_ACCOUNT_ID.replace(/-/g, '')]
		};
        const response = await MinecraftEC2Wrapper.EC2_CLIENT.send(new DescribeSnapshotsCommand(describeSnapshotsCommandInput));
        const latestDate = new Date(Number.MIN_SAFE_INTEGER).toISOString();
        let newestSnap: Snapshot = {};
        response.Snapshots?.forEach(snapshot => {
            if (snapshot.StartTime && latestDate < snapshot.StartTime.toISOString()) {
                newestSnap = snapshot;
            }
        })
        await console.info('Newest Snapshot is ' + newestSnap.SnapshotId);
        return newestSnap.SnapshotId!;
    }

    private async deleteOldAmi(oldAMIid: string, oldSnapshotId: string): Promise<void> {
		const deregisterImageCommandInput: DeregisterImageCommandInput = {
			ImageId: oldAMIid
		};
        await MinecraftEC2Wrapper.EC2_CLIENT.send(new DeregisterImageCommand(deregisterImageCommandInput));
		const deleteSnapshotCommandInput: DeleteSnapshotCommandInput = {
			SnapshotId: oldSnapshotId
		};
        await MinecraftEC2Wrapper.EC2_CLIENT.send(new DeleteSnapshotCommand(deleteSnapshotCommandInput));
    }

    private async makeAMI(instanceId: string): Promise<string> {
		const createImageCommandInput: CreateImageCommandInput = {
			InstanceId: instanceId,
			Name: MinecraftEC2Wrapper.AMI_NAME + '-' + Date.now().toString(),
		};
        const createImageResponse = await MinecraftEC2Wrapper.EC2_CLIENT.send(new CreateImageCommand(createImageCommandInput));
        const amiId = createImageResponse.ImageId!;
        await console.info('Created AMI, image id: ' + amiId);
        return amiId;
    }

    public async rebootInstance(): Promise<void> {
        if (await MinecraftEC2Wrapper.SERVER_DETAILS.isServerRunning()) {
			const rebootInstancesCommandInput: RebootInstancesCommandInput = {
				InstanceIds: [await MinecraftEC2Wrapper.SERVER_DETAILS.getInstanceId()]
			};
            const result = await MinecraftEC2Wrapper.EC2_CLIENT.send(new RebootInstancesCommand(rebootInstancesCommandInput));
            await console.info(result.toString(), this.constructor.name);
        } else {
            await console.info('Server isn\'t up to be rebooted');
        }
    }

    public async getInstanceDomainName(): Promise<string> {
        const instanceId = await MinecraftEC2Wrapper.SERVER_DETAILS.getInstanceId();
		const describeInstancesCommandInput: DescribeInstancesCommandInput = {
			InstanceIds: [instanceId]
		};
        const response = await MinecraftEC2Wrapper.EC2_CLIENT.send(new DescribeInstancesCommand(describeInstancesCommandInput));
        return response.Reservations?.[0].Instances?.[0].PublicDnsName || 'Server is not running';
    }

    public async getInstanceIp(): Promise<string> {
        const instanceId = await MinecraftEC2Wrapper.SERVER_DETAILS.getInstanceId();
		const describeInstancesCommandInput: DescribeInstancesCommandInput = {
			InstanceIds: [instanceId]
		};
		const response = await MinecraftEC2Wrapper.EC2_CLIENT.send(new DescribeInstancesCommand(describeInstancesCommandInput));
        return response.Reservations?.[0].Instances?.[0].PublicIpAddress || 'Error: Cannot get Instance IP';
    }

    public async isInstanceUp(): Promise<boolean> {
        const instanceId = await MinecraftEC2Wrapper.SERVER_DETAILS.getInstanceId();
		const describeInstancesCommandInput: DescribeInstancesCommandInput = {
			InstanceIds: [instanceId]
		};
		const response = await MinecraftEC2Wrapper.EC2_CLIENT.send(new DescribeInstancesCommand(describeInstancesCommandInput));
        if (response.Reservations?.length == 0 || response.Reservations?.[0].Instances?.length == 0) {
            return false;
        }
        const isUp = response.Reservations?.[0].Instances?.[0].State?.Code == 16;
        if (isUp) {
            await console.info(`Server instance ${instanceId} is up`);
        } else {
            await console.info(`Server instance ${instanceId} is down`);
        }
        return isUp;
    }

    public async isInstanceStopped(): Promise<boolean> {
		const describeInstancesCommandInput: DescribeInstancesCommandInput = {
			InstanceIds: [await MinecraftEC2Wrapper.SERVER_DETAILS.getInstanceId()]
		};
		const response = await MinecraftEC2Wrapper.EC2_CLIENT.send(new DescribeInstancesCommand(describeInstancesCommandInput));
        if (response.Reservations?.length === 0 || response.Reservations?.[0].Instances?.length === 0) {
            return true;
        }
        const isDown = response.Reservations?.[0].Instances?.[0].State?.Code === 80;
        if (isDown) {
            await console.info(
                `Server Instance ${await MinecraftEC2Wrapper.SERVER_DETAILS.getInstanceId()} is down`);
        }
        return isDown;
    }

    public async getInstanceStatus(): Promise<number> {
        try {
			const describeInstancesCommandInput: DescribeInstancesCommandInput = {
				InstanceIds: [await MinecraftEC2Wrapper.SERVER_DETAILS.getInstanceId()]
			};
			const response = await MinecraftEC2Wrapper.EC2_CLIENT.send(new DescribeInstancesCommand(describeInstancesCommandInput));
            if (response.Reservations && response.Reservations.length === 0) {
                return 48; // terminated
            }
            return response.Reservations?.[0]?.Instances?.[0]?.State?.Code || 0; // 0 = pending
        } catch (e: any) {
            if (e.includes('Invalid id') || e.includes('does not exist')) {
                return 40;
            }
            console.error('Cannot determine instance status: ', e);
            return 0;
        }
    }

    private async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}