import { getConvexClient } from "@/lib/convex";
import { ChatRequestBody, SSE_DATA_PREFIX, SSE_LINE_DELIMITER, StreamMessage, StreamMessageType } from "@/lib/types";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";

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
    const { userId } = await auth(); // Removed `await` since `auth()` is synchronous
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

        await sendSSEMessage(writer, { type: StreamMessageType.Done }); // Signal completion
      } catch (error) {
        console.error("Error in stream:", error);
        await sendSSEMessage(writer, { type: StreamMessageType.Error }); // Signal error
      } finally {
        await writer.close(); // Close the stream
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