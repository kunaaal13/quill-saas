import { trpc } from '@/app/_trpc/client'
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query'
import { useMutation } from '@tanstack/react-query'
import { set } from 'date-fns'
import { createContext, useRef, useState } from 'react'
import { toast } from 'sonner'

type StreamResponse = {
  addMessage: () => void
  message: string
  handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  isLoading: boolean
}

export const ChatContext = createContext<StreamResponse>({
  addMessage: () => {},
  message: '',
  handleInputChange: () => {},
  isLoading: false,
})

type ChatContextProviderProps = {
  fileID: string
  children: React.ReactNode
}

function ChatContextProvider({ fileID, children }: ChatContextProviderProps) {
  const [message, setMessage] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const backupMessage = useRef<string>('')
  const utils = trpc.useUtils()

  const { mutate: sendMessage } = useMutation({
    mutationFn: async ({ message }: { message: string }) => {
      const response = await fetch('/api/message', {
        method: 'POST',
        body: JSON.stringify({ fileId: fileID, message }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      return response.body
    },
    onMutate: async ({ message }) => {
      backupMessage.current = message
      setMessage('')

      await utils.getFileMessages.cancel()

      const prevMessages = utils.getFileMessages.getInfiniteData()

      utils.getFileMessages.setInfiniteData(
        {
          fileId: fileID,
          limit: INFINITE_QUERY_LIMIT,
        },
        (old) => {
          if (!old) {
            return {
              pages: [],
              pageParams: [],
            }
          }

          let newPages = [...old.pages]
          let latestPage = newPages[0]!

          latestPage.messages = [
            {
              createdAt: new Date().toISOString(),
              id: crypto.randomUUID(),
              text: message,
              isUserMessage: true,
            },
            ...latestPage.messages,
          ]

          newPages[0] = latestPage

          return {
            ...old,
            pages: newPages,
          }
        }
      )

      setIsLoading(true)
      return {
        previousMessages:
          prevMessages?.pages.flatMap((page) => page.messages) ?? [],
      }
    },
    onError: (_, __, context) => {
      setMessage(backupMessage.current)
      utils.getFileMessages.setData(
        {
          fileId: fileID,
        },
        {
          messages: context?.previousMessages ?? [],
        }
      )
    },
    onSettled: async () => {
      setIsLoading(false)

      await utils.getFileMessages.invalidate({
        fileId: fileID,
      })
    },
    onSuccess: async (stream) => {
      setIsLoading(false)

      if (!stream) return toast.error('Failed to send message')

      const reader = stream.getReader()
      const decoder = new TextDecoder()
      let done = false

      // accumulated response
      let accResponse = ''

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        const chunkValue = decoder.decode(value)

        accResponse += chunkValue

        // Append chunk to actual message
        utils.getFileMessages.setInfiniteData(
          {
            fileId: fileID,
            limit: INFINITE_QUERY_LIMIT,
          },
          (old) => {
            if (!old) {
              return {
                pages: [],
                pageParams: [],
              }
            }

            let isAiResponseCreated = old.pages.some((page) =>
              page.messages.some((message) => message.id === 'ai-response')
            )

            let updatedPages = old.pages.map((page) => {
              if (page === old.pages[0]) {
                let updatedMessage

                if (!isAiResponseCreated) {
                  updatedMessage = [
                    {
                      createdAt: new Date().toISOString(),
                      id: 'ai-response',
                      text: accResponse,
                      isUserMessage: false,
                    },
                    ...page.messages,
                  ]
                } else {
                  // Add to existing message
                  updatedMessage = page.messages.map((message) => {
                    if (message.id === 'ai-response') {
                      return {
                        ...message,
                        text: accResponse,
                      }
                    }

                    return message
                  })
                }

                return {
                  ...page,
                  messages: updatedMessage,
                }
              }

              return page
            })

            return {
              ...old,
              pages: updatedPages,
            }
          }
        )
      }
    },
  })

  const addMessage = () => {
    sendMessage({ message })
  }
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value)
  }

  return (
    <ChatContext.Provider
      value={{
        addMessage,
        message,
        handleInputChange,
        isLoading,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export default ChatContextProvider
