import React from 'react'

interface BoneIconProps {
  className?: string
  size?: number
}

export const BoneIcon: React.FC<BoneIconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm14 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
      <rect x="7" y="9" width="10" height="2" rx="1" transform="rotate(-30 12 10)" />
    </svg>
  )
}
