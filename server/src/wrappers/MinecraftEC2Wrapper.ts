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
	StartInstancesCommandOutput,
	StopInstancesCommand, StopInstancesCommandInput,
	TerminateInstancesCommand,
} from '@aws-sdk/client-ec2';
import { InternalServerError } from "iron-spider-ssdk";
import { MinecraftDBWrapper } from './MinecraftDynamoWrapper';


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

    // private static IMAGE_ID: string | undefined;
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
            let runInstancesResponse: RunInstancesCommandOutput;
            try{
                runInstancesResponse = await MinecraftEC2Wrapper.EC2_CLIENT.send(new RunInstancesCommand(runInstancesCommandInput));
            }catch (e){
                console.error(e)
                throw new InternalServerError({message: `Running the instance threw error ${JSON.stringify(e)} with input ${JSON.stringify(runInstancesCommandInput)}`})
            }
            const instanceId = this.getInstanceId(runInstancesResponse);
            await MinecraftEC2Wrapper.SERVER_DETAILS.setInstanceId(instanceId);
            let startInstanceResponse: StartInstancesCommandOutput;
            try {
                startInstanceResponse = await MinecraftEC2Wrapper.EC2_CLIENT.send(new StartInstancesCommand({InstanceIds: [instanceId]})); 
            } catch(e){
                console.error( `Threw error ${JSON.stringify(e)} with input ${JSON.stringify(instanceId)}`)
                throw new InternalServerError({message: `Running the instance threw error ${JSON.stringify(e)} with input ${JSON.stringify(instanceId)}`})
            } 
            const success = !!(startInstanceResponse.StartingInstances?.[0]?.CurrentState?.Code && startInstanceResponse.StartingInstances?.[0].CurrentState?.Code < 32);
            console.log(`Success is ${success}`)
            if (success) {
                await MinecraftEC2Wrapper.SERVER_DETAILS.setServerRunning();
            }
            return success;
        } else {
            return false;
        }
    }
    /**
     * Used for getting the single instance id out of the response
     * @param runInstancesResponse 
     * @returns 
     */
    private getInstanceId(runInstancesResponse: RunInstancesCommandOutput): string {
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
            throw new InternalServerError({ message: `There is more than 1 instance id present: ${JSON.stringify(idList)}` })
        } 
    }

    public async stopInstance(): Promise<boolean> {
        if (await MinecraftEC2Wrapper.SERVER_DETAILS.isServerRunning() || await this.isInstanceUp()) {
            // Get instance info from dynamo
            const instanceId = await MinecraftEC2Wrapper.SERVER_DETAILS.getInstanceId();
            const originalAMIId = await MinecraftEC2Wrapper.SERVER_DETAILS.getAmiId();
            const originalSnapshot = await MinecraftEC2Wrapper.SERVER_DETAILS.getSnapshotId();


			const stopInstancesCommandInput: StopInstancesCommandInput = {
				InstanceIds: [instanceId]
			};
            try {
            await MinecraftEC2Wrapper.EC2_CLIENT.send(new StopInstancesCommand(stopInstancesCommandInput));
            } catch (e){
                console.error(`Threw error ${JSON.stringify(e)} with input ${JSON.stringify(stopInstancesCommandInput)}`)
            }

            await this.waitForServerStop(instanceId);
            await MinecraftEC2Wrapper.SERVER_DETAILS.setServerStopped();
            const newAMIId = await this.makeAMI(instanceId);
            await this.waitForSnapshotToBeCreated();
            await this.waitForAMIToBeCreated();

            await MinecraftEC2Wrapper.SERVER_DETAILS.setAmiId(newAMIId);
            await MinecraftEC2Wrapper.SERVER_DETAILS.setSnapshotId(await this.getNewestSnapshot());

            console.info('Server Stopped');

            //Check to make sure that the the ami id and Snapshot id have changed since we started this function, and that new ones have been created
            if (originalAMIId && originalSnapshot &&
                (await MinecraftEC2Wrapper.SERVER_DETAILS.getAmiId() !== originalAMIId)
                && (await MinecraftEC2Wrapper.SERVER_DETAILS.getSnapshotId() !== originalSnapshot)) {
                console.info('Deleting old snapshot_id');
                await this.deleteOldAmi(originalAMIId, originalSnapshot);
            }

			const terminateInstancesCommandInput = {
				InstanceIds: [instanceId]
			};
            const terminateInstancesResult = await MinecraftEC2Wrapper.EC2_CLIENT.send(
				new TerminateInstancesCommand(terminateInstancesCommandInput));

            const success = !!(terminateInstancesResult.TerminatingInstances?.[0].CurrentState?.Code &&
                terminateInstancesResult.TerminatingInstances[0].CurrentState.Code > 32);
            if (success) {
                 console.info('Terminated Server');
            }

            await MinecraftEC2Wrapper.SERVER_DETAILS.setServerStopped();
            return success;
        } else {
            return false;
        }
    }

    /**
     * We wait until the AMI is created, and that there is more than 1 image avalible
     */
    private async waitForAMIToBeCreated(): Promise<void> {
        let response: DescribeImagesResult;
        let retryNum: number = 0;
        do {
            console.info('Waiting for ami to be created');
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
            console.info(response.toString());

            if (response.Images?.find(image => image.State === ImageState.failed || image.State === ImageState.error)) {
                console.error('There is a failed ami');
                throw new InternalServerError({ message: 'There is a failed ami' });
            }
            retryNum++
        } while (response.Images?.find(image => image.State === ImageState.pending));
    }

    /**
     * Snapshot is created when an AMI is created, so we wait until there is more than 1 snapshot, so we can be more confident that 
     * we aren't deleting the last backup.  We wait until all snapshots are complete, so if there's more than 1 being made at a time, this will
     * break.  
     */
    private async waitForSnapshotToBeCreated(): Promise<void> {
        let response: DescribeSnapshotsResult;
        let finishedSnapshots: Snapshot[] = [];

        do {
            console.info('Waiting for snapshot to be created');
            await this.sleep(5000);

			const describeSnapshotsCommandInput: DescribeSnapshotsCommandInput = {
				OwnerIds: [MinecraftEC2Wrapper.AWS_ACCOUNT_ID.replace(/-/g, '')]
			};

            response = await MinecraftEC2Wrapper.EC2_CLIENT.send(new DescribeSnapshotsCommand(describeSnapshotsCommandInput));

            //If we have a backup snapshot + 1 more
            if (response.Snapshots?.length && response.Snapshots?.length > 1) {
                finishedSnapshots = response.Snapshots.filter(snapshot => snapshot.Progress?.includes('100'));
            }
        } while ((finishedSnapshots.length !== response.Snapshots?.length) && (response.Snapshots?.length === 1));
    }

    private async waitForServerStop(instanceId: string): Promise<void> {
        console.info(`Waiting for instance ${instanceId} to stop`);
        do {
            try {
                await this.sleep(5000);
            } catch (e) {
                console.error(e);
                throw InternalServerError({message: `Error json stringify: ${e} when sleeping, waiting for server to stop`})
            }
        } while (!await this.isInstanceStopped());
    }

    /**
     * Gets the newest snapshot, and returns the snapshot id. This snapshot id is used to delete the snapshot.
     * @returns 
     */
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

    /**
     * Creates the AMI from the instance, and returns the AMI id. Creating an AMI also creates a snapshot
     * @param instanceId 
     * @returns 
     */
    private async makeAMI(instanceId: string): Promise<string> {
		const createImageCommandInput: CreateImageCommandInput = {
			InstanceId: instanceId,
			Name: MinecraftEC2Wrapper.AMI_NAME + '-' + Date.now().toString(),
		};
        console.info(`Making AMI with command ${JSON.stringify(createImageCommandInput)}`);
        try{
            const createImageResponse = await MinecraftEC2Wrapper.EC2_CLIENT.send(new CreateImageCommand(createImageCommandInput));
            const amiId = createImageResponse.ImageId!;
            console.info('Created AMI, image id: ' + amiId);
            return amiId;
        } catch (e) {
            console.error(e);
            throw InternalServerError({ message: `Error json stringify: ${e} when making AMI` })
        }
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
            console.info(
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