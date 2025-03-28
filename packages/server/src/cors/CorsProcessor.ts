import { HttpRequest } from "@aws-sdk/protocol-http";
import { DELIMITER } from "../constants/common";
const ALLOW_HEADERS = "content-type, spider-access-token, Authorization";

/**

  Validates the CORS request and returns the allowed origin and headers.
  uses regex to match the subdomain and mirror it if it is in the allowed subdomains list
  
  @param {HttpRequest} request - The HTTP request object
  @param {any} handlerContext - The handler context
  @returns {{origin: string, headers: string}} - An object with the allowed origin and headers 
*/
export const validateCors = (request: HttpRequest, handlerContext?: any): { origin: string; headers: string } => {
  const domainName = process.env.DOMAIN;
  if (!domainName) {
    throw new Error("Domain name not set");
  }
  const origin = request.headers.origin || request.headers.Origin;
  if (!origin || origin == null) {
    throw new Error("Origin header not set");
  }
  console.debug("got domain " + origin);
  // check domain
  const match = origin.matchAll(/^https:\/\/([a-z]+).parkergiven\.com$/g);

  const captureGroups = [...match].at(0)?.slice(0, 2);
  console.log(JSON.stringify(captureGroups));
  if (captureGroups == undefined || captureGroups.at(0) === null) {
    console.error("Origin is not from the domain: " + domainName);
    throw new Error("Origin is not from the domain: " + domainName);
  }
  let returnOrigin;
  if (captureGroups.length == 2) {
    const subdomain = captureGroups.at(-1);
    const subdomains = process.env.SUB_DOMAINS?.split(DELIMITER);
    console.debug("Subdomains: " + JSON.stringify(subdomains) + " Subdomain: " + subdomain);
    if (subdomains && subdomain && subdomains.includes(subdomain)) {
      returnOrigin = `https://${captureGroups.at(-1)}.${process.env.DOMAIN}`;
    } else {
      console.error(`Sub domain ${subdomain} not in allowed subdomains list`);
      console.error(`Subdomains: ${JSON.stringify(subdomains)} Subdomain: ${subdomain}`);
      throw new Error(`Sub domain ${subdomain} not in allowed subdomains list`);
    }
  } else if (captureGroups.at(0) === `https://${process.env.DOMAIN}`) {
    returnOrigin = `https://${process.env.DOMAIN}`;
  } else {
    console.error(`Origin ${origin} is not from the domain: ${domainName}`);
    throw new Error(`Origin ${origin} is not from the domain: ${domainName}`);
  }
  console.debug("return origin: " + returnOrigin);
  return {
    origin: returnOrigin,
    headers: ALLOW_HEADERS,
  };
};
