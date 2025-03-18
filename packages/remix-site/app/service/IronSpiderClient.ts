import type { DateInfo, GetOAuthTokensOutput, IronSpiderClientConfig } from "iron-spider-client";
import { IronSpiderClient, ListDatesCommand, LogoutCommand, LogoutCommandInput } from "iron-spider-client";
import { DATES_PATH, OAUTH_TOKEN_ENDPOINT } from "~/constants";
import { fetcher } from "~/utils";
import apiKeys from "../../.apiKeys.json";
import { toast } from "sonner";

const oauthConfig = {
  clientId: "123456789",
  clientSecret: "basic_client_secret",
  redirectUri: "https://remix.parkergiven.com/oauth/callback",
};
const config: IronSpiderClientConfig = {
  region: "us-east-1",
};
const client = new IronSpiderClient(config);
/**
 * cant use this b/c cant pass along header auth through the client
 */
export const IronSpiderAPI = {
  logout: async () => {
    const command = new LogoutCommand({});

    return await client.send(command);
  },
  listDates: async ({ pageSize }: { pageSize: number }) => {
    return await client.send(new ListDatesCommand({ pageSize }));
  },
  getTokens: async ({ code, refreshToken }: { code?: string; refreshToken?: string }): Promise<GetOAuthTokensOutput> => {
    if (!code && !refreshToken) {
      throw new Error("Must provide either a code or a refresh token");
    }
    const response = await fetcher(`${OAUTH_TOKEN_ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "spider-access-token": apiKeys["iron-spider-api"],
      },
      body: new URLSearchParams({
        grant_type: code ? "authorization_code" : refreshToken ? "refresh_token" : "",
        code: code ?? "",
        redirect_uri: oauthConfig.redirectUri ?? "",
        refresh_token: refreshToken ?? "",
        client_id: oauthConfig.clientId ?? "",
        client_secret: oauthConfig.clientSecret ?? "",
      }),
    });
    toast.success("[IronSpiderAPI Client", {
      description: "Successful GetTokens call",
      
    })
    console.log("[IronSpiderAPI] getTokens response", response);
    return response as GetOAuthTokensOutput;
  },
};
