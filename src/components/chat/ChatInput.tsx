import { Send } from 'lucide-react'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { useContext, useRef } from 'react'
import { ChatContext } from './ChatContext'

type ChatInputProps = {
  isDisabled?: boolean
}

function ChatInput({ isDisabled }: ChatInputProps) {
  const { addMessage, handleInputChange, isLoading, message } =
    useContext(ChatContext)

  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  return (
    <div className='absolute bottom-0 left-0 w-full'>
      <form className='mx-2 flex flex-row gap-3 md:mx-4 md:last:mb-4 lg:mx-auto lg:max-w-2xl xl:max-w-3xl'>
        <div className='relative flex h-full flex-1 items-stretch md:flex-col'>
          <div className='relative flex flex-col w-full flex-grow p-4'>
            <div className='relative'>
              <Textarea
                ref={textAreaRef}
                rows={1}
                maxRows={4}
                autoFocus
                onChange={handleInputChange}
                value={message}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    addMessage()

                    textAreaRef.current?.focus()
                  }
                }}
                placeholder='Enter your question...'
                className='resize-none pr-12 text-base py-3 scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch'
              />

              <Button
                disabled={isDisabled || isLoading}
                className='absolute bottom-1.5 right-[8px]'
                aria-label='Send message'
                onClick={() => {
                  addMessage()

                  textAreaRef.current?.focus()
                }}
              >
                <Send className='h-4 w-4 rotate-45' />
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ChatInput
