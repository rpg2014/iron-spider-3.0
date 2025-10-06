import { ServerNavMenuItem } from "./ServerNavMenuItem";
import { Wrench, Zap, Code, Box, ExternalLink, MessageSquare, Link2, Cookie, Settings } from "lucide-react";

export const ProjectsNavItems = [
  {
    to: "/chat",
    label: "Chat",
    icon: MessageSquare,
    color: "from-blue-500 to-purple-500",
    description: "AI Chat Interface",
  },
  {
    to: "/intranetLinks",
    label: "Links",
    icon: Link2,
    color: "from-cyan-500 to-blue-500",
    description: "Quick Links & Resources",
  },
  {
    to: "/wasm",
    label: "Wasm",
    icon: Code,
    color: "from-red-500 to-orange-500",
    description: "WebAssembly Experiments",
  },
  {
    to: "/cookies",
    label: "Cookies",
    icon: Cookie,
    color: "from-red-500 to-blue-500",
    description: "Cookie Management",
  },
  {
    to: "/settings",
    label: "Settings",
    icon: Settings,
    color: "from-slate-500 to-slate-600",
    description: "Application Settings",
  },
];

export const mainNavItems = [
  {
    to: "/",
    text: "Home",
    icon: Wrench,
    color: "from-blue-500 to-cyan-500",
    description: "Home Dashboard",
  },
  {
    to: "/mc-server",
    text: "Server",
    component: ServerNavMenuItem,
    icon: Box,
    color: "from-green-500 to-emerald-500",
    description: "Minecraft Server Control",
  },
  {
    to: "/grocery-list",
    text: "Grocery List",
    icon: Zap,
    color: "from-purple-500 to-pink-500",
    description: "Shared Grocery List",
  },
  {
    to: "/dates",
    text: "Date Tracker",
    icon: Code,
    color: "from-orange-500 to-red-500",
    description: "Log dates with your partner",
  },
];
