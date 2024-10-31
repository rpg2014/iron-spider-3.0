import { CircleCheck, CircleOff, CircleEllipsis } from "lucide-react";
import { useServers } from "~/hooks/MCServerHooks";
import { ServerStatus } from "~/service/MCServerService";
import { Skeleton } from "../ui/Skeleton";

interface StatusConfig {
  color: string;
  Icon: React.ComponentType<{ className: string }>;
}

const statusConfigs: Record<ServerStatus | "default", StatusConfig | undefined> = {
  [ServerStatus.InitialStatus]: {
    color: "bg-gray-500",
    Icon: ({ className }) => <Skeleton className={`h-3 w-3 rounded-full ${className}`} />,
  },
  [ServerStatus.Running]: {
    color: "text-green-500 animate-bounce",
    Icon: ({ className }) => <CircleCheck className={className} />,
  },
  [ServerStatus.Terminated]: {
    color: "text-red-500",
    Icon: ({ className }) => <CircleOff className={className} />,
  },
  default: {
    color: "text-blue-500",
    Icon: ({ className }) => <CircleEllipsis className={className} />,
  },
  [ServerStatus.Pending]: undefined,
  [ServerStatus.Stopping]: undefined,
  [ServerStatus.ShuttingDown]: undefined,
  [ServerStatus.Stopped]: undefined,
};

export const ServerNavMenuItem: React.FC = () => {
  const { minecraftServer } = useServers();
  const status = minecraftServer?.status ?? ServerStatus.InitialStatus;
  const { color, Icon } = (statusConfigs[status] || statusConfigs["default"]) as StatusConfig;

  return (
    <span className="flex flex-row justify-between items-center w-100">
      Server
      <Icon className={`${color} h-3 w-3 rounded-full ml-2`} />
    </span>
  );
};
