// type CFRequest = {
//     method: string,
//     uri: string,
//     querystring: string
// }
// type CFEvent = {
//     request:  CFRequest
// }

exports.handler = (event) => {
    let request = event.request;
    // the default root option of the distribution handles the root path
    if(request.uri !== "/"){
        request.uri += ".html"
    }
    return request;
  }