// read from env var USE_STREAMS or false
export const useStreams = process.env.USE_STREAMS?.toLowerCase() === "true" ? true : false;
