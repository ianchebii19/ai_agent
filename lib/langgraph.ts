import { ChatOpenAI } from '@langchain/openai';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import wxflows from '@wxflows/sdk/langchain';

import {
    END,
    MemorySaver,
    MessagesAnnotation,
    START,
    StateGraph
} from "@langchain/langgraph"
import { AIMessage, BaseMessage, HumanMessage, SystemMessage, trimMessages } from '@langchain/core/messages';
import SYSTEM_MESSAGE from '@/constant/SystemMessage';
import { ChatPromptTemplate, MessagesPlaceholder} from "@langchain/core/prompts"
// Initialize wxflows client
 
const trimmer= trimMessages({
  maxTokens: 10,
  strategy: 'last',
  tokenCounter: (message)=> message.length,
  includeSystem: true,
  allowPartial:false,
  startOn: "human"
})

const toolClient = new wxflows({
  endpoint: process.env.WXFLOW_ENDPOINT || '',
  apikey: process.env.WXFLOW_APIKEY || '', // Ensure apikey is a string
});

// Fetch tools from wxflows
const tools = await toolClient.lcTools;
const toolNode = new ToolNode(tools);

// Function to initialize the ChatOpenAI model
const initializeModel = () => {
  const model = new ChatOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY, // Ensure this is set in your .env file
    model: ' DeepSeek-V3 ', // Replace with the correct model name
    temperature: 0.7,
    maxTokens: 4096,
    streaming: true,
   // https://introspection.apis.stepzen.com/customers
    callbacks: [
      {
        handleLLMStart: async () => {
          console.log('LLM started');
        },
        handleLLMEnd: async (output) => {
          console.log('LLM ended', output);
          const usage = output.llmOutput?.usage;
          if (usage) {
            console.log('Model usage:', usage);
          }
        },
      },
    ],
  }).bindTools(tools); // Bind tools to the m  odel

  return model;
};
 function shouldContinue(state: typeof MessagesAnnotation.State){
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;

  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return "tools"
  }
  if (lastMessage.content && lastMessage.getType() === 'tool') {
    return 'agent';
  }

  return END
 }
// Export the initialized model
const createWorkflow=()=>{
    const model = initializeModel();
    const stateGraph= new StateGraph( MessagesAnnotation).addNode(
        "agent", async(state)=>{
            const systemContent = SYSTEM_MESSAGE;

            const promptTemplate = ChatPromptTemplate.fromMessages([
              new SystemMessage(systemContent),
              new MessagesPlaceholder('messages'),
            ]);

            const trimmedMessage= await trimmer.invoke(state.messages)

            const prompt = await promptTemplate.invoke({
              messages: trimmedMessage})

              const response = await model.invoke(prompt)

              return {messages: [   response]}

        }
    ).addNode('tools', toolNode)
    .addEdge(START, 'agent')
    .addConditionalEdges('agent', shouldContinue)
    .addEdge('tools', 'agent');


    return stateGraph
}

function addCachingHeaders(messages: BaseMessage[]) {
   if (!messages.length)  return messages

   const cachedMessages=[...messages]


   const addCache = (messages: BaseMessage) => {
    messages.content =[
      {
        type:'text',
        text: messages.content as string,
        Cache_control:{ type: "ephemeral",}
      }
    ]
   }
   addCache(cachedMessages.at(-1)!)


   let handleCount = 0
   for (let i =  cachedMessages.length - 1; i >= 0; i--) {
    if (cachedMessages[i] instanceof  HumanMessage) {
      handleCount++
      if (handleCount === 2) {
        addCache(cachedMessages[i])
        break;
      }
    } 
   }
   return cachedMessages;
}

export async function submitQuestion(messages: BaseMessage[], chatId: string){
  
  const cachedMessages = addCachingHeaders(messages)
  console.log('Massages cached:', cachedMessages);
  const workflow = createWorkflow()

   const checkpointer = new MemorySaver()

   const app = workflow.compile({ checkpointer})


   

   const stream = app.streamEvents(
    {messages},
    {
     version: 'v2',
     configurable: { thread_id: chatId },
     streamMode: 'messages',
     runId: chatId,
    }
  );

;

   return stream
}
