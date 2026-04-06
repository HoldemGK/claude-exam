import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge, getToolLabel } from "../ToolInvocationBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

// --- getToolLabel unit tests ---

test("getToolLabel: str_replace_editor create", () => {
  expect(getToolLabel({ toolName: "str_replace_editor", args: { command: "create", path: "src/components/Card.tsx" }, toolCallId: "1", state: "call" })).toBe("Creating Card.tsx");
});

test("getToolLabel: str_replace_editor str_replace", () => {
  expect(getToolLabel({ toolName: "str_replace_editor", args: { command: "str_replace", path: "src/App.tsx" }, toolCallId: "1", state: "call" })).toBe("Editing App.tsx");
});

test("getToolLabel: str_replace_editor insert", () => {
  expect(getToolLabel({ toolName: "str_replace_editor", args: { command: "insert", path: "src/App.tsx" }, toolCallId: "1", state: "call" })).toBe("Editing App.tsx");
});

test("getToolLabel: str_replace_editor view", () => {
  expect(getToolLabel({ toolName: "str_replace_editor", args: { command: "view", path: "src/index.tsx" }, toolCallId: "1", state: "call" })).toBe("Reading index.tsx");
});

test("getToolLabel: str_replace_editor unknown command falls back to Working on", () => {
  expect(getToolLabel({ toolName: "str_replace_editor", args: { command: "undo_edit", path: "src/foo.tsx" }, toolCallId: "1", state: "call" })).toBe("Working on foo.tsx");
});

test("getToolLabel: str_replace_editor uses basename of nested path", () => {
  expect(getToolLabel({ toolName: "str_replace_editor", args: { command: "create", path: "src/components/ui/Button.tsx" }, toolCallId: "1", state: "call" })).toBe("Creating Button.tsx");
});

test("getToolLabel: file_manager delete", () => {
  expect(getToolLabel({ toolName: "file_manager", args: { command: "delete", path: "src/old.tsx" }, toolCallId: "1", state: "call" })).toBe("Deleting old.tsx");
});

test("getToolLabel: file_manager rename", () => {
  expect(getToolLabel({ toolName: "file_manager", args: { command: "rename", path: "src/Foo.tsx" }, toolCallId: "1", state: "call" })).toBe("Renaming Foo.tsx");
});

test("getToolLabel: file_manager mkdir", () => {
  expect(getToolLabel({ toolName: "file_manager", args: { command: "mkdir", path: "src/components/new-dir" }, toolCallId: "1", state: "call" })).toBe("Creating folder new-dir");
});

test("getToolLabel: file_manager unknown command falls back to tool name", () => {
  expect(getToolLabel({ toolName: "file_manager", args: { command: "unknown", path: "src/foo.tsx" }, toolCallId: "1", state: "call" })).toBe("file_manager");
});

test("getToolLabel: unknown tool returns tool name", () => {
  expect(getToolLabel({ toolName: "some_other_tool", args: {}, toolCallId: "1", state: "call" })).toBe("some_other_tool");
});

// --- ToolInvocationBadge rendering tests ---

function makeTool(overrides: Partial<ToolInvocation> = {}): ToolInvocation {
  return {
    toolCallId: "test-id",
    toolName: "str_replace_editor",
    args: { command: "create", path: "src/Button.tsx" },
    state: "call",
    ...overrides,
  } as ToolInvocation;
}

test("ToolInvocationBadge shows label", () => {
  render(<ToolInvocationBadge toolInvocation={makeTool()} />);
  expect(screen.getByText("Creating Button.tsx")).toBeDefined();
});

test("ToolInvocationBadge shows spinner when in-progress", () => {
  const { container } = render(<ToolInvocationBadge toolInvocation={makeTool({ state: "call" })} />);
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolInvocationBadge shows green dot when result present", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={makeTool({ state: "result", result: "ok" } as ToolInvocation)} />
  );
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("ToolInvocationBadge still shows spinner when state is result but result is falsy", () => {
  const { container } = render(
    <ToolInvocationBadge toolInvocation={makeTool({ state: "result", result: "" } as ToolInvocation)} />
  );
  expect(container.querySelector(".animate-spin")).toBeDefined();
});

test("ToolInvocationBadge renders editing label for str_replace", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeTool({ args: { command: "str_replace", path: "src/App.tsx" } })}
    />
  );
  expect(screen.getByText("Editing App.tsx")).toBeDefined();
});

test("ToolInvocationBadge renders file_manager delete label", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeTool({ toolName: "file_manager", args: { command: "delete", path: "src/Old.tsx" } })}
    />
  );
  expect(screen.getByText("Deleting Old.tsx")).toBeDefined();
});
