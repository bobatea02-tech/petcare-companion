import React from 'react'

interface PillBottleIconProps {
  className?: string
  size?: number
}

export const PillBottleIcon: React.FC<PillBottleIconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6 3h12v2H6z" />
      <rect x="7" y="5" width="10" height="16" rx="2" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    </svg>
  )
}
