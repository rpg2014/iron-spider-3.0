import type { IronSpiderClientConfig } from "iron-spider-client";
import { IronSpiderClient, LogoutCommand, LogoutCommandInput } from "iron-spider-client";

const config: IronSpiderClientConfig = {
  region: "us-east-1",
};
const client = new IronSpiderClient(config);
export const IronSpiderAPI = {
  logout: async () => {
    let command = new LogoutCommand({});

    return await client.send(command);
  },
};
