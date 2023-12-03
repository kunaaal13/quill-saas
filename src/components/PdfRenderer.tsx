'use client'

import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, ChevronUp, Loader2, RotateCw, Search } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'
import { useResizeDetector } from 'react-resize-detector'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Input } from './ui/input'
import SimpleBar from 'simplebar-react'
import PdfFullScreen from './PdfFullScreen'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`

type PdfRendererProps = {
  url: string
}

function PdfRenderer({ url }: PdfRendererProps) {
  const { width, ref } = useResizeDetector()
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [scale, setScale] = useState<number>(1)
  const [rotation, setRotation] = useState<number>(0)
  const [renderedScale, setRenderedScale] = useState<number | null>(null)

  const isLoading = renderedScale !== scale

  const customPageValidator = z.object({
    page: z
      .string()
      .refine((num) => Number(num) > 0 && Number(num) <= numPages!),
  })

  type TCustomePageValidator = z.infer<typeof customPageValidator>

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TCustomePageValidator>({
    defaultValues: {
      page: '1',
    },
    resolver: zodResolver(customPageValidator),
  })

  const handlePageSubmit = ({ page }: TCustomePageValidator) => {
    setCurrentPage(Number(page))
    setValue('page', String(page))
  }

  return (
    <div className='w-full bg-white rounded-md flex flex-col items-center'>
      <div className='h-14 w-full border-b border-zinc-200 flex items-center justify-between'>
        <div className='flex items-center gap-1.5'>
          <Button
            disabled={currentPage === 1}
            variant='ghost'
            aria-label='previous page'
            onClick={() => {
              setCurrentPage((prev) => (prev - 1 > 1 ? prev - 1 : 1))
              setValue('page', String(currentPage - 1))
            }}
          >
            <ChevronDown className='h-4 w-4' />
          </Button>

          <div className='flex items-center gap-1.5'>
            <Input
              {...register('page')}
              className={cn(
                'w-12 h-8',
                errors.page && 'focus-visible:ring-red-500'
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit(handlePageSubmit)()
                }
              }}
            />
            <p className='text-zinc-700 text-sm space-x-1'>
              <span>/</span>
              <span>{numPages ?? 'x'}</span>
            </p>
          </div>

          <Button
            disabled={numPages === undefined || currentPage === numPages}
            variant='ghost'
            aria-label='next page'
            onClick={() => {
              setCurrentPage((prev) =>
                prev + 1 < numPages ? prev + 1 : numPages
              )
              setValue('page', String(currentPage + 1))
            }}
          >
            <ChevronUp className='h-4 w-4' />
          </Button>
        </div>

        <div className='space-x-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className='gap-1.5' aria-label='zoom' variant={'ghost'}>
                <Search className='h-4 w-4' />
                {scale * 100}%
                <ChevronDown className='h-3 w-3 opacity-50' />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setScale(1)}>
                100%
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setScale(1.5)}>
                150%
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setScale(2)}>
                200%
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => setRotation((prev) => prev + 90)}
            aria-label='rotate 90 deg'
            variant='ghost'
          >
            <RotateCw className='h-4 w-4' />
          </Button>

          <PdfFullScreen url={url} />
        </div>
      </div>

      <div className='flex-1 w-full max-h-screen'>
        <SimpleBar autoHide={false} className='max-h-[calc(100vh-10rem)]'>
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
              {isLoading && renderedScale ? (
                <Page
                  width={width ? width : 1}
                  pageNumber={currentPage}
                  key={'@' + renderedScale}
                  scale={scale}
                  rotate={rotation}
                />
              ) : null}

              <Page
                width={width ? width : 1}
                pageNumber={currentPage}
                key={'@' + scale}
                scale={scale}
                rotate={rotation}
                className={cn(isLoading && 'hidden')}
                loading={
                  <div className='flex justify-center'>
                    <Loader2 className='animate-spin h-6 w-6 my-24' />
                  </div>
                }
                onRenderSuccess={() => setRenderedScale(scale)}
              />
            </Document>
          </div>
        </SimpleBar>
      </div>
    </div>
  )
}

export default PdfRenderer
