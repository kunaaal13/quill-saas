import { db } from '@/db'
import { openai } from '@/lib/openai'
import { getPineconeClient } from '@/lib/pinecone'
import { sendMessageValidator } from '@/lib/validators/send-message-validator'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { Pinecone } from '@pinecone-database/pinecone'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { PineconeStore } from 'langchain/vectorstores/pinecone'
import { NextRequest } from 'next/server'
import { OpenAIStream, StreamingTextResponse } from 'ai'

export async function POST(request: NextRequest) {
  // endpoint for asking a question to PDF file

  const body = await request.json()

  const { getUser } = getKindeServerSession()
  const user = await getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { id: userId } = user

  const { fileId, message } = sendMessageValidator.parse(body)

  const file = await db.file.findFirst({
    where: {
      id: fileId,
      userId,
    },
  })

  if (!file) {
    return new Response('Not Found', { status: 404 })
  }

  await db.message.create({
    data: {
      text: message,
      isUserMessage: true,
      fileId,
      userId,
    },
  })

  // vectorize the message
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY!,
  })

  const pinecone = await getPineconeClient()
  const pineconeIndex = pinecone.Index('quill')

  const vectorstore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
  })

  const results = await vectorstore.similaritySearch(message, 4)

  const prevMessage = await db.message.findMany({
    where: {
      fileId,
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: 6,
  })

  const formattedMessages = prevMessage.map((message) => ({
    role: message.isUserMessage ? ('user' as const) : ('assistant' as const),
    content: message.text,
  }))

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    temperature: 0,
    stream: true,
    messages: [
      {
        role: 'system',
        content:
          'Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.',
      },
      {
        role: 'user',
        content: `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
        
  \n----------------\n
  
  PREVIOUS CONVERSATION:
  ${formattedMessages.map((message) => {
    if (message.role === 'user') return `User: ${message.content}\n`
    return `Assistant: ${message.content}\n`
  })}
  
  \n----------------\n
  
  CONTEXT:
  ${results.map((r) => r.pageContent).join('\n\n')}
  
  USER INPUT: ${message}`,
      },
    ],
  })

  const stream = OpenAIStream(response, {
    async onCompletion(completion) {
      await db.message.create({
        data: {
          text: completion,
          isUserMessage: false,
          fileId,
          userId,
        },
      })
    },
  })

  return new StreamingTextResponse(stream)
}
