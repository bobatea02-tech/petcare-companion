import React from 'react'

/**
 * Skip to main content link for keyboard navigation
 * WCAG 2.1 AA requirement for bypassing navigation
 */
export const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="skip-to-main"
    >
      Skip to main content
    </a>
  )
}
