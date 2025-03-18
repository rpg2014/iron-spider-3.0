export interface HandlerContext {
    //legacy
    /**
     * @deprecated
     */
    user?: string;
  
    //new
    userId?: string;
    displayName?: string;
    siteAccess?: string
    apiAccess?: string
    tokenExpiry?: string,
    integrationLatency?: string
    oauth?: { // jSONFIed clientId and scopes
      clientId: string
      scopes: string[]
    }
  }
  export interface HandlerContextFromAuthorizer {
    //legacy
    /**
     * @deprecated
     */
    user?: string;
  
    //new
    userId?: string;
    displayName?: string;
    siteAccess?: string
    apiAccess?: string
    tokenExpiry?: string,
    integrationLatency?: string
    oauth?: string// jSONFIed clientId and scopes
  }