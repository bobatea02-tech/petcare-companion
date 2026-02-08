import React from 'react'

interface FoodBowlIconProps {
  className?: string
  size?: number
}

export const FoodBowlIcon: React.FC<FoodBowlIconProps> = ({ className = '', size = 24 }) => {
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
      <path d="M4 12h16" />
      <path d="M5 12c0 4 2 7 7 7s7-3 7-7" />
      <path d="M6 8c0-1 .5-2 1.5-2.5" />
      <path d="M10 6c0-1 .5-1.5 1-1.5s1 .5 1 1.5" />
      <path d="M14 6c0-1 .5-1.5 1-1.5s1 .5 1 1.5" />
      <path d="M18 8c0-1-.5-2-1.5-2.5" />
    </svg>
  )
}
