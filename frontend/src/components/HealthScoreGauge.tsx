/**
 * Health Score Gauge Component
 * Displays a color-coded visual gauge for health scores
 */

import React from 'react';
import { healthScoreCalculator } from '@/services/HealthScoreCalculator';
import { getHealthScoreAriaLabel } from '@/lib/accessibility';

interface HealthScoreGaugeProps {
  score: number; // 0-100
  size?: 'small' | 'medium' | 'large';
}

export const HealthScoreGauge: React.FC<HealthScoreGaugeProps> = ({ 
  score, 
  size = 'medium' 
}) => {
  const color = healthScoreCalculator.getScoreColor(score);
  
  // Size configurations
  const sizeConfig = {
    small: { width: 80, height: 80, fontSize: '1.5rem', strokeWidth: 8 },
    medium: { width: 120, height: 120, fontSize: '2rem', strokeWidth: 10 },
    large: { width: 160, height: 160, fontSize: '2.5rem', strokeWidth: 12 },
  };

  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  // Color mapping
  const colorMap = {
    red: '#ef4444',
    yellow: '#eab308',
    green: '#22c55e',
  };

  const strokeColor = colorMap[color];

  return (
    <div 
      className="flex flex-col items-center justify-center"
      role="img"
      aria-label={getHealthScoreAriaLabel(score)}
    >
      <div className="relative" style={{ width: config.width, height: config.height }}>
        <svg
          width={config.width}
          height={config.height}
          className="transform -rotate-90"
          aria-hidden="true"
        >
          {/* Background circle */}
          <circle
            cx={config.width / 2}
            cy={config.height / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={config.strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={config.width / 2}
            cy={config.height / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={config.strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Score text */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ fontSize: config.fontSize }}
          aria-hidden="true"
        >
          <span className="font-bold" style={{ color: strokeColor }}>
            {score}
          </span>
        </div>
      </div>
    </div>
  );
};
