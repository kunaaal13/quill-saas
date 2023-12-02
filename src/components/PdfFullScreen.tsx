import { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import { Expand, Loader2 } from 'lucide-react'
import SimpleBar from 'simplebar-react'
import { Document, Page } from 'react-pdf'
import { toast } from 'sonner'
import { useResizeDetector } from 'react-resize-detector'

type PdfFullScreenProps = {
  url: string
}

function PdfFullScreen({ url }: PdfFullScreenProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { width, ref } = useResizeDetector()
  const [numPages, setNumPages] = useState<number>(0)
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setIsOpen(false)
          return
        }
      }}
    >
      <DialogTrigger asChild onClick={() => setIsOpen(true)}>
        <Button aria-label='Full screen' variant={'ghost'} className='gap-1.5'>
          <Expand className='h-4 w-4' />
        </Button>
      </DialogTrigger>

      <DialogContent className='max-w-7xl w-full'>
        <SimpleBar autoHide={false} className='max-h-[calc(100vh-10rem)] mt-6'>
          <div ref={ref}>
            <Document
              loading={
                <div className='flex justify-center'>
                  <Loader2 className='animate-spin h-6 w-6 my-24' />
                </div>
              }
              onLoadSuccess={({ numPages }) => {
                setNumPages(numPages)
              }}
              onLoadError={() => {
                toast.error('Error loading PDF')
              }}
              file={url}
              className='max-h-full'
            >
              {new Array(numPages).fill(0).map((_, i) => (
                <Page key={i} width={width ? width : 1} pageNumber={i + 1} />
              ))}
            </Document>
          </div>
        </SimpleBar>
      </DialogContent>
    </Dialog>
  )
}

export default PdfFullScreen
