import { HttpRequest } from "@aws-sdk/protocol-http";
import { CorsOperation, validateCors } from "./cors_handler";

describe("Cors handler", () => {

    beforeEach(()=> {
        process.env.DOMAIN = "parkergiven.com";
        process.env.SUB_DOMAINS = "auth, pwa, remix";
    })
//   it("should return the correct CORS headers", async () => {
//     const request = new HttpRequest({
//       headers: {
//         Origin: "https://parkergiven.com",
//       },
//     });

//     const allowed = validateCors(request, {});
//     expect(allowed.origin).toEqual("https://parkergiven.com");
//     expect(allowed.headers).toEqual("content-type, spider-access-token");

    
//   });

  it("should   correct headers when called from auth subdomain", async () => {
    const request = new HttpRequest({
      headers: {
        Origin: "https://auth.parkergiven.com",
      },
    });

    const allowed = validateCors(request, {});
    expect(allowed.origin).toEqual("https://auth.parkergiven.com");
    expect(allowed.headers).toEqual("content-type, spider-access-token");
  });

  it("should and correct headers when called from pwa subdomain", async () => {
    const request = new HttpRequest({
      headers: {
        Origin: "https://pwa.parkergiven.com",
      },
    });

    const allowed = validateCors(request, {});
    expect(allowed.origin).toEqual("https://pwa.parkergiven.com");
    expect(allowed.headers).toEqual("content-type, spider-access-token");
  });
  it("should  correct headers when called from remix subdomain", async () => {
    const request = new HttpRequest({
      headers: {
        Origin: "https://remix.parkergiven.com",
      },
    });

    const response = await CorsOperation.handle(request, {});

    const allowed = validateCors(request, {});
    expect(allowed.origin).toEqual("https://remix.parkergiven.com");
    expect(allowed.headers).toEqual("content-type, spider-access-token");
  });

  it("should throwcalled from a different domain", async () => {
    const request = new HttpRequest({
      headers: {
        Origin: "https://example.com",
      },
    });

    expect(() => validateCors(request, {})).toThrowError()
});
});
