import { getConvexClient } from "@/lib/convex";
import { ChatRequestBody, SSE_DATA_PREFIX, SSE_LINE_DELIMITER, StreamMessage, StreamMessageType } from "@/lib/types";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { submitQuestion } from "@/lib/langgraph";

function sendSSEMessage(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  data: StreamMessage
) {
  const encoder = new TextEncoder();
  return writer.write(
    encoder.encode(`${SSE_DATA_PREFIX}${JSON.stringify(data)}${SSE_LINE_DELIMITER}`)
  );
}

export async function POST(req: Request) {
  try {
    const { userId } = auth(); // Removed `await` since `auth()` is synchronous
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, newMessage, chatId } = (await req.json()) as ChatRequestBody;

    const convex = getConvexClient();

    const stream = new TransformStream({}, { highWaterMark: 1024 }); // Fixed syntax
    const writer = stream.writable.getWriter();
    const response = new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive", // Fixed typo
        "x-Accel-buffering": "no",
      },
    });

    const startStream = async () => {
      try {
        await sendSSEMessage(writer, { type: StreamMessageType.Connect }); // Fixed enum reference
        await convex.mutation(api.messages.send, {
          chatId,
          content: newMessage,
        });

        const langChainMessages = [
          ...messages.map((message) =>
            message.role === 'user'
              ? new HumanMessage(message.content)
              : new AIMessage(message.content)
          ),
          new HumanMessage(newMessage),
        ];

        try {
          const eventStream = await submitQuestion(langChainMessages, chatId);

          for await (const event of eventStream) {
            if (event.event === 'on_chat_model_stream') {
              const token = event.data.chunk;
              if (token) {
                const text = token.content.at(0)?.['text'];

                if (text) {
                  await sendSSEMessage(writer, {
                    type: StreamMessageType.Token,
                    token: text,
                  });
                }
              }
            } else if (event.event === "on_tool_start") {
              await sendSSEMessage(writer, {
                type: StreamMessageType.ToolStart,
                tool: event.name,
                input: event.data.input,
              });
            } else if (event.event === "on_tool_end") {
              await sendSSEMessage(writer, {
                type: StreamMessageType.ToolEnd,
                tool: ToolMessage.name,
                output: event.data.output,
              });
            }
          }

          await sendSSEMessage(writer, { type: StreamMessageType.Done });
        } catch (streamError) {
          console.error("Error in event stream: ", streamError);

          await sendSSEMessage(writer, {
            type: StreamMessageType.Error,
            error: streamError instanceof Error
              ? streamError.message
              : "Stream processing failed",
          });
        }
      } catch (error) {
        console.error("Error in stream:", error);
        await sendSSEMessage(writer, {
          type: StreamMessageType.Error,
          error: error instanceof Error
            ? error.message
            : "Stream processing failed",
        });
      } finally {
        try {
          await writer.close();
        } catch (e) {
          console.error("Error closing SSE stream:", e);
        }
      }
    };

    startStream(); // Start the stream
    return response;
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process request" } as const,
      { status: 500 }
    );
  }
}