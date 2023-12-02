'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import UploadDropzone from './UploadDropzone'

type UploadButtonProps = {}

function UploadButton({}: UploadButtonProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) setIsOpen(open)
      }}
    >
      <DialogTrigger asChild onClick={() => setIsOpen(true)}>
        <Button>Upload PDF</Button>
      </DialogTrigger>

      <DialogContent>
        <UploadDropzone />
      </DialogContent>
    </Dialog>
  )
}

export default UploadButton
