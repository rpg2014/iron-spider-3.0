/**
 * Returns the message background color based on it's type.
 * @param type
 */
export function getMessageBg(type: string) {
  switch (type) {
    case "agent_thought":
      return "bg-slate-300/50";
    case "agent_response":
      return "bg-slate-500/50";
    case "tool_input":
      return "bg-green-300/50";
    case "tool_output":
      return "bg-green-700/50";
    case "user":
      return "bg-slate-800";
    default:
      return "bg-slate-300";
  }
}
