import { Id } from "@/convex/_generated/dataModel";

export const SSE_DATA_PREFIX = "data:" as const;
export const SSE_DONE_MESSAGE = "[Done]" as const; // Fixed missing closing bracket
export const SSE_LINE_DELIMITER = "\n\n" as const;

export type MessageRole = "user" | "assistant"; // Changed "User" to "user" for consistency
export interface Message {
  role: MessageRole;
  content: string;
}

export interface ChatRequestBody {
  messages: Message[];
  newMessage: string; // Fixed typo (newMessages -> newMessage)
  chatId: Id<"chats">;
}

export enum StreamMessageType { // Fixed enum name (StreamMessagetype -> StreamMessageType)
  Token = "token",
  Error = "error",
  Connect = "connect",
  Done = "done",
  ToolStart = "tool_start",
  ToolEnd = "tool_end",
}

export interface BaseStreamMessage {
  type: StreamMessageType; // Fixed enum reference
}

export interface TokenMessage extends BaseStreamMessage {
  type: StreamMessageType.Token; // Fixed enum reference
}

export interface ErrorMessage extends BaseStreamMessage {
  type: StreamMessageType.Error; // Fixed enum reference
}

export interface ConnectMessage extends BaseStreamMessage {
  type: StreamMessageType.Connect; // Fixed enum reference
}

export interface DoneMessage extends BaseStreamMessage {
  type: StreamMessageType.Done; // Fixed enum reference
}

export interface ToolStartMessage extends BaseStreamMessage { // Fixed interface name (ToolsStartMessage -> ToolStartMessage)
  type: StreamMessageType.ToolStart; // Fixed enum reference
}

export interface ToolEndMessage extends BaseStreamMessage {
  type: StreamMessageType.ToolEnd; // Fixed enum reference
}

export type StreamMessage =
  | TokenMessage
  | ErrorMessage
  | ConnectMessage
  | DoneMessage
  | ToolStartMessage // Fixed interface name
  | ToolEndMessage;