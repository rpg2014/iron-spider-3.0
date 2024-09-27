import { CheckCircle2, Circle, CircleX } from "lucide-react";
import { useEffect, useState } from "react";

import Messages from "~/components/chat/Messages/Messages.client";
import type { Message } from "~/components/chat/Messages/model";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/Alert";
import { assistant } from "~/genAi/spiderAssistant";

const Memory = () => {
  const [memory, setMemory] = useState<{ messages?: Message[] } | any>();
  const [newMemory, setNewMemory] = useState<{ messages?: Message[] }>();
  const [error, setError] = useState<{ message: string } | undefined>();
  const [newError, setNewError] = useState<{ message: string }>();
  const [memsAreEqual, setMemsAreEqual] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    const fn = async () => {
      assistant.memory.chat.get("1").then(setNewMemory).catch(setNewError);
      assistant.memory.get().then(setMemory).catch(setError);
    };
    fn();
  }, []);

  // useEffect(() => {
  //   if (memory && newMemory) {
  //     setMemsAreEqual(JSON.stringify(memory) === JSON.stringify(newMemory));
  //     // print diff
  //     console.log("memory", memory, "newMemory", newMemory);
  //   }
  // }, [memory, newMemory]);

  return (
    <div className="flex flex-col justify-center">
      <div className="flex flex-row justify-between">
        <h1 className="">Memory</h1>
        {/* {memsAreEqual === undefined ? (
          <span className="flex flex-row">
            <Circle style={{ color: "yellow" }} />
            Loading
          </span>
        ) : (
          <div className="mx-5" style={{ color: memsAreEqual ? "green" : "red" }}>
            {memsAreEqual ? (
              <span className="flex flex-row">
                <CheckCircle2 />
                Equal
              </span>
            ) : (
              <CircleX />
            )}
          </div>
        )} */}
      </div>
      {(memory?.messages !== undefined || newMemory?.messages !== undefined) && (
        <div>
          {/* newMemory messages if present, else memory.messages */}
          <Messages messages={newMemory?.messages || memory?.messages} />
        </div>
      )}
      {/* <pre style={{ wordWrap: "break-word" }}>{JSON.stringify(memory?.memory, null, 2)}</pre> */}
      {error && (
        <Alert className="mt-5" variant={"light_destructive"}>
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      {newError && (
        <Alert className="mt-5" variant={"light_destructive"}>
          <AlertTitle>Error with new chat memory call</AlertTitle>
          <AlertDescription>{newError.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default Memory;
