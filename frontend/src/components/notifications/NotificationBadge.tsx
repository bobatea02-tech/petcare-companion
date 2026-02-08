import React from 'react';

interface NotificationBadgeProps {
  count: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'danger' | 'warning';
  showZero?: boolean;
  pulse?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 text-[10px]',
  md: 'w-5 h-5 text-xs',
  lg: 'w-6 h-6 text-sm',
};

const variantClasses = {
  primary: 'bg-primary-500',
  danger: 'bg-red-500',
  warning: 'bg-yellow-500',
};

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  max = 99,
  size = 'md',
  variant = 'danger',
  showZero = false,
  pulse = false,
  className = '',
}) => {
  if (count === 0 && !showZero) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <span
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${pulse ? 'animate-pulse' : ''}
        ${className}
        inline-flex items-center justify-center
        text-white font-bold rounded-full
        shadow-lg
      `}
      aria-label={`${count} unread notifications`}
    >
      {displayCount}
    </span>
  );
};

// Badge with icon wrapper
interface IconWithBadgeProps {
  icon: React.ReactNode;
  count: number;
  max?: number;
  badgeSize?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'danger' | 'warning';
  pulse?: boolean;
  onClick?: () => void;
  className?: string;
}

export const IconWithBadge: React.FC<IconWithBadgeProps> = ({
  icon,
  count,
  max = 99,
  badgeSize = 'md',
  variant = 'danger',
  pulse = false,
  onClick,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center justify-center ${className}`}
      aria-label={`Notifications: ${count} unread`}
    >
      {icon}
      {count > 0 && (
        <span className="absolute -top-1 -right-1">
          <NotificationBadge
            count={count}
            max={max}
            size={badgeSize}
            variant={variant}
            pulse={pulse}
          />
        </span>
      )}
    </button>
  );
};

// Inline badge for lists
interface InlineBadgeProps {
  label: string;
  count: number;
  variant?: 'primary' | 'danger' | 'warning' | 'success' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

const inlineVariantClasses = {
  primary: 'bg-primary-100 text-primary-800',
  danger: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  success: 'bg-green-100 text-green-800',
  info: 'bg-blue-100 text-blue-800',
};

const inlineSizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export const InlineBadge: React.FC<InlineBadgeProps> = ({
  label,
  count,
  variant = 'primary',
  size = 'md',
}) => {
  return (
    <span
      className={`
        ${inlineVariantClasses[variant]}
        ${inlineSizeClasses[size]}
        inline-flex items-center gap-1.5 rounded-full font-semibold
      `}
    >
      <span>{label}</span>
      {count > 0 && (
        <span className="bg-white bg-opacity-50 px-1.5 rounded-full">{count}</span>
      )}
    </span>
  );
};

// Dot indicator for minimal badge
interface DotIndicatorProps {
  show: boolean;
  variant?: 'primary' | 'danger' | 'warning' | 'success';
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const dotSizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

export const DotIndicator: React.FC<DotIndicatorProps> = ({
  show,
  variant = 'danger',
  pulse = true,
  size = 'md',
  className = '',
}) => {
  if (!show) return null;

  return (
    <span
      className={`
        ${dotSizeClasses[size]}
        ${variantClasses[variant]}
        ${pulse ? 'animate-pulse' : ''}
        ${className}
        rounded-full inline-block
      `}
      aria-label="New notification indicator"
    />
  );
};
