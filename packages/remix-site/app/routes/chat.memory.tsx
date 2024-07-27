import { useEffect, useState } from "react";

import Messages from "~/components/chat/Messages/Messages.client";
import type { Message } from "~/components/chat/Messages/model";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/Alert";
import { assistant } from "~/genAi/spiderAssistant";

const Memory = () => {
  const [memory, setMemory] = useState<{ messages?: Message[] } | any>();
  const [error, setError] = useState<{ message: string } | undefined>();
  useEffect(() => {
    const fn = async () => {
      assistant.memory.get().then(setMemory).catch(setError);
    };
    fn();
  }, []);

  return (
    <div className="flex flex-col justify-center">
      <h1 className="">Memory</h1>
      {memory?.messages !== undefined && (
        <div>
          <Messages messages={memory?.messages} />
        </div>
      )}
      <pre style={{ wordWrap: "break-word" }}>{JSON.stringify({ summary: memory?.summary, memory: memory?.memory }, null, 2)}</pre>
      {error && (
        <Alert className="mt-5" variant={"light_destructive"}>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default Memory;
