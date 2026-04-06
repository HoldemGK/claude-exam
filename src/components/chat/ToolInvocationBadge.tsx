"use client";

import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

function getToolLabel(toolInvocation: ToolInvocation): string {
  const { toolName, args } = toolInvocation;

  if (toolName === "str_replace_editor") {
    const { command, path } = args as { command?: string; path?: string };
    const fileName = path?.split("/").pop() ?? path;
    switch (command) {
      case "create": return `Creating ${fileName}`;
      case "str_replace":
      case "insert": return `Editing ${fileName}`;
      case "view": return `Reading ${fileName}`;
      default: return `Working on ${fileName}`;
    }
  }

  if (toolName === "file_manager") {
    const { command, path } = args as { command?: string; path?: string };
    const fileName = path?.split("/").pop() ?? path;
    switch (command) {
      case "delete": return `Deleting ${fileName}`;
      case "rename": return `Renaming ${fileName}`;
      case "mkdir": return `Creating folder ${fileName}`;
      default: return toolName;
    }
  }

  return toolName;
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const label = getToolLabel(toolInvocation);
  const isDone = toolInvocation.state === "result" && toolInvocation.result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600 shrink-0" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}

export { getToolLabel };
