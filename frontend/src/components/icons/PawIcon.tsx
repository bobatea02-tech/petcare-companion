import React from 'react'

interface PawIconProps {
  className?: string
  size?: number
}

export const PawIcon: React.FC<PawIconProps> = ({ className = '', size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="8.5" cy="6" rx="2.5" ry="3" />
      <ellipse cx="15.5" cy="6" rx="2.5" ry="3" />
      <ellipse cx="6" cy="11" rx="2" ry="2.5" />
      <ellipse cx="18" cy="11" rx="2" ry="2.5" />
      <path d="M12 21c-3.5 0-6-2.5-6-5.5 0-2 1.5-3.5 3.5-3.5h5c2 0 3.5 1.5 3.5 3.5 0 3-2.5 5.5-6 5.5z" />
    </svg>
  )
}
