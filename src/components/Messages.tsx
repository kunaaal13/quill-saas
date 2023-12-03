import { trpc } from '@/app/_trpc/client'
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query'
import { Loader2, MessageSquareIcon } from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import Message from './chat/Message'
import { useContext, useEffect, useRef } from 'react'
import { ChatContext } from './chat/ChatContext'
import { useIntersection } from '@mantine/hooks'

type MessagesProps = {
  fileId: string
}

function Messages({ fileId }: MessagesProps) {
  const { isLoading: isAiThinking } = useContext(ChatContext)

  const { data, isLoading, fetchNextPage } =
    trpc.getFileMessages.useInfiniteQuery(
      {
        fileId,
        limit: INFINITE_QUERY_LIMIT,
      },
      {
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
        keepPreviousData: true,
      }
    )

  const loadingMessage = {
    createdAt: new Date().toISOString(),
    id: 'loading-message',
    isUserMessage: false,
    text: (
      <span className='flex h-full items-center justify-center'>
        <Loader2 className='h-4 w-4 animate-spin' />
      </span>
    ),
  }
  const messages = data?.pages.flatMap((page) => page.messages) ?? []
  const combinedMessages = [
    ...(isAiThinking ? [loadingMessage] : []),
    ...(messages ?? []),
  ]

  const lastMessageRef = useRef<HTMLDivElement>(null)
  const { ref, entry } = useIntersection({
    root: lastMessageRef.current,
    threshold: 1,
  })

  useEffect(() => {
    if (entry?.isIntersecting) {
      fetchNextPage()
    }
  }, [entry, fetchNextPage])

  return (
    <div className='flex max-h-[calc(100vh-3.5rem-7rem)] border-zinc-200 flex-1 flex-col-reverse gap-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 srolling-touch'>
      {combinedMessages && combinedMessages.length > 0 ? (
        combinedMessages.map((message, i) => {
          const isNextMessageSamePerson =
            combinedMessages[i - 1]?.isUserMessage ===
            combinedMessages[i]?.isUserMessage

          if (i === combinedMessages.length - 1) {
            return (
              <Message
                ref={ref}
                key={message.id}
                message={message}
                isNextMessageSamePerson={isNextMessageSamePerson}
              />
            )
          } else
            return (
              <Message
                key={message.id}
                message={message}
                isNextMessageSamePerson={isNextMessageSamePerson}
              />
            )
        })
      ) : isLoading ? (
        <div className='w-full flex flex-col gap-2'>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className='h-16' />
          ))}
        </div>
      ) : (
        <div className='flex-1 flex-col items-center justify-center gap-2'>
          <MessageSquareIcon className='h-8 w-8 text-blue-500' />
          <h3 className='font-semibold text-xl'>You&apos;re all set</h3>
        </div>
      )}
    </div>
  )
}

export default Messages
