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
  }