export type ReadableStream2<R = any> = ReadableStream & {
  [Symbol.asyncIterator](): AsyncIterableIterator<R>;
};
export async function* parseEventStream(eventByteStream: ReadableStream2<Uint8Array>) {
  let buf: string | undefined = "";
  let ignoreNextLf = false;

  const textStream = eventByteStream.pipeThrough(new TextDecoderStream()) as ReadableStream2;
  for await (let chunk of textStream) {
    // A CRLF could be split between chunks, so if the last chunk ended in
    // CR and this chunk started with LF, trim the LF
    console.log(`RecivedChunk: ${JSON.stringify(chunk)}`);
    if (ignoreNextLf && /^\n/.test(chunk)) {
      chunk = chunk.slice(1);
    }
    ignoreNextLf = /\r$/.test(chunk);

    // Event streams must be parsed line-by-line (ending in CR, LF, or CRLF)
    const lines: string[] = (buf + chunk).split(/\n|\r\n?/);
    buf = lines.pop();
    let type, data;

    for (const line of lines) {
      if (!line) {
        type = undefined;
        data = undefined;
        continue;
      }
      const { name, value } = /^(?<name>.*?)(?:: ?(?<value>.*))?$/s.exec(line)?.groups;
      switch (name) {
        case "event":
          // this case is for dispatching events, or just grabs out the type data
          type = value ?? "";
          break;
        // should mainly be data b/c we are using dispatchMessage on the eventtarget
        case "data":
          // Appends the value to the data string, creating a new line if data already exists, otherwise assigns the value to data
          data = data === undefined ? value ?? "" : `${data}\n${value}`;
          break;
      }
      // We only emit message-type events for now (and assume JSON)
      if (data && (type || "message") === "message") {
        const json = JSON.parse(data); // THis is the data we're getting from the backend.
        // Both Chrome and Firefox suck at debugging
        // text/event-stream, so make it easier by logging events
        if (json.type === "error") {
          console.error(`got error message from stream ${JSON.stringify(json, null, 2)}`);
          throw new Error(json.message);
        }
        console.log("event", json);
        yield json;
        type = undefined;
        data = undefined;
      }
    }
  }
}
