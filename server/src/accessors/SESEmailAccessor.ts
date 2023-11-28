import { EmailAccessor } from "./AccessorInterfaces";
import { SendEmailCommand, SendEmailCommandOutput, SESv2Client } from "@aws-sdk/client-sesv2";

export class SESEmailAccessor extends EmailAccessor {
  private client;

  constructor() {
    super();
    this.client = new SESv2Client();
  }
  async sendVerificationEmail(email: string, verificationCode: string): Promise<string | undefined> {
    const command = new SendEmailCommand({
      FromEmailAddress: "accounts@mail.parkergiven.com",
      Destination: {
        ToAddresses: [email],
      },
      ReplyToAddresses: ["pgiven14@gmail.com"],
      Content: {
        Simple: {
          Subject: {
            Data: "ParkerGiven.com Email Verification",
            Charset: "UTF-8",
          },
          Body: {
            Text: {
              Data: `Follow the link to finish creating your account: https://auth.parkergiven.com/verify?magic=${verificationCode}`,
              Charset: "UTF-8",
            },
          },
        },
      },
    });
    console.log(`Sending command: ${JSON.stringify(command)}`);
    try {
      const output: SendEmailCommandOutput = await this.client.send(command);
      console.log(`Send Email Output: ${JSON.stringify(output)}`);
      return output.MessageId;
    } catch (e: any) {
      console.error(`Error sending email: ${e}`);
      console.error(e.message);
      throw e;
    }
  }
}
