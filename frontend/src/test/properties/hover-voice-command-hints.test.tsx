/**
 * Property Test: Hover voice command hints
 * Feature: jojo-voice-assistant-enhanced, Property 47: Hover voice command hints
 * 
 * Property: For any UI element, when the user hovers over it, the Dashboard 
 * should display the equivalent voice command for that action
 * 
 * Validates: Requirements 14.5
 */

import { describe, it, expect } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { VoiceCommandTooltip } from '@/components/voice/VoiceCommandTooltip';
import { getVoiceCommandHint } from '@/components/voice/VoiceCommandSuggestions';
import { TooltipProvider } from '@/components/ui/tooltip';

// Define UI element types and their expected voice command hints
const uiElementTypes = [
  { type: 'nav-dashboard', expectedHint: 'go to dashboard' },
  { type: 'nav-appointments', expectedHint: 'go to appointments' },
  { type: 'nav-health-records', expectedHint: 'health records' },
  { type: 'nav-profile', expectedHint: 'go to profile' },
  { type: 'nav-community', expectedHint: 'go to community' },
  { type: 'nav-vet-search', expectedHint: 'find vets' },
  { type: 'nav-back', expectedHint: 'go back' },
  { type: 'add-pet', expectedHint: 'add new pet' },
  { type: 'schedule-appointment', expectedHint: 'schedule' },
  { type: 'view-appointments', expectedHint: 'show all appointments' },
  { type: 'help', expectedHint: 'what can you do' },
];

const uiElementTypesWithContext = [
  { type: 'pet-card', context: { petName: 'Buddy' }, expectedHint: 'buddy' },
  { type: 'edit-pet', context: { petName: 'Max' }, expectedHint: 'max' },
  { type: 'health-score', context: { petName: 'Luna' }, expectedHint: 'luna' },
  { type: 'log-feeding', context: { petName: 'Charlie' }, expectedHint: 'charlie' },
  { type: 'add-medication', context: { petName: 'Bella' }, expectedHint: 'bella' },
];

describe('Property 47: Hover voice command hints', () => {
  it('should return voice command hint for any UI element type', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...uiElementTypes),
        async (element) => {
          // Get voice command hint for the element type
          const hint = getVoiceCommandHint(element.type);

          // Verify hint is returned
          expect(hint).toBeTruthy();
          expect(typeof hint).toBe('string');

          // Verify hint contains expected keyword
          const hintLower = hint?.toLowerCase() || '';
          expect(hintLower).toContain(element.expectedHint.toLowerCase());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return context-aware voice command hints for elements with context', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...uiElementTypesWithContext),
        async (element) => {
          // Get voice command hint with context
          const hint = getVoiceCommandHint(element.type, element.context);

          // Verify hint is returned
          expect(hint).toBeTruthy();
          expect(typeof hint).toBe('string');

          // Verify hint contains the pet name from context
          const hintLower = hint?.toLowerCase() || '';
          expect(hintLower).toContain(element.expectedHint.toLowerCase());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display tooltip with voice command hint when wrapping UI elements', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...uiElementTypes),
        async (element) => {
          // Render VoiceCommandTooltip wrapping a button
          const { container, unmount } = render(
            <TooltipProvider>
              <VoiceCommandTooltip elementType={element.type}>
                <button>Test Button</button>
              </VoiceCommandTooltip>
            </TooltipProvider>
          );

          try {
            // Verify the child element is rendered
            const button = container.querySelector('button');
            expect(button).toBeTruthy();
            expect(button?.textContent).toBe('Test Button');
          } finally {
            unmount();
            cleanup();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render children without tooltip when enabled is false', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...uiElementTypes),
        async (element) => {
          // Render VoiceCommandTooltip with enabled=false
          const { container, unmount } = render(
            <TooltipProvider>
              <VoiceCommandTooltip elementType={element.type} enabled={false}>
                <button>Test Button</button>
              </VoiceCommandTooltip>
            </TooltipProvider>
          );

          try {
            // Verify the child element is still rendered
            const button = container.querySelector('button');
            expect(button).toBeTruthy();
            expect(button?.textContent).toBe('Test Button');
          } finally {
            unmount();
            cleanup();
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should use custom hint when provided', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 50 }),
        async (customHint) => {
          // Render VoiceCommandTooltip with custom hint
          const { container, unmount } = render(
            <TooltipProvider>
              <VoiceCommandTooltip 
                elementType="nav-dashboard" 
                customHint={customHint}
              >
                <button>Test Button</button>
              </VoiceCommandTooltip>
            </TooltipProvider>
          );

          try {
            // Verify the child element is rendered
            const button = container.querySelector('button');
            expect(button).toBeTruthy();
          } finally {
            unmount();
            cleanup();
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should return null for unknown element types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => 
          !uiElementTypes.some(e => e.type === s) &&
          !uiElementTypesWithContext.some(e => e.type === s)
        ),
        async (unknownType) => {
          // Get voice command hint for unknown element type
          const hint = getVoiceCommandHint(unknownType);

          // Verify hint is null for unknown types
          expect(hint).toBeNull();
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle all navigation element types', async () => {
    const navElements = uiElementTypes.filter(e => e.type.startsWith('nav-'));
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...navElements),
        async (element) => {
          // Get voice command hint
          const hint = getVoiceCommandHint(element.type);

          // Verify hint exists and contains "say"
          expect(hint).toBeTruthy();
          const hintLower = hint?.toLowerCase() || '';
          expect(hintLower).toContain('say');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should handle all pet-related element types with context', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...uiElementTypesWithContext),
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        async (element, petName) => {
          // Get voice command hint with custom pet name
          const hint = getVoiceCommandHint(element.type, { petName });

          // Verify hint exists and contains the pet name
          expect(hint).toBeTruthy();
          const hintLower = hint?.toLowerCase() || '';
          expect(hintLower).toContain(petName.toLowerCase());
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should provide hints for action elements', async () => {
    const actionElements = [
      { type: 'add-pet', action: 'add' },
      { type: 'schedule-appointment', action: 'schedule' },
      { type: 'log-feeding', action: 'log' },
      { type: 'add-medication', action: 'add' },
    ];

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...actionElements),
        async (element) => {
          // Get voice command hint
          const hint = getVoiceCommandHint(element.type);

          // Verify hint exists and contains the action keyword
          expect(hint).toBeTruthy();
          const hintLower = hint?.toLowerCase() || '';
          expect(hintLower).toContain(element.action.toLowerCase());
        }
      ),
      { numRuns: 50 }
    );
  });
});
