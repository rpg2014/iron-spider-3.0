import { CheckCircle2, Circle, CircleX } from "lucide-react";
import type { StatusResponse } from "~/genAi/spiderAssistant";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTrigger } from "../ui/Dialog";
import { Alert, AlertTitle, AlertDescription } from "../ui/Alert";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Button } from "../ui/Button";
import { useState, useEffect, useRef } from "react";
import { Slider } from "~/components/ui/Slider";
import { Input } from "~/components/ui/Input";
import { Label } from "~/components/ui/Label";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "../ui/Drawer.client";

export const AIBackendStatus = ({
  status,
  temperature,
  setTemperature,
  maxTokens,
  setMaxTokens,
}: {
  status: StatusResponse | undefined;
  temperature: number;
  setTemperature: (value: number) => void;
  maxTokens: number;
  setMaxTokens: (value: number) => void;
}) => {
  const [innerWidth, setInnerWidth] = useState(window?.innerWidth);
  const [isSmallScreen, setIsSmallScreen] = useState(window?.innerWidth < 768);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);

  // set value on unmount
  useEffect(() => {
    return () => {
      if (inputRef.current) {
        setMaxTokens((inputRef.current as HTMLInputElement).valueAsNumber);
      }
    };
  }, []);
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(innerWidth < 768); // 768px is typical md breakpoint
    };

    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  if (!status) {
    return <Circle style={{ color: "yellow" }} />;
  }

  const handleTemperatureChange = (e: number[] | string[]) => {
    if (typeof e[0] === "number") setTemperature(e[0]);
    else if (typeof e[0] === "string") setTemperature(parseFloat(e[0]));
  };

  const handleMaxTokensChange = (e: { target: { value: string } }) => {
    setMaxTokens(parseInt(e.target.value));
  };

  const ContentComponent = () => (
    <>
      {status.status === "ok" && (
        <Alert className="" variant={"success"}>
          <AlertTitle>Success:</AlertTitle>
          <AlertDescription>
            <pre>{JSON.stringify(status, null, 2)}</pre>
          </AlertDescription>
        </Alert>
      )}
      {status?.status === "error" && (
        <Alert className="" variant="light_destructive">
          <AlertTitle>Error:</AlertTitle>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}
      <div className="settings-content">
        <h2 className="mb-1">Global Settings</h2>
        <Label className="model-label my-2">
          Temperature:
          <Slider
            className="my-1 cursor-ew-resize"
            min={0}
            max={1}
            step={0.1}
            // value={[temperature]}
            defaultValue={[temperature]}
            // onValueChange={handleTemperatureChange}
            onValueCommit={handleTemperatureChange}
          />
          {temperature.toFixed(1)}
        </Label>
        <Label className="modal-label">
          Max Tokens:
          <Input
            ref={inputRef}
            className="my-1"
            type="number"
            min="1"
            max="8096"
            // value={maxTokens}
            defaultValue={maxTokens}
            onBlur={handleMaxTokensChange}
          />
        </Label>
      </div>
    </>
  );

  const triggerButton = (
    <div className="mx-5" style={{ color: status?.status == "ok" ? "green" : "red" }}>
      {status?.status == "ok" ? <CheckCircle2 /> : <CircleX />}
    </div>
  );

  return isSmallScreen ? (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>AI Backend Status and Settings</DrawerTitle>
          <DrawerDescription>AI Backend is {status?.status == "ok" ? "running" : "not running"}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4">
          <ContentComponent />
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ) : (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Backend Status and Settings</DialogTitle>
          <DialogDescription>AI Backend is {status?.status == "ok" ? "running" : "not running"}</DialogDescription>
        </DialogHeader>
        <ContentComponent />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
