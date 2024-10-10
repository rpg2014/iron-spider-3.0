import { IncomingMessage, ServerResponse } from "node:http";
import { Readable } from "node:stream";

export function convertFetchToHttp(request: Request, response: Response): { req: IncomingMessage; res: ServerResponse } {
  // Convert Request to IncomingMessage
  const req = new IncomingMessage(null);
  req.method = request.method;
  req.url = request.url;
  req.headers = {};
  request.headers.forEach((value, key) => {
    req.headers[key.toLowerCase()] = value;
  });

  // Convert body to Readable stream
  if (request.body) {
    const readable = new Readable();
    readable._read = () => {}; // _read is required but you can noop it
    readable.push(request.body);
    readable.push(null);
    req.push = (chunk: any) => readable.push(chunk);
    req.read = (size: number) => readable.read(size);
  }

  // Convert Response to ServerResponse
  const res = new ServerResponse(req);
  res.statusCode = response.status;
  res.statusMessage = response.statusText;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  // Clone body to response
  if (response.body) {
    response
      .clone()
      .arrayBuffer()
      .then(buffer => {
        res.write(Buffer.from(buffer));
        res.end();
      });
  } else {
    res.end();
  }

  return { req, res };
}
