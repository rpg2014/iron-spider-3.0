import {EmailAccessor} from "./AccessorInterfaces";
import {SendEmailCommand, SendEmailCommandOutput, SESv2Client} from "@aws-sdk/client-sesv2";


export class SESEmailAccessor extends EmailAccessor {
    private client;

    constructor() {
        super();
        this.client = new SESv2Client();
    }
    async sendVerificationEmail(email: string, verificationCode: string): Promise<string| undefined> {
        const output: SendEmailCommandOutput = await this.client.send(new SendEmailCommand({
            FromEmailAddress: "account@mail.parkergiven.com",
            Destination: {
                ToAddresses: [email],
            },
            ReplyToAddresses: ["pgiven14@gmail.com"],
            Content: {
                Simple: {
                    Subject: {
                        Data: "ParkerGiven.com Email Verification",
                        Charset: "UTF-8"
                    },
                    Body: {
                        Text: {
                            Data: "TBD EMAIL MESSAGE",
                            Charset: "UTF-8"
                        }
                    }
                }
            }

        }))
        return output.MessageId;
    }

}