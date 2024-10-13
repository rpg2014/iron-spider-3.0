// The following code is licensed under MIT-0
import { readFileSync } from "node:fs";
import Velocity from "velocityjs";
import { describe, expect, test, it } from "@jest/globals";

describe("async-integration", () => {
  it("should map aws integration request to APIG proxy event input correctly", async () => {
    const requestTemplate = readFileSync("lib/async-integration.vm", "utf8");
    const requestTemplateAsString = Velocity.render(requestTemplate, {
      // Mocks the variables provided by API Gateway
      context: {
        requestTimeEpoch: 10000,
        path: "/server/stop",
        authorizer: {
          siteAccess: "all",
          apiAccess: "all,ai",
          userId: "1",
          displayName: "John Doe",
          integrationLatency: 100,
          principleId: "1",
        },
        httpMethod: "POST",
        protocol: "HTTP/1.1",
        resourcePath: "/server/stop",
        stage: "prod",
        sourceIp: "192.168.0.1/32",
      },
      input: {
        params: () => {
          return {
            header: {
              origin: "https://remix.parkergiven.com",
              "accept-encoding": "gzip, deflate, br, zstd",
            },
          };
        },
      },
    });

    const sdkJsonRequestBody = JSON.parse(requestTemplateAsString);
    console.log(sdkJsonRequestBody);
    expect(sdkJsonRequestBody.requestContext.authorizer.userId).toEqual("1");
    expect(sdkJsonRequestBody).toHaveProperty("requestContext.authorizer.userId", "1");
    // check httpMethod, path, multivalueHeaders for origin
    expect(sdkJsonRequestBody).toHaveProperty("httpMethod", "POST");
    expect(sdkJsonRequestBody).toHaveProperty("path", "/server/stop");
    expect(sdkJsonRequestBody).toHaveProperty("multiValueHeaders.origin", ["https://remix.parkergiven.com"]);
  });
});
