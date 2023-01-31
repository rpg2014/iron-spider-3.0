import { EC2Client, RunInstancesCommandOutput } from "@aws-sdk/client-ec2";

export class MinecraftEC2Wrapper {
    ec2Client: EC2Client
    constructor() {
        this.ec2Client = new EC2Client({region: "us-east-1"})
    }


    /**
     * Public methods
     */
    public startInstance(){}
    public stopInstance(){}

    

    public getInstanceDomainName(){}
    public getInstanceIP(){}
    public isInstanceUp(){}
    public isInstanceStopped(){}
    public getInstanceStatus(){}

    // Optional
    public rebootInstance(){}
    /**
     * Private methods
     */
    private getInstanceId(runInstancesResponse: RunInstancesCommandOutput){}
    private  waitForAMIToBeCreated() {}
    private waitForSnapshotToBeCreated() {}
    private waitForServerStop() {}
    private getNewestSnapshot(){}
    private deleteOldAMI(oldAMIId: string, oldSnapshotId: string){}
    private makeAMI(instanceId: string){}

}