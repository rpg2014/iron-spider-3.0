


function handler(event) {
    var request = event.request;
    var response = event.response
    // if request is for the /.well-known/openid-configuration path, add content-type 'application/json' to the headers
    // otherwise, this is a binary blob.
    if (request.uri === "/.well-known/openid-configuration") {
      response.headers["content-type"] = {
        value: "application/json"
      }
    }
    return response;
  }