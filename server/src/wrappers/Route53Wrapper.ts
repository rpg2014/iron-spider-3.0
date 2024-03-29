import { InternalServerError } from "iron-spider-ssdk";
import {
  ChangeAction,
  ChangeResourceRecordSetsCommand,
  ChangeResourceRecordSetsCommandInput,
  ChangeResourceRecordSetsCommandOutput,
  ChangeStatus,
  Route53Client,
  RRType,
} from "@aws-sdk/client-route-53";

export class Route53Wrapper {
  route53Client: Route53Client;
  private static readonly HOSTED_ZONE_ID = "ZSXXJQ44AUHG2";
  private constructor() {
    this.route53Client = new Route53Client({ region: "us-east-1" });
  }
  private static ourInstance: Route53Wrapper;

  public static getInstance(): Route53Wrapper {
    if (!Route53Wrapper.ourInstance) {
      Route53Wrapper.ourInstance = new Route53Wrapper();
    }
    return Route53Wrapper.ourInstance;
  }

  public updateMinecraftDNS(ipAddress: string) {
    return this.updateDNSforURL("mc.parkergiven.com", ipAddress);
  }
  public async updateDNSforURL(url: string, ipAddress: string) {
    console.log(`Updating url: ${url}, to ip: ${ipAddress}`);
    const input: ChangeResourceRecordSetsCommandInput = {
      HostedZoneId: Route53Wrapper.HOSTED_ZONE_ID,
      ChangeBatch: {
        Changes: [
          {
            //Not sure why, but the ChangeAction.UPSERT import doesn't work
            Action: "UPSERT",
            ResourceRecordSet: {
              Name: url,
              ResourceRecords: [
                {
                  Value: ipAddress,
                },
              ],
              TTL: 300,
              Type: "A",
            },
          },
        ],
      },
    };
    console.debug(`Calling route 53 with ${JSON.stringify(input)}`);
    const request: ChangeResourceRecordSetsCommand = new ChangeResourceRecordSetsCommand(input);
    let response: ChangeResourceRecordSetsCommandOutput;
    try {
      response = await this.route53Client.send(request);
      if (response.ChangeInfo?.Status === "PENDING") {
        console.log("DNS change request pending");
      }
    } catch (e: any) {
      console.error(`route 53 change request failed with error ${JSON.stringify(e)}`);
      console.error(`e.message: ${e.message}`);
      throw new InternalServerError({ message: `route 53 change request failed with error ${JSON.stringify(e)}` });
    }
  }
}
