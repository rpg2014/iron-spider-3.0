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
    EC2ServiceException,
    ImageState,
    RebootInstancesCommand, RebootInstancesCommandInput,
    RunInstancesCommand, RunInstancesCommandInput,
    RunInstancesCommandOutput,
    Snapshot,
    StartInstancesCommand,
    StartInstancesCommandOutput,
    Status,
    StopInstancesCommand, StopInstancesCommandInput,
    TerminateInstancesCommand,
    TerminateInstancesCommandInput,
    TerminateInstancesCommandOutput,
} from '@aws-sdk/client-ec2';
import { InternalServerError } from "iron-spider-ssdk";
import { EC2State } from 'src/model/Status';
import { MinecraftDBWrapper } from './MinecraftDynamoWrapper';


export class MinecraftEC2Wrapper {

    private static readonly AMI_NAME = 'Minecraft_Server';
    private static readonly SECURITY_GROUP_ID = 'sg-0bcf97234db49f1d4';
    private static readonly AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID || '';
    private static readonly INSTANCE_TYPE = process.env.EC2_INSTANCE_TYPE || '';
    // sh minecraft/run_server.sh base64 encoded.
    private static readonly USER_DATA = 'c2ggbWluZWNyYWZ0L3J1bl9zZXJ2ZXIuc2g=';
    private static readonly SERVER_DETAILS = new MinecraftDBWrapper();
    private static readonly EC2_CLIENT = new EC2Client({ region: 'us-east-1' });

    // private static IMAGE_ID: string | undefined;
    private static ourInstance: MinecraftEC2Wrapper;

    public static getInstance(): MinecraftEC2Wrapper {
        if (!MinecraftEC2Wrapper.ourInstance) {
            MinecraftEC2Wrapper.ourInstance = new MinecraftEC2Wrapper();
        }
        return MinecraftEC2Wrapper.ourInstance;
    }

