import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { Document } from '@/types/health'

export interface DocumentViewerProps {
  document: Document
  isOpen: boolean
  onClose: () => void
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  isOpen,
  onClose,
}) => {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [annotations, setAnnotations] = useState<Array<{ x: number; y: number; text: string }>>([])
  const [isAnnotating, setIsAnnotating] = useState(false)
  const [annotationText, setAnnotationText] = useState('')
  const [annotationPosition, setAnnotationPosition] = useState<{ x: number; y: number } | null>(null)

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50))
  const handleRotateLeft = () => setRotation((prev) => (prev - 90) % 360)
  const handleRotateRight = () => setRotation((prev) => (prev + 90) % 360)
  const handleResetView = () => {
    setZoom(100)
    setRotation(0)
  }

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAnnotating) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setAnnotationPosition({ x, y })
  }

  const addAnnotation = () => {
    if (annotationPosition && annotationText.trim()) {
      setAnnotations([...annotations, { ...annotationPosition, text: annotationText }])
      setAnnotationText('')
      setAnnotationPosition(null)
      setIsAnnotating(false)
    }
  }

  const removeAnnotation = (index: number) => {
    setAnnotations(annotations.filter((_, i) => i !== index))
  }

  const handleDownload = () => {
    // Create a temporary link and trigger download
    const link = document.createElement('a')
    link.href = document.file_url
    link.download = document.file_name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  const isImage = document.file_type.startsWith('image/')
  const isPDF = document.file_type === 'application/pdf'

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title={document.file_name}>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </Button>
            <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
              {zoom}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </Button>

            {/* Rotation Controls */}
            {isImage && (
              <>
                <div className="w-px h-6 bg-gray-300 mx-2" />
                <Button variant="outline" size="sm" onClick={handleRotateLeft}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </Button>
                <Button variant="outline" size="sm" onClick={handleRotateRight}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                  </svg>
                </Button>
              </>
            )}

            {/* Annotation Toggle */}
            {isImage && (
              <>
                <div className="w-px h-6 bg-gray-300 mx-2" />
                <Button
                  variant={isAnnotating ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setIsAnnotating(!isAnnotating)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Annotate
                </Button>
              </>
            )}

            <Button variant="outline" size="sm" onClick={handleResetView}>
              Reset
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </Button>
          </div>
        </div>

        {/* Document Display */}
        <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
          {isImage ? (
            <div
              className="relative w-full h-full flex items-center justify-center p-4 cursor-crosshair"
              onClick={handleImageClick}
            >
              <img
                src={document.file_url}
                alt={document.file_name}
                className="max-w-full max-h-[600px] object-contain transition-transform"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                }}
              />

              {/* Annotations */}
              {annotations.map((annotation, index) => (
                <div
                  key={index}
                  className="absolute bg-yellow-200 border-2 border-yellow-400 rounded-lg p-2 shadow-lg"
                  style={{
                    left: `${annotation.x}%`,
                    top: `${annotation.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <p className="text-xs text-gray-900 max-w-[150px]">{annotation.text}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeAnnotation(index)
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Annotation Input */}
              <AnimatePresence>
                {annotationPosition && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute bg-white rounded-lg p-3 shadow-xl border-2 border-primary-500"
                    style={{
                      left: `${annotationPosition.x}%`,
                      top: `${annotationPosition.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      value={annotationText}
                      onChange={(e) => setAnnotationText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addAnnotation()}
                      placeholder="Add note..."
                      className="w-48 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={addAnnotation}>
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAnnotationPosition(null)
                          setAnnotationText('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : isPDF ? (
            <iframe
              src={document.file_url}
              className="w-full h-[600px]"
              title={document.file_name}
            />
          ) : (
            <div className="flex items-center justify-center h-[500px]">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-gray-600 mb-4">
                  Preview not available for this file type
                </p>
                <Button onClick={handleDownload}>Download to View</Button>
              </div>
            </div>
          )}
        </div>

        {/* Document Info */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">File Type</p>
              <p className="font-medium text-gray-900">{document.file_type}</p>
            </div>
            <div>
              <p className="text-gray-500">File Size</p>
              <p className="font-medium text-gray-900">
                {(document.file_size / 1024).toFixed(2)} KB
              </p>
            </div>
            <div>
              <p className="text-gray-500">Category</p>
              <p className="font-medium text-gray-900 capitalize">
                {document.document_type.replace('_', ' ')}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Uploaded</p>
              <p className="font-medium text-gray-900">
                {new Date(document.uploaded_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          {document.tags.length > 0 && (
            <div className="mt-3">
              <p className="text-gray-500 text-sm mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-primary-100 text-primary-700 rounded-md text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
