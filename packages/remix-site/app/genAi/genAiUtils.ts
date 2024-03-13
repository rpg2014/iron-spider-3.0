// Function to parse text/event-stream data and yield JSON objects

import { parseEventStream } from "./coreUtils";
import { llamaCppCompletion, llamaCppTokenCount } from "./llamaCPP";


export type AIEndpointSettings = {
	endpoint: string;
    endpointAPIType: "llama.cpp"  | "claude" | "openai"; // 0: llama.cpp, 1: koboldcpp, 2: openai
    endpointAPIKey?: string;
}
export type CompletionOptions = {
   endpointSettings: AIEndpointSettings
    signal?: AbortSignal;
    options: {
		prompt: string,
	}| any,
}
export type AISettings = {
	temperature: number,
	top_k: number,
	top_p: number,
    n_predict: number,
    n_keep: number,
}



export async function* completion({ endpointSettings, signal, ...options }: CompletionOptions) {
	// switch (endpointAPI) {
	// 	case 0: // llama.cpp
			return yield* await llamaCppCompletion({ endpointSettings, signal, ...options });
	// 	case 2: // koboldcpp
	// 		return yield* await koboldCppCompletion({ endpoint, signal, ...options });
	// 	case 3: // openai
	// 		return yield* await openaiCompletion({ endpoint, endpointAPIKey, signal, ...options });
	// }
}
export async function getTokenCount({ endpointSettings, signal, ...options }: CompletionOptions) {
	// switch (endpointAPI) {
		// case 0: // llama.cpp
			return await llamaCppTokenCount({ endpointSettings, signal, ...options });
		// case 2: // koboldcpp
		// 	return await koboldCppTokenCount({ endpoint, signal, ...options });
		// case 3: // openai // TODO: Fix this for official OpenAI?
		// 	let tokenCount = 0;
		// 	tokenCount = await openaiOobaTokenCount({ endpoint, signal, ...options });
		// 	if (tokenCount != -1)
		// 		return tokenCount;
		// 	tokenCount = await openaiTabbyTokenCount({ endpoint, endpointAPIKey, signal, ...options });
		// 	if (tokenCount != -1)
		// 		return tokenCount;
		// 	return 0;
	// }
}