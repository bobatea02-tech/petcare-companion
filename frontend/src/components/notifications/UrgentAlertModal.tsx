import React from 'react';
import { Modal } from '../ui/Modal';

export interface UrgentAlert {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium';
  petName: string;
  petId: string;
  timestamp: Date;
  actions: {
    primary: {
      label: string;
      onClick: () => void;
    };
    secondary?: {
      label: string;
      onClick: () => void;
    };
  };
  details?: {
    label: string;
    value: string;
  }[];
}

interface UrgentAlertModalProps {
  alert: UrgentAlert | null;
  isOpen: boolean;
  onClose: () => void;
}

const severityConfig = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    icon: '🚨',
    iconBg: 'bg-red-100',
    textColor: 'text-red-900',
    buttonBg: 'bg-red-600 hover:bg-red-700',
  },
  high: {
    bg: 'bg-orange-50',
    border: 'border-orange-500',
    icon: '⚠️',
    iconBg: 'bg-orange-100',
    textColor: 'text-orange-900',
    buttonBg: 'bg-orange-600 hover:bg-orange-700',
  },
  medium: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-500',
    icon: '⚡',
    iconBg: 'bg-yellow-100',
    textColor: 'text-yellow-900',
    buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
  },
};

export const UrgentAlertModal: React.FC<UrgentAlertModalProps> = ({
  alert,
  isOpen,
  onClose,
}) => {
  if (!alert) return null;

  const config = severityConfig[alert.severity];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className={`${config.bg} border-4 ${config.border} rounded-2xl p-6`}>
        {/* Header with animated icon */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className={`${config.iconBg} rounded-full p-4 animate-pulse-scale flex-shrink-0`}
          >
            <span className="text-4xl">{config.icon}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-3 py-1 ${config.buttonBg} text-white text-xs font-bold rounded-full uppercase`}
              >
                {alert.severity} Alert
              </span>
              <span className="text-sm text-gray-600">
                {alert.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <h2 className={`text-2xl font-bold ${config.textColor} mb-2`}>
              {alert.title}
            </h2>
            <p className="text-lg font-medium text-primary-600 flex items-center gap-2">
              🐾 {alert.petName}
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="mb-6 p-4 bg-white rounded-lg border-2 border-gray-200">
          <p className="text-gray-800 text-lg leading-relaxed">{alert.message}</p>
        </div>

        {/* Details */}
        {alert.details && alert.details.length > 0 && (
          <div className="mb-6 space-y-2">
            {alert.details.map((detail, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-white rounded-lg"
              >
                <span className="font-medium text-gray-700">{detail.label}:</span>
                <span className="text-gray-900">{detail.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              alert.actions.primary.onClick();
              onClose();
            }}
            className={`flex-1 ${config.buttonBg} text-white px-6 py-3 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all`}
          >
            {alert.actions.primary.label}
          </button>
          {alert.actions.secondary && (
            <button
              onClick={() => {
                alert.actions.secondary!.onClick();
                onClose();
              }}
              className="flex-1 bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold text-lg border-2 border-gray-300 hover:bg-gray-50 transition-colors"
            >
              {alert.actions.secondary.label}
            </button>
          )}
        </div>

        {/* Dismiss option */}
        <button
          onClick={onClose}
          className="w-full mt-3 text-gray-600 hover:text-gray-800 text-sm font-medium py-2"
        >
          Dismiss Alert
        </button>
      </div>

      {/* Paw print decorations */}
      <div className="absolute top-4 right-4 text-4xl opacity-20 animate-float">🐾</div>
      <div className="absolute bottom-4 left-4 text-3xl opacity-20 animate-float-delayed">
        🐾
      </div>
    </Modal>
  );
};

// Custom animations
export const urgentAlertAnimations = `
  @keyframes pulse-scale {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px) rotate(0deg);
    }
    50% {
      transform: translateY(-10px) rotate(5deg);
    }
  }

  @keyframes float-delayed {
    0%, 100% {
      transform: translateY(0px) rotate(0deg);
    }
    50% {
      transform: translateY(-8px) rotate(-5deg);
    }
  }

  .animate-pulse-scale {
    animation: pulse-scale 2s ease-in-out infinite;
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .animate-float-delayed {
    animation: float-delayed 3s ease-in-out infinite 1.5s;
  }
`;
