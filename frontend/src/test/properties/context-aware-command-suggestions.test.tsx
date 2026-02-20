/**
 * Property Test: Context-aware command suggestions
 * Feature: jojo-voice-assistant-enhanced, Property 45: Context-aware command suggestions
 * 
 * Property: For any dashboard section, the displayed voice command suggestions 
 * should be relevant to that specific section's functionality
 * 
 * Validates: Requirements 14.2, 14.4
 */

import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as fc from 'fast-check';
import { VoiceCommandSuggestions } from '@/components/voice/VoiceCommandSuggestions';

// Define dashboard sections and their expected command categories
const dashboardSections = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    expectedKeywords: ['pets', 'health summary', 'reminders', 'appointments', 'feeding']
  },
  {
    path: '/appointments',
    name: 'Appointments',
    expectedKeywords: ['schedule', 'appointment', 'vet', 'cancel', 'clinic']
  },
  {
    path: '/health-records',
    name: 'Health Records',
    expectedKeywords: ['health', 'records', 'weight', 'vaccination', 'score']
  },
  {
    path: '/voice-assistant',
    name: 'Voice Assistant',
    expectedKeywords: ['feeding', 'medication', 'log', 'history', 'walk']
  },
  {
    path: '/profile',
    name: 'Profile',
    expectedKeywords: ['pet', 'profile', 'edit', 'add', 'update']
  },
  {
    path: '/vet-search',
    name: 'Vet Search',
    expectedKeywords: ['vet', 'find', 'emergency', 'clinic', 'appointment']
  },
  {
    path: '/community',
    name: 'Community',
    expectedKeywords: ['tips', 'guide', 'grooming', 'seasonal', 'care']
  }
];

describe('Property 45: Context-aware command suggestions', () => {
  it('should display commands relevant to the current dashboard section', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...dashboardSections),
        async (section) => {
          // Render component with specific route
          const { container, unmount } = render(
            <MemoryRouter initialEntries={[section.path]}>
              <VoiceCommandSuggestions isVisible={true} />
            </MemoryRouter>
          );

          try {
            // Get all text content from the component
            const allText = container.textContent?.toLowerCase() || '';

            // Verify the section name is displayed
            expect(allText).toContain(section.name.toLowerCase());

            // Verify at least one section-specific keyword is present
            const hasRelevantKeyword = section.expectedKeywords.some(keyword => 
              allText.includes(keyword.toLowerCase())
            );
            expect(hasRelevantKeyword).toBe(true);

            // Verify general help commands are always present
            const hasHelpCommand = allText.includes('what can you do') || allText.includes('help');
            expect(hasHelpCommand).toBe(true);
          } finally {
            unmount();
            cleanup();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update suggestions when navigating between different sections', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.constantFrom(...dashboardSections),
          fc.constantFrom(...dashboardSections)
        ).filter(([section1, section2]) => section1.path !== section2.path),
        async ([section1, section2]) => {
          // Render with first section
          const { container: container1, unmount: unmount1 } = render(
            <MemoryRouter initialEntries={[section1.path]}>
              <VoiceCommandSuggestions isVisible={true} />
            </MemoryRouter>
          );

          try {
            const text1 = container1.textContent?.toLowerCase() || '';
            
            // Verify first section's keywords are present
            const hasSection1Keywords = section1.expectedKeywords.some(keyword =>
              text1.includes(keyword.toLowerCase())
            );
            expect(hasSection1Keywords).toBe(true);
          } finally {
            unmount1();
            cleanup();
          }

          // Render with second section
          const { container: container2, unmount: unmount2 } = render(
            <MemoryRouter initialEntries={[section2.path]}>
              <VoiceCommandSuggestions isVisible={true} />
            </MemoryRouter>
          );

          try {
            const text2 = container2.textContent?.toLowerCase() || '';
            
            // Verify second section's keywords are present
            const hasSection2Keywords = section2.expectedKeywords.some(keyword =>
              text2.includes(keyword.toLowerCase())
            );
            expect(hasSection2Keywords).toBe(true);
          } finally {
            unmount2();
            cleanup();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not display suggestions when isVisible is false', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...dashboardSections),
        async (section) => {
          const { container, unmount } = render(
            <MemoryRouter initialEntries={[section.path]}>
              <VoiceCommandSuggestions isVisible={false} />
            </MemoryRouter>
          );

          try {
            // Verify no content is rendered
            const hasContent = container.querySelector('button') !== null;
            expect(hasContent).toBe(false);
          } finally {
            unmount();
            cleanup();
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should always include general help commands regardless of section', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...dashboardSections),
        async (section) => {
          const { container, unmount } = render(
            <MemoryRouter initialEntries={[section.path]}>
              <VoiceCommandSuggestions isVisible={true} />
            </MemoryRouter>
          );

          try {
            const allText = container.textContent?.toLowerCase() || '';

            // Verify at least one general help command is present
            const generalHelpKeywords = ['what can you do', 'help', 'go to', 'go back'];
            const hasGeneralCommands = generalHelpKeywords.some(keyword =>
              allText.includes(keyword)
            );
            expect(hasGeneralCommands).toBe(true);
          } finally {
            unmount();
            cleanup();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display contextual tip with help information', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...dashboardSections),
        async (section) => {
          const { container, unmount } = render(
            <MemoryRouter initialEntries={[section.path]}>
              <VoiceCommandSuggestions isVisible={true} />
            </MemoryRouter>
          );

          try {
            const allText = container.textContent?.toLowerCase() || '';

            // Verify tip section exists with help information
            expect(allText).toContain('tip');
            const hasHelpInfo = allText.includes('what can you do') || allText.includes('help');
            expect(hasHelpInfo).toBe(true);
          } finally {
            unmount();
            cleanup();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
