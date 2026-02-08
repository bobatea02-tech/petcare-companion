'use client'

import React, { useState, useEffect } from 'react'
import Image, { ImageProps } from 'next/image'
import { cn } from '@/lib/utils'
import { getOptimalImageQuality } from '@/lib/performance'

export interface OptimizedImageProps extends Omit<ImageProps, 'quality'> {
  fallbackSrc?: string
  showSkeleton?: boolean
  skeletonClassName?: string
}

/**
 * Optimized image component with lazy loading, modern formats, and responsive images
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallbackSrc = '/images/placeholder-pet.png',
  showSkeleton = true,
  skeletonClassName,
  className,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [imageSrc, setImageSrc] = useState(src)

  useEffect(() => {
    setImageSrc(src)
    setError(false)
    setIsLoading(true)
  }, [src])

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setError(true)
    setIsLoading(false)
    if (fallbackSrc) {
      setImageSrc(fallbackSrc)
    }
  }

  // Determine quality based on network conditions
  const quality = getOptimalImageQuality()
  const qualityMap = { low: 50, medium: 75, high: 90 }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {showSkeleton && isLoading && (
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer',
            skeletonClassName
          )}
          role="status"
          aria-label="Loading image"
        >
          <span className="sr-only">Loading image...</span>
        </div>
      )}
      <Image
        src={imageSrc}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        quality={qualityMap[quality]}
        loading="lazy"
        {...props}
      />
    </div>
  )
}

/**
 * Pet avatar with optimized loading
 */
export const PetAvatar: React.FC<{
  src?: string
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}> = ({ src, alt, size = 'md', className }) => {
  const sizeMap = {
    sm: 40,
    md: 64,
    lg: 96,
    xl: 128,
  }

  const dimension = sizeMap[size]

  return (
    <OptimizedImage
      src={src || '/images/default-pet-avatar.png'}
      alt={alt}
      width={dimension}
      height={dimension}
      className={cn('rounded-full object-cover', className)}
      fallbackSrc="/images/default-pet-avatar.png"
    />
  )
}

/**
 * Responsive image with srcset for different screen sizes
 */
export const ResponsiveImage: React.FC<{
  src: string
  alt: string
  sizes?: string
  className?: string
  priority?: boolean
}> = ({ src, alt, sizes = '100vw', className, priority = false }) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={cn('object-cover', className)}
      priority={priority}
    />
  )
}
