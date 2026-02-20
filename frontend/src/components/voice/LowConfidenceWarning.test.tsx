/**
 * Unit Tests for LowConfidenceWarning Component
 * 
 * Feature: jojo-voice-assistant-enhanced
 * Tests the visual warning indicator for low confidence voice recognition.
 * 
 * Validates: Requirements 10.6
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LowConfidenceWarning } from './LowConfidenceWarning';

describe('LowConfidenceWarning Component', () => {
  /**
   * Test: Warning badge displays when isVisible is true
   */
  it('should display warning badge when isVisible is true', () => {
    render(<LowConfidenceWarning isVisible={true} confidence={0.75} />);
    
    expect(screen.getByText('Low Confidence')).toBeInTheDocument();
  });

  /**
   * Test: Warning badge is hidden when isVisible is false
   */
  it('should not display warning badge when isVisible is false', () => {
    render(<LowConfidenceWarning isVisible={false} confidence={0.75} />);
    
    expect(screen.queryByText('Low Confidence')).not.toBeInTheDocument();
  });

  /**
   * Test: Confidence percentage is displayed when provided
   */
  it('should display confidence percentage when confidence prop is provided', () => {
    render(<LowConfidenceWarning isVisible={true} confidence={0.65} />);
    
    expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    expect(screen.getByText('(65%)')).toBeInTheDocument();
  });

  /**
   * Test: Warning badge displays without percentage when confidence is not provided
   */
  it('should display warning without percentage when confidence is undefined', () => {
    render(<LowConfidenceWarning isVisible={true} />);
    
    expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    expect(screen.queryByText(/\(\d+%\)/)).not.toBeInTheDocument();
  });

  /**
   * Test: Alert icon is present in the warning badge
   */
  it('should display alert triangle icon', () => {
    const { container } = render(<LowConfidenceWarning isVisible={true} confidence={0.70} />);
    
    // Check for the AlertTriangle icon (lucide-react renders as svg)
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  /**
   * Test: Warning badge has destructive variant styling
   */
  it('should apply destructive variant styling to badge', () => {
    const { container } = render(<LowConfidenceWarning isVisible={true} confidence={0.60} />);
    
    // Badge should have destructive styling classes
    const badge = container.querySelector('[class*="destructive"]');
    expect(badge).toBeInTheDocument();
  });

  /**
   * Test: Custom className is applied
   */
  it('should apply custom className', () => {
    const { container } = render(
      <LowConfidenceWarning 
        isVisible={true} 
        confidence={0.75} 
        className="custom-test-class" 
      />
    );
    
    const wrapper = container.querySelector('.custom-test-class');
    expect(wrapper).toBeInTheDocument();
  });

  /**
   * Test: Confidence rounds correctly
   */
  it('should round confidence percentage correctly', () => {
    const { rerender } = render(<LowConfidenceWarning isVisible={true} confidence={0.754} />);
    expect(screen.getByText('(75%)')).toBeInTheDocument();
    
    rerender(<LowConfidenceWarning isVisible={true} confidence={0.756} />);
    expect(screen.getByText('(76%)')).toBeInTheDocument();
  });

  /**
   * Test: Zero confidence displays correctly
   */
  it('should handle zero confidence', () => {
    render(<LowConfidenceWarning isVisible={true} confidence={0} />);
    
    expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    expect(screen.getByText('(0%)')).toBeInTheDocument();
  });

  /**
   * Test: Very low confidence displays correctly
   */
  it('should handle very low confidence values', () => {
    render(<LowConfidenceWarning isVisible={true} confidence={0.15} />);
    
    expect(screen.getByText('Low Confidence')).toBeInTheDocument();
    expect(screen.getByText('(15%)')).toBeInTheDocument();
  });
});
