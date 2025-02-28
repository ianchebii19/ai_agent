'use client';

import { Doc, Id } from '@/convex/_generated/dataModel';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ChatRequestBody, StreamMessageType } from '@/lib/types';
import { createSSEParser } from '@/lib/createSSEParser';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex';
import MessageBubble from './MessageBubble';

interface ChatInterfaceProps {
  chatId: Id<'chats'>;
  initialMessages: Doc<'messages'>[];
}

function ChatInterface({ chatId, initialMessages }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Doc<'messages'>[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  const [currentTool, setCurrentTool] = useState<{
    name: string;
    input: unknown;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const processStream = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    onChunk: (chunk: string) => Promise<void>
  ) => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        await onChunk(new TextDecoder().decode(value));
      }
    } finally {
      reader.releaseLock();
    }
  };

  const formatToolOutput = (output: unknown): string => {
    if (typeof output === 'string') return output;
    return JSON.stringify(output, null, 2);
  };

  const formatTerminalOutput = (tool: string, input: unknown, output: unknown) => {
    const terminalHtml = `
      <div class="bg-[#1e1e1e] text-white font-mono p-2 rounded-md my-2 overflow-x-auto whitespace-normal max-w-[600px]">
        <div class="flex items-center gap-1.5 border-b border-gray-700 pb-1">
          <span class="text-red-500">●</span>
          <span class="text-yellow-500">●</span>
          <span class="text-gray-500">●</span>
          <span class="text-green-500">●</span>
        </div>
        <div class="text-red-500">$ Input</div>
        <div class="text-yellow-500">$ Input</div>
        <div class="text-green-500">$ Input</div>
        <div class="text-gray-500">$ Input</div>
      </div>
    `;

    return `___START___\n${terminalHtml}`;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedResponse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    setInput('');
    setStreamedResponse('');
    setCurrentTool(null);
    setLoading(true);

    // Simulate sending a message (replace with actual logic)
    const optimisticUserMessage: Doc<'messages'> = {
      _id: `temp_${Date.now()}` as Id<'messages'>,
      chatId,
      content: trimmedInput,
      role: 'user',
      _creationTime: Date.now(),
    } as Doc<'messages'>;

    setMessages((prev) => [...prev, optimisticUserMessage]);

    let fullResponse = '';

    try {
      const requestBody: ChatRequestBody = {
        messages: messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        newMessage: trimmedInput, // Fixed typo (newMessages -> newMessage)
        chatId,
      };

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(await response.text());
      if (!response.body) throw new Error('No response from server');

      const parser = createSSEParser();
      const reader = response.body.getReader();

      await processStream(reader, async (chunk) => {
        const messages = parser.parse(chunk);

        for (const message of messages) {
          switch (message.type) {
            case StreamMessageType.Token:
              if ('token' in message) {
                fullResponse += message.token;
                setStreamedResponse(fullResponse);
              }
              break;

            case StreamMessageType.ToolStart:
              if ('tool' in message) {
                setCurrentTool({
                  name: message.tool,
                  input: message.input,
                });
                fullResponse += formatTerminalOutput(
                  message.tool,
                  message.input,
                  'Processing...'
                );
                setStreamedResponse(fullResponse);
              }
              break;

            case StreamMessageType.ToolEnd:
              if ('tool' in message && currentTool) {
                const lastTerminalIndex = fullResponse.lastIndexOf(
                  '<div class="bg-[#1e1e1e]"/>'
                );

                if (lastTerminalIndex !== -1) {
                  fullResponse =
                    fullResponse.substring(0, lastTerminalIndex) +
                    formatTerminalOutput(
                      message.tool,
                      currentTool.input,
                      message.output
                    );
                  setStreamedResponse(fullResponse);
                }
              }
              break;

            case StreamMessageType.Error:
              if ('error' in message) {
                throw new Error(message.error);
              }
              break;

            case StreamMessageType.Done:
              const assistantMessage: Doc<'messages'> = {
                _id: `temp_${Date.now() + 1}` as Id<'messages'>,
                chatId,
                content: fullResponse,
                role: 'assistant',
                _creationTime: Date.now(),
              } as Doc<'messages'>;

              const convex = getConvexClient();
              await convex.mutation(api.messages.store, {
                chatId,
                content: fullResponse,
                role: 'assistant',
              });

              setMessages((prev) => [...prev, assistantMessage]);
              setStreamedResponse('');
              return;
          }
        }
      });
    } catch (error) {
      console.error(error);

      setMessages((prev) =>
        prev.filter((message) => message._id !== optimisticUserMessage._id)
      );

      setStreamedResponse(
        formatTerminalOutput(
          'error',
          'Failed to process message',
          error instanceof Error ? error.message : 'Unknown error'
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="m-4">
      <section className="flex-1 overflow-y-auto bg-gray-50 p-2 md:p-0">
        <div className="max-w-4xl mx-auto p-4 space-y-3">
          {messages.map((message: Doc<'messages'>) => (
            <MessageBubble
              key={message._id}
              content={message.content}
              isUser={message.role === 'user'}
            />
          ))}
          {streamedResponse && <MessageBubble content={streamedResponse} />}
          <div ref={messagesEndRef} />
        </div>
      </section>

      <footer>
        <form onSubmit={handleSubmit}>
          <div className="relative flex items-center">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="border-2 border-gray-300 rounded-md pl-4 pr-10 py-2 w-full"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={input.trim() === '' || isLoading}
              className={`bg-blue-500 text-white rounded-md px-4 py-2 ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Send
            </Button>
          </div>
        </form>
      </footer>
    </main>
  );
}

export default ChatInterface;