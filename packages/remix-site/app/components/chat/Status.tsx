import { CheckCircle2, Circle, CircleX } from "lucide-react";
import type { StatusResponse } from "~/genAi/spiderAssistant";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTrigger } from "../ui/Dialog";
import { Alert, AlertTitle, AlertDescription } from "../ui/Alert";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Button } from "../ui/Button";

export const AIBackendStatus = ({ status }: { status: StatusResponse | undefined }) => {
  //   const [showDialog, setShowDialog] = useState(false);
  if (!status) {
    return <Circle style={{ color: "yellow" }} />;
  }
  return (
    <Dialog>
      <DialogTrigger className="mx-5" style={{ color: status?.status == "ok" ? "green" : "red" }}>
        {status?.status == "ok" ? <CheckCircle2 /> : <CircleX />}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Backend Status</DialogTitle>
          <DialogDescription>AI Backend is {status?.status == "ok" ? "running" : "not running"}</DialogDescription>
        </DialogHeader>
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
  {
    /* <Alert variant={status?.status === 'ok'?'success': 'destructive'}>
              <AlertTitle>Status</AlertTitle>
              <AlertDescription>
              {JSON.stringify(status, null, 2)}
              </AlertDescription>
              </Alert> */
  }
};

//New settings
// import { Bird, Rabbit, Turtle } from "lucide-react"

// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import { Textarea } from "@/components/ui/textarea"

// export default function Component() {
//   return (
//     <div
//       className="relative hidden flex-col items-start gap-8 md:flex"
//     >
//       <form className="grid w-full items-start gap-6">
//         <fieldset className="grid gap-6 rounded-lg border p-4">
//           <legend className="-ml-1 px-1 text-sm font-medium">Settings</legend>
//           <div className="grid gap-3">
//             <Label htmlFor="model">Model</Label>
//             <Select>
//               <SelectTrigger
//                 id="model"
//                 className="items-start [&_[data-description]]:hidden"
//               >
//                 <SelectValue placeholder="Select a model" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="genesis">
//                   <div className="flex items-start gap-3 text-muted-foreground">
//                     <Rabbit className="size-5" />
//                     <div className="grid gap-0.5">
//                       <p>
//                         Neural{" "}
//                         <span className="font-medium text-foreground">
//                           Genesis
//                         </span>
//                       </p>
//                       <p className="text-xs" data-description>
//                         Our fastest model for general use cases.
//                       </p>
//                     </div>
//                   </div>
//                 </SelectItem>
//                 <SelectItem value="explorer">
//                   <div className="flex items-start gap-3 text-muted-foreground">
//                     <Bird className="size-5" />
//                     <div className="grid gap-0.5">
//                       <p>
//                         Neural{" "}
//                         <span className="font-medium text-foreground">
//                           Explorer
//                         </span>
//                       </p>
//                       <p className="text-xs" data-description>
//                         Performance and speed for efficiency.
//                       </p>
//                     </div>
//                   </div>
//                 </SelectItem>
//                 <SelectItem value="quantum">
//                   <div className="flex items-start gap-3 text-muted-foreground">
//                     <Turtle className="size-5" />
//                     <div className="grid gap-0.5">
//                       <p>
//                         Neural{" "}
//                         <span className="font-medium text-foreground">
//                           Quantum
//                         </span>
//                       </p>
//                       <p className="text-xs" data-description>
//                         The most powerful model for complex computations.
//                       </p>
//                     </div>
//                   </div>
//                 </SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//           <div className="grid gap-3">
//             <Label htmlFor="temperature">Temperature</Label>
//             <Input id="temperature" type="number" placeholder="0.4" />
//           </div>
//           <div className="grid grid-cols-2 gap-4">
//             <div className="grid gap-3">
//               <Label htmlFor="top-p">Top P</Label>
//               <Input id="top-p" type="number" placeholder="0.7" />
//             </div>
//             <div className="grid gap-3">
//               <Label htmlFor="top-k">Top K</Label>
//               <Input id="top-k" type="number" placeholder="0.0" />
//             </div>
//           </div>
//         </fieldset>
//         <fieldset className="grid gap-6 rounded-lg border p-4">
//           <legend className="-ml-1 px-1 text-sm font-medium">Messages</legend>
//           <div className="grid gap-3">
//             <Label htmlFor="role">Role</Label>
//             <Select defaultValue="system">
//               <SelectTrigger>
//                 <SelectValue placeholder="Select a role" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="system">System</SelectItem>
//                 <SelectItem value="user">User</SelectItem>
//                 <SelectItem value="assistant">Assistant</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//           <div className="grid gap-3">
//             <Label htmlFor="content">Content</Label>
//             <Textarea
//               id="content"
//               placeholder="You are a..."
//               className="min-h-[9.5rem]"
//             />
//           </div>
//         </fieldset>
//       </form>
//     </div>
//   )
// }
