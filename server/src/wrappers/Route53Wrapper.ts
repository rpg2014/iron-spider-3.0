import { ChangeAction, ChangeResourceRecordSetsCommand, ChangeResourceRecordSetsCommandInput, Route53Client, RRType } from "@aws-sdk/client-route-53"




export class Route53Wrapper {
    route53Client: Route53Client
    private HOSTED_ZONE_ID = "ZSXXJQ44AUHG2";
    constructor() {
        this.route53Client = new Route53Client({region: "us-east-1"})
    };

    public updateMinecraftDNS(ipAddress: string){
        return this.updateDNSforURL("mc.parkergiven.com", ipAddress)
    }
    public updateDNSforURL(url: string, ipAddress: string){
        console.log(`Updating url: ${url}, to ip: ${ipAddress}`)
        const input: ChangeResourceRecordSetsCommandInput = {HostedZoneId: this.HOSTED_ZONE_ID, ChangeBatch: {Changes: [{Action: ChangeAction.CREATE, ResourceRecordSet: {Name: url, ResourceRecords: [{Value: ipAddress}], TTL: 300, Type: RRType.A}}]}}
        const request: ChangeResourceRecordSetsCommand = new ChangeResourceRecordSetsCommand(input) ;
        try {
            const response = await this.route53Client.send(request)
        }catch (e) {
            
        }
        response.

}