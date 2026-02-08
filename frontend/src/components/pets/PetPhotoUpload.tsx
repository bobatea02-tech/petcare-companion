'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

interface PetPhotoUploadProps {
  onUpload: (file: File) => void
  currentPhotoUrl?: string
  petName?: string
}

export const PetPhotoUpload: React.FC<PetPhotoUploadProps> = ({
  onUpload,
  currentPhotoUrl,
  petName,
}) => {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        // Simulate upload progress
        setUploadProgress(0)
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval)
              return 100
            }
            return prev + 10
          })
        }, 50)

        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreview(reader.result as string)
          setTimeout(() => setUploadProgress(0), 500)
        }
        reader.readAsDataURL(file)

        // Call upload handler
        onUpload(file)
      }
    },
    [onUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  })

  const handleRemove = () => {
    setPreview(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300',
          isDragActive || isDragging
            ? 'border-primary-500 bg-primary-50 scale-[1.02]'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50',
          uploadProgress > 0 && uploadProgress < 100 && 'pointer-events-none'
        )}
      >
        <input {...getInputProps()} ref={fileInputRef} />

        {preview ? (
          <div className="space-y-4">
            <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden ring-4 ring-primary-200 shadow-lg">
              <img
                src={preview}
                alt={petName ? `${petName}'s photo` : 'Pet preview'}
                className="w-full h-full object-cover"
              />
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-2xl mb-2">📤</div>
                    <div className="text-sm font-medium">{uploadProgress}%</div>
                  </div>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {isDragActive ? 'Drop to change photo' : 'Click or drag to change photo'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className={cn(
                'w-32 h-32 mx-auto bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center text-6xl transition-transform',
                (isDragActive || isDragging) && 'scale-110'
              )}
            >
              {isDragActive ? '📸' : '🐾'}
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900 mb-1">
                {isDragActive ? 'Drop photo here!' : 'Upload pet photo'}
              </p>
              <p className="text-sm text-gray-600">
                Drag and drop or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-2">
                PNG, JPG, WEBP, GIF up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {preview && (
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              handleRemove()
            }}
          >
            <span className="mr-2">🗑️</span>
            Remove Photo
          </Button>
          <Button
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation()
              if (fileInputRef.current) {
                fileInputRef.current.click()
              }
            }}
          >
            <span className="mr-2">🔄</span>
            Change Photo
          </Button>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <span className="text-2xl">💡</span>
          <div className="flex-1">
            <h4 className="font-medium text-blue-900 mb-1">Photo Tips</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Use a clear, well-lit photo</li>
              <li>• Center your pet's face</li>
              <li>• Avoid busy backgrounds</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
