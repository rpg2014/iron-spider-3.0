import type { DateInfo, IronSpiderClientConfig } from "iron-spider-client";
import { IronSpiderClient, ListDatesCommand, LogoutCommand, LogoutCommandInput } from "iron-spider-client";
import { DATES_PATH } from "~/constants";
import { fetcher } from "~/utils";

const config: IronSpiderClientConfig = {
  region: "us-east-1",
};
const client = new IronSpiderClient(config);
/**
 * cant use this b/c cant pass along header auth through the client
 */
export const IronSpiderAPI = {
  logout: async () => {
    let command = new LogoutCommand({});

    return await client.send(command);
  },
  listDates: async ({ pageSize }: { pageSize: number }) => {
    return await client.send(new ListDatesCommand({ pageSize }));
  },
};
