/**
 * Accessibility Live Region Component
 * Provides a global ARIA live region for screen reader announcements
 */

import React from 'react';

export const A11yLiveRegion: React.FC = () => {
  return (
    <>
      {/* Polite announcements (non-urgent) */}
      <div
        id="a11y-live-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: '0',
        }}
      />
      
      {/* Assertive announcements (urgent) */}
      <div
        id="a11y-live-region-assertive"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: '0',
        }}
      />
    </>
  );
};
