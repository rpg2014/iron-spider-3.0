export interface event {
    "type": "REQUEST",
    "methodArn": string,
    "resource": string,
    "path": string,
    "httpMethod":   string,
    "headers": {
        [key: string]: string,
        "spider-access-token": string,
      
    },
    "queryStringParameters": {
      [key: string]: string
    },
    "requestContext": {
      "path": string,
      "accountId": string,
      "resourceId": string,
      "stage": string,
      "requestId": string,
      "identity": {
        "apiKey": string,
        "sourceIp": string
        "clientCert": {
          [key: string]: string
          }
        }
      },
      "resourcePath": string,
      "apiId": "abcdef123"
    }
  