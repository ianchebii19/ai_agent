'use client'
import { Doc, Id } from '@/convex/_generated/dataModel';
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ChatRequestBody } from '@/lib/types';

interface ChatInterfaceProps {
  chatId: Id<'chats'>;
  initialMessages: Doc<'messages'>[];
}

function ChatInterface({ chatId, initialMessages }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Doc<'messages'>[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("")
  const [currentTool, setCurrentTool]=useState<{
    name: string
    input: unknown
  } | null >(null)
 const messagesEndRef= useRef<HTMLDivElement>(null)

 useEffect(()=>{
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
 }, [messages, streamedResponse])
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput=input.trim()
    if (!trimmedInput || isLoading) return;

    setInput("")
    setStreamedResponse("")
    setCurrentTool(null)
    setLoading(true);

    // Simulate sending a message (replace with actual logic)
    const optimisticUseMessage: Doc<"messages">={
        _id: `temp_${Date.now()}`,
        chatId,
        content:trimmedInput,
        role:"user",
        createdAt:Date.now(),
      } as Doc<"messages">
      setMessages((prev) => [...prev, optimisticUseMessage]);

      let fullResponse="";

      try{
        const requestBody: ChatRequestBody={
                messages: messages.map((message)=>({
                     role: message.role,
                     content: message.content
            })), 
            newMessages:trimmedInput,
            chatId
        }
        const response = fetch("/api/chat/stream",{
            method: "POST",
            headers:{"Content-Type": "application/json"},
            body: JSON.stringify(requestBody)
          })
          if(!response.ok)throw new Error(await response.text())
          if (!response.body) throw new Error(" no response from server")

      }catch(err){
        console.log(err)

        setMessages((prev)=>
        prev.filter((message)=> message._id !==optimisticUseMessage._id))
        setStreamedResponse(
            formatTerminalOutput(
                "error",
                "Fail to process messages",
                error instanceof Error  ? error.message: "unknown error"
            )
    ) finally
    setIsLoading(false)

      }
      


  };



  return (
    <main className='m-4'>
      <section>
       <div>
        {messages.map((message) =>{
            <div key={message._id}>
                {message.content}
            </div>
        })}

        

        <div ref={messagesEndRef}/>
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