    public async startInstance(): Promise<boolean> {
        if (!await MinecraftEC2Wrapper.SERVER_DETAILS.isServerRunning() || !await this.isInstanceRunning()) {
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
            try {
                runInstancesResponse = await MinecraftEC2Wrapper.EC2_CLIENT.send(new RunInstancesCommand(runInstancesCommandInput));
            } catch (e) {
                console.error(e)
                throw new InternalServerError({ message: `Running the instance threw error ${JSON.stringify(e)} with input ${JSON.stringify(runInstancesCommandInput)}` })
            }
            const instanceId = this.getInstanceId(runInstancesResponse);
            console.log("Requested server, instance id: " + instanceId + ".  Now setting id in DDB")
            await MinecraftEC2Wrapper.SERVER_DETAILS.setInstanceId(instanceId);
            let startInstanceResponse: StartInstancesCommandOutput;
            try {
                console.log("Now starting instance " +instanceId);
                startInstanceResponse = await MinecraftEC2Wrapper.EC2_CLIENT.send(new StartInstancesCommand({ InstanceIds: [instanceId] }));
            } catch (e) {
                console.error(`Threw error ${JSON.stringify(e)} with input ${JSON.stringify(instanceId)}`)
                throw new InternalServerError({ message: `Running the instance threw error ${JSON.stringify(e)} with input ${JSON.stringify(instanceId)}` })
            }
            console.log(`Start Instance response Number of instances returned: ${startInstanceResponse.StartingInstances?.length}`)
            
            const stateCode = startInstanceResponse.StartingInstances?.[0].CurrentState?.Code
            console.log(`Response's first instance state code: ${stateCode}`)
            const success = (stateCode && stateCode < 32) ? true : false;

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
        if (await MinecraftEC2Wrapper.SERVER_DETAILS.isServerRunning() || await this.isInstanceRunning()) {
            // Get instance info from dynamo
            const instanceId = await MinecraftEC2Wrapper.SERVER_DETAILS.getInstanceId();
            const originalAMIId = await MinecraftEC2Wrapper.SERVER_DETAILS.getAmiId();
            const originalSnapshot = await MinecraftEC2Wrapper.SERVER_DETAILS.getSnapshotId();


            const stopInstancesCommandInput: StopInstancesCommandInput = {
                InstanceIds: [instanceId]
            };
            try {
                await MinecraftEC2Wrapper.EC2_CLIENT.send(new StopInstancesCommand(stopInstancesCommandInput));
            } catch (e) {
                console.error(`Threw error ${JSON.stringify(e)} with input ${JSON.stringify(stopInstancesCommandInput)}`)
            }

            await this.waitForServerStop();
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

            const terminateInstancesCommandInput: TerminateInstancesCommandInput = {
                InstanceIds: [instanceId]
            };
            let terminateInstancesResult: TerminateInstancesCommandOutput;
            try {
                terminateInstancesResult = await MinecraftEC2Wrapper.EC2_CLIENT.send(new TerminateInstancesCommand(terminateInstancesCommandInput));
            } catch (e) {
                console.error(`Terminate Instance threw error ${JSON.stringify(e)} with input ${JSON.stringify(terminateInstancesCommandInput)}`)
                throw new InternalServerError({ message: `Terminate Instance threw error ${JSON.stringify(e)} with input ${JSON.stringify(terminateInstancesCommandInput)}` })
            }

            const success = !!(terminateInstancesResult.TerminatingInstances?.[0].CurrentState?.Code &&
                terminateInstancesResult.TerminatingInstances[0].CurrentState.Code > 32);
            if (success) {
                console.info('Terminated Server');
            } else {
                console.error('Terminate Instance failed');
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
        console.info('Newest Snapshot is ' + newestSnap.SnapshotId);
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
            Name: MinecraftEC2Wrapper.AMI_NAME + '-' + Date.now().toString()
        };
        console.info(`Making AMI with command ${JSON.stringify(createImageCommandInput)}`);
        try {
            const createImageResponse = await MinecraftEC2Wrapper.EC2_CLIENT.send(new CreateImageCommand(createImageCommandInput));
            const amiId = createImageResponse.ImageId!;
            console.info('Created AMI, image id: ' + amiId);
            return amiId;
        } catch (e) {
            console.error(e);
            throw new InternalServerError({ message: `Error json stringify: ${e} when making AMI` })
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
        try {
            const response = await MinecraftEC2Wrapper.EC2_CLIENT.send(new DescribeInstancesCommand(describeInstancesCommandInput));
            return response.Reservations?.[0].Instances?.[0].PublicDnsName || 'Server is not running';
        } catch (e: any) {
            throw new InternalServerError({ message: `Cannot get instance domain name: ${e}` });
        }
    }

    public async getInstanceIp(): Promise<string> {
        const instanceId = await MinecraftEC2Wrapper.SERVER_DETAILS.getInstanceId();
        const describeInstancesCommandInput: DescribeInstancesCommandInput = {
            InstanceIds: [instanceId]
        };
        const response = await MinecraftEC2Wrapper.EC2_CLIENT.send(new DescribeInstancesCommand(describeInstancesCommandInput));
        return response.Reservations?.[0].Instances?.[0].PublicIpAddress || 'Error: Cannot get Instance IP';
    }

    public async isInstanceRunning(): Promise<boolean> {
        return await this.isInstanceInState(EC2State.running);
    }

    public async isInstanceStopped(): Promise<boolean> {
        return await this.isInstanceInState(EC2State.stopped)
    }

    public async isInstanceTerminated(): Promise<boolean> {
        return await this.isInstanceInState(EC2State.terminated)
    }

    public async isInstanceInState(status: EC2State): Promise<boolean> {
        const describeInstancesCommandInput: DescribeInstancesCommandInput = {
            InstanceIds: [await MinecraftEC2Wrapper.SERVER_DETAILS.getInstanceId()]
        };
        const response = await MinecraftEC2Wrapper.EC2_CLIENT.send(new DescribeInstancesCommand(describeInstancesCommandInput));
        if (response.Reservations?.length === 0 || response.Reservations?.[0].Instances?.length === 0) {
            if (status === EC2State.terminated || status === EC2State.stopped ) {
                // Return true if we are looking for the server to be shutdown or terminated, if there are 0 instances returned
                return true;
            } else {
                // else throw an error b/c if we are starting an instance and there arn't any, something went wrong.
                throw new InternalServerError({ message: `No instances found` });
            }
            
        }
        const isInState = response.Reservations?.[0].Instances?.[0].State?.Code === status;
        if (isInState) {
            console.info(
                `Server Instance ${await MinecraftEC2Wrapper.SERVER_DETAILS.getInstanceId()} is ${EC2State[status]}`);
        }
        return isInState;
    }

    /**
     * Gets the instance status
     * @returns 
     */
    public async getInstanceStatus(): Promise<number> {
        try {
            const describeInstancesCommandInput: DescribeInstancesCommandInput = {
                InstanceIds: [await MinecraftEC2Wrapper.SERVER_DETAILS.getInstanceId()]
            };
            const response = await MinecraftEC2Wrapper.EC2_CLIENT.send(new DescribeInstancesCommand(describeInstancesCommandInput));
            if (response.Reservations && response.Reservations.length === 0) {
                return EC2State.terminated;
            }
            const code: number | undefined = response.Reservations?.[0]?.Instances?.[0]?.State?.Code;
            if(code !== undefined) {
                return code;
            } else {
                //Cant find the reservation or instance, throw error
                console.error("Cant find the reservation or instance when trying to get status")
                throw new InternalServerError({message: "unable to get the instance status, reservation, instance or code is undefined"})
            }
        } catch (error: any) {
            if (error instanceof EC2ServiceException && error.name === 'InvalidInstanceID.NotFound') {
                return EC2State.terminated;
            } else {
                const log = `Error when getting status ${JSON.stringify(error)}`
                console.log(log)
                throw new InternalServerError({ message: log })
            }
        }
    }

    /**
     * Yert: yert
     * 
     * Waits for the instance from the ddb to be shutdown.  Sleeps for 5 secs then retries
     */
    public async waitForServerShutdown(): Promise<void> {
        console.info(`Waiting for instance ${await MinecraftEC2Wrapper.SERVER_DETAILS.getInstanceId()} to shutdown`);
        const status = await this.getInstanceStatus()
        if (status === EC2State.shuttingDown || status === EC2State.stopped || status === EC2State.stopping) {
            do {
                try {
                    await this.sleep(5000);
                } catch (e) {
                    console.error(e);
                    throw new InternalServerError({ message: `Error json stringify: ${e} when sleeping, waiting for server to Shutdown` })
                }
            } while (await this.isInstanceTerminated());
        } else {
            console.error("Server isn't in a shutting down state, something is wrong")
            throw new InternalServerError({message: "Server isn't in a shutting down state, something is wrong "})
        }
    }

    private async waitForServerStop(): Promise<void> {
        console.info(`Waiting for instance ${await MinecraftEC2Wrapper.SERVER_DETAILS.getInstanceId()} to stop`);
        do {
            try {
                await this.sleep(5000);
            } catch (e) {
                console.error(e);
                throw new InternalServerError({ message: `Error json stringify: ${e} when sleeping, waiting for server to stop` })
            }
        } while (!await this.isInstanceStopped());
    }

    public async waitForServerToBeUp() {
        if (await this.getInstanceStatus() === EC2State.pending) {
            do {
                try {
                    await this.sleep(5000);
                } catch (e) {
                    console.error(e);
                    throw new InternalServerError({ message: `Error json stringify: ${e} when sleeping, waiting for server to be up` })
                }
            } while (!await this.isInstanceRunning());
        } else {
            console.error(`Server is not in a starting state (pending) so throwing error`)
            throw new InternalServerError({ message: `Server is not in a starting state (pending)` })
        }
    }

    private async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}