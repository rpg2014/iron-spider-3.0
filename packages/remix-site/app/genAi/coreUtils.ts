export async function* parseEventStream(eventStream) {
	let buf = '';
	let ignoreNextLf = false;

	for await (let chunk of eventStream.pipeThrough(new TextDecoderStream())) {
		// A CRLF could be split between chunks, so if the last chunk ended in
		// CR and this chunk started with LF, trim the LF
		if (ignoreNextLf && /^\n/.test(chunk)) {
			chunk = chunk.slice(1);
		}
		ignoreNextLf = /\r$/.test(chunk);

		// Event streams must be parsed line-by-line (ending in CR, LF, or CRLF)
		const lines = (buf + chunk).split(/\n|\r\n?/);
		buf = lines.pop();
		let type, data;

		for (const line of lines) {
			if (!line) {
				type = undefined;
				data = undefined;
				continue;
			}
			const { name, value } = /^(?<name>.*?)(?:: ?(?<value>.*))?$/s.exec(line).groups;
			switch (name) {
				case 'event':
					type = (value ?? '');
					break;
				case 'data':
					data = data === undefined ? (value ?? '') : `${data}\n${value}`;
					break;
			}
			// We only emit message-type events for now (and assume JSON)
			if (data && (type || 'message') === 'message') {
				const json = JSON.parse(data);
				// Both Chrome and Firefox suck at debugging
				// text/event-stream, so make it easier by logging events
				console.log('event', json);
				yield json;
				type = undefined;
				data = undefined;
			}
		}
	}
}
