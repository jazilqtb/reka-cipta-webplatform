'use client'

import { ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface LegalDocModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  signedUrl: string
  filename: string
}

export function LegalDocModal({ isOpen, onClose, title, signedUrl, filename }: LegalDocModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-neutral-200">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden px-6 py-4" style={{ minHeight: '60vh' }}>
          <iframe
            src={signedUrl}
            className="w-full h-full rounded-lg border border-neutral-200"
            style={{ minHeight: '60vh' }}
            title={`Dokumen ${title}`}
          />
          <p className="text-xs text-neutral-500 mt-2 text-center">
            Dokumen tidak tampil?{' '}
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link-animated"
            >
              Buka di tab baru <ExternalLink className="w-3 h-3 inline" aria-hidden="true" />
            </a>
          </p>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-neutral-200">
          <a
            href={signedUrl}
            download={filename}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">Unduh PDF</Button>
          </a>
          <Button variant="ghost" size="sm" onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
