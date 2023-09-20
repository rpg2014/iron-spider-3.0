// type CFRequest = {
//     method: string,
//     uri: string,
//     querystring: string
// }
// type CFEvent = {
//     request:  CFRequest
// }

function handler(event) {
  let request = event.request;
  // the default root option of the distribution handles the root path
  if (
    !request.uri.includes(".") &&
    request.uri !== "/" &&
    !request.uri.endsWith(".html")
  ) {
    request.uri += ".html";
  }
  return request;
}
