import { Route53Client } from "@aws-sdk/client-route-53"




export class Route53Wrapper {
    route53Client: Route53Client
    constructor() {
        this.route53Client = new Route53Client({region: "us-east-1"})
    };

    public updateMinecraftDNS(ipAddress: string){
        return this.updateDNSforURL("mc.parkergiven.com", ipAddress)
    }
    public updateDNSforURL(url: string, ipAddress: string){}

}