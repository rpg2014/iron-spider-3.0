export const shouldCache = (request: Request): boolean=> {
  const url = new URL(request.url);
  // Only cache GET requests for assets
  if (request.method !== "GET") {
    return false;
  }
  
  // Cache only /assets paths or "/"
  return url.pathname.startsWith("/assets") || url.pathname === "/";
}

