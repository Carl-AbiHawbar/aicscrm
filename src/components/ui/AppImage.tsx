import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Image with lazy loading and a graceful fallback. Used for product, category
 * and professional imagery so a missing/broken URL degrades to a neutral
 * placeholder instead of a broken-image icon (spec §37 empty/error states).
 */
export function AppImage({
  src,
  alt,
  className,
  imgClassName,
}: {
  src: string | null | undefined
  alt: string
  className?: string
  imgClassName?: string
}) {
  const [failed, setFailed] = useState(false)
  const showImage = src && !failed

  return (
    <div className={cn('relative overflow-hidden bg-steel-100', className)}>
      {showImage ? (
        <img
          src={src as string}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className={cn('h-full w-full object-cover', imgClassName)}
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-steel-300">
          <svg viewBox="0 0 24 24" fill="none" className="h-1/3 w-1/3" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="m3 15 5-5 4 4 3-3 6 6" />
            <circle cx="9" cy="9" r="1.5" />
          </svg>
        </div>
      )}
    </div>
  )
}
