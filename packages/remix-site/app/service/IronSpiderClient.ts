import type { DateInfo, GetOAuthTokensOutput, IronSpiderClientConfig, OAuthLogoutOutput } from "iron-spider-client";
import { IronSpiderClient, ListDatesCommand, LogoutCommand, LogoutCommandInput } from "iron-spider-client";
import { DATES_PATH, OAUTH_LOGOUT_ENDPOINT, OAUTH_TOKEN_ENDPOINT } from "~/constants";
import { fetcher, getAPIKey, getClientId, getLogoutRedirectUrl, isServer } from "~/utils";

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
  getTokens: async ({
    code,
    refreshToken,
    codeVerifier,
    oauthConfig,
  }: {
    code?: string;
    refreshToken?: string;
    codeVerifier?: string;
    oauthConfig: { clientId?: string; clientSecret?: string; redirectUri?: string };
  }): Promise<GetOAuthTokensOutput> => {
    if (!code && !refreshToken) {
      throw new Error("Must provide either a code or a refresh token");
    }
    const body = new URLSearchParams({
      grant_type: code ? "authorization_code" : refreshToken ? "refresh_token" : "",
      code: code ?? "",
      redirect_uri: oauthConfig.redirectUri ?? "",
      refresh_token: refreshToken ?? "",
      client_id: oauthConfig.clientId ?? "",
      client_secret: oauthConfig.clientSecret ?? "",
    });
    if (codeVerifier) {
      body.set("code_verifier", codeVerifier ?? "");
    }

    const response = await fetcher(`${OAUTH_TOKEN_ENDPOINT}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "spider-access-token": getAPIKey(),
      },
      body,
    });
    console.log("[IronSpiderAPI] getTokens response", response);
    return response as GetOAuthTokensOutput;
  },
  /**
   * Server only, this needs to be fixed, / aligned with backend
   * @param param0
   */
  oauthLogout: async ({ idToken }: { idToken: string }) => {
    console.log("[IronSpiderAPI] oauthLogout called with idToken", idToken);

    if (!isServer) {
      throw new Error("This method can only be called on the server");
    }
    const state = Math.random().toString(36).substring(7);
    console.log("[IronSpiderAPI] generated state", state);

    const params = new URLSearchParams({
      id_token_hint: encodeURIComponent(idToken),
      post_logout_redirect_uri: getLogoutRedirectUrl(),
      state: state,
    });
    console.log("[IronSpiderAPI] logout params", params.toString());

    const response = await fetcher<OAuthLogoutOutput>(`${OAUTH_LOGOUT_ENDPOINT}?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "spider-access-token": getAPIKey(),
      },
    });
    console.log("[IronSpiderAPI] oauthLogout response", response);
    return response;
  },
};
