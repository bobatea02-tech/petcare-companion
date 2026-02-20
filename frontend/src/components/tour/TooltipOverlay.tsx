/**
 * TooltipOverlay Component
 * Displays a semi-transparent backdrop with spotlight effect and tooltip
 * for the guided tour system
 */

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { BORDER_RADIUS } from "@/lib/design-system";

export interface TooltipOverlayProps {
  /** CSS selector for the element to highlight */
  targetSelector: string;
  /** Title of the tooltip */
  title: string;
  /** Description text for the tooltip */
  description: string;
  /** Current step number */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Callback when next button is clicked */
  onNext?: () => void;
  /** Callback when previous button is clicked */
  onPrevious?: () => void;
  /** Callback when skip/close button is clicked */
  onSkip: () => void;
  /** Whether to show the component */
  isVisible: boolean;
}

interface ElementPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const TooltipOverlay = ({
  targetSelector,
  title,
  description,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  isVisible,
}: TooltipOverlayProps) => {
  const [targetPosition, setTargetPosition] = useState<ElementPosition | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus the close button when tooltip appears for keyboard accessibility
  useEffect(() => {
    if (isVisible && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isVisible, currentStep]);

  // Find and track the target element position
  useEffect(() => {
    if (!isVisible) return;

    const updatePosition = () => {
      const targetElement = document.querySelector(targetSelector);
      
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setTargetPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      } else {
        console.warn(`[TooltipOverlay] Target element not found: ${targetSelector}`);
        setTargetPosition(null);
      }
    };

    // Initial position
    updatePosition();

    // Update on scroll and resize
    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);

    // Retry finding element if not found initially
    if (!document.querySelector(targetSelector)) {
      const retryInterval = setInterval(() => {
        const element = document.querySelector(targetSelector);
        if (element) {
          updatePosition();
          clearInterval(retryInterval);
        }
      }, 500);

      // Stop retrying after 5 seconds
      setTimeout(() => clearInterval(retryInterval), 5000);
    }

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [targetSelector, isVisible]);

  // Calculate tooltip position to keep it in viewport
  useEffect(() => {
    if (!targetPosition || !tooltipRef.current) return;

    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 20;
    const scrollbarWidth = 20; // Account for scrollbar

    let top = targetPosition.top + targetPosition.height + padding;
    let left = targetPosition.left;

    // Adjust if tooltip goes off right edge
    if (left + tooltipRect.width > viewportWidth - padding - scrollbarWidth) {
      left = Math.max(padding, viewportWidth - tooltipRect.width - padding - scrollbarWidth);
    }

    // Adjust if tooltip goes off left edge
    if (left < padding) {
      left = padding;
    }

    // Adjust if tooltip goes off bottom edge
    if (top + tooltipRect.height > viewportHeight + window.scrollY - padding) {
      // Position above the target instead
      top = targetPosition.top - tooltipRect.height - padding;
      
      // If still off-screen, position at top of viewport
      if (top < padding + window.scrollY) {
        top = padding + window.scrollY;
        
        // If target is very tall and tooltip can't fit above or below,
        // position it to the side
        if (targetPosition.height > viewportHeight - 2 * padding - tooltipRect.height) {
          top = targetPosition.top + (targetPosition.height - tooltipRect.height) / 2;
          
          // Try positioning to the right
          if (targetPosition.left + targetPosition.width + tooltipRect.width + 2 * padding < viewportWidth) {
            left = targetPosition.left + targetPosition.width + padding;
          } else {
            // Position to the left
            left = Math.max(padding, targetPosition.left - tooltipRect.width - padding);
          }
        }
      }
    }

    // Adjust if tooltip goes off top edge
    if (top < padding + window.scrollY) {
      top = padding + window.scrollY;
    }

    // Ensure tooltip stays within viewport bounds
    top = Math.max(padding + window.scrollY, Math.min(top, viewportHeight + window.scrollY - tooltipRect.height - padding));
    left = Math.max(padding, Math.min(left, viewportWidth - tooltipRect.width - padding - scrollbarWidth));

    setTooltipPosition({ top, left });
  }, [targetPosition]);

  if (!isVisible || !targetPosition) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[1300]"
        style={{ pointerEvents: "auto" }}
      >
        {/* Semi-transparent backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onSkip}
          style={{ backdropFilter: "blur(2px)" }}
        />

        {/* Spotlight effect with Sage border */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="absolute border-8 rounded-lg pointer-events-none"
          style={{
            top: targetPosition.top - 8,
            left: targetPosition.left - 8,
            width: targetPosition.width + 16,
            height: targetPosition.height + 16,
            borderColor: "hsl(80 30% 80%)", // Sage color
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
          }}
        />

        {/* Tooltip */}
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="absolute bg-cream border-2 border-sage shadow-2xl"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            borderRadius: BORDER_RADIUS.card,
            maxWidth: "400px",
            width: "calc(100vw - 40px)",
            pointerEvents: "auto",
          }}
          role="dialog"
          aria-labelledby="tour-title"
          aria-describedby="tour-description"
          aria-live="polite"
        >
          {/* Close button */}
          <button
            ref={closeButtonRef}
            onClick={onSkip}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-olive hover:bg-sage transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2"
            aria-label="Skip tour"
            tabIndex={0}
          >
            <X className="w-4 h-4 text-foreground" />
          </button>

          {/* Content */}
          <div className="p-6">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-3">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index + 1 === currentStep
                      ? "w-8 bg-primary"
                      : index + 1 < currentStep
                      ? "w-4 bg-sage"
                      : "w-4 bg-olive"
                  }`}
                />
              ))}
              <span className="ml-auto font-body text-sm text-muted-foreground">
                {currentStep} of {totalSteps}
              </span>
            </div>

            {/* Title */}
            <h3 id="tour-title" className="font-display text-2xl text-foreground mb-2">
              {title}
            </h3>

            {/* Description */}
            <p id="tour-description" className="font-body text-base text-muted-foreground mb-6">
              {description}
            </p>

            {/* Navigation buttons */}
            <div className="flex items-center gap-3">
              {currentStep > 1 && onPrevious && (
                <Button
                  onClick={onPrevious}
                  variant="outline"
                  className="rounded-[2.5rem] border-accent font-body focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2"
                  tabIndex={0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
              )}

              {currentStep < totalSteps && onNext && (
                <Button
                  onClick={onNext}
                  className="ml-auto rounded-[2.5rem] bg-primary text-primary-foreground font-body hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2"
                  tabIndex={0}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}

              {currentStep === totalSteps && (
                <Button
                  onClick={onSkip}
                  className="ml-auto rounded-[2.5rem] bg-primary text-primary-foreground font-body hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-sage focus:ring-offset-2"
                  tabIndex={0}
                >
                  Finish Tour
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
