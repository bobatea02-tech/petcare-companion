import React, { useState, useMemo } from 'react';
import { Notification } from './NotificationCenter';

interface NotificationHistoryProps {
  notifications: Notification[];
  onDelete: (id: string) => void;
  onClearHistory: () => void;
}

type DateRange = 'today' | 'yesterday' | 'week' | 'month' | 'older';

export const NotificationHistory: React.FC<NotificationHistoryProps> = ({
  notifications,
  onDelete,
  onClearHistory,
}) => {
  const [selectedType, setSelectedType] = useState<Notification['type'] | 'all'>('all');
  const [selectedRange, setSelectedRange] = useState<DateRange | 'all'>('all');

  const getDateRange = (date: Date): DateRange => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const notifDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (notifDate.getTime() === today.getTime()) return 'today';
    if (notifDate.getTime() === yesterday.getTime()) return 'yesterday';
    if (notifDate >= weekAgo) return 'week';
    if (notifDate >= monthAgo) return 'month';
    return 'older';
  };

  const groupedNotifications = useMemo(() => {
    const filtered = notifications.filter((notif) => {
      if (selectedType !== 'all' && notif.type !== selectedType) return false;
      if (selectedRange !== 'all' && getDateRange(notif.timestamp) !== selectedRange)
        return false;
      return true;
    });

    const groups: Record<DateRange, Notification[]> = {
      today: [],
      yesterday: [],
      week: [],
      month: [],
      older: [],
    };

    filtered.forEach((notif) => {
      const range = getDateRange(notif.timestamp);
      groups[range].push(notif);
    });

    return groups;
  }, [notifications, selectedType, selectedRange]);

  const rangeLabels: Record<DateRange, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    week: 'This Week',
    month: 'This Month',
    older: 'Older',
  };

  const typeOptions: Array<{ value: Notification['type'] | 'all'; label: string; icon: string }> =
    [
      { value: 'all', label: 'All Types', icon: '📋' },
      { value: 'medication', label: 'Medication', icon: '💊' },
      { value: 'feeding', label: 'Feeding', icon: '🍽️' },
      { value: 'appointment', label: 'Appointments', icon: '📅' },
      { value: 'health', label: 'Health', icon: '🏥' },
      { value: 'alert', label: 'Alerts', icon: '⚠️' },
      { value: 'info', label: 'Info', icon: 'ℹ️' },
    ];

  const rangeOptions: Array<{ value: DateRange | 'all'; label: string }> = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'older', label: 'Older' },
  ];

  const totalFiltered = Object.values(groupedNotifications).reduce(
    (sum, group) => sum + group.length,
    0
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg max-w-4xl w-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">📜 Notification History</h2>
          {notifications.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear History
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Type filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
            <div className="flex flex-wrap gap-2">
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedType(option.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedType === option.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.icon} {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Date
            </label>
            <div className="flex flex-wrap gap-2">
              {rangeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedRange(option.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedRange === option.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {totalFiltered} of {notifications.length} notifications
        </div>
      </div>

      {/* Notification groups */}
      <div className="max-h-[600px] overflow-y-auto">
        {totalFiltered === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">🐾</div>
            <p className="text-gray-500 text-lg">No notifications found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {(Object.keys(groupedNotifications) as DateRange[]).map((range) => {
              const group = groupedNotifications[range];
              if (group.length === 0) return null;

              return (
                <div key={range} className="p-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                    {rangeLabels[range]} ({group.length})
                  </h3>
                  <div className="space-y-2">
                    {group.map((notification) => (
                      <div
                        key={notification.id}
                        className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">
                                {notification.type === 'medication' && '💊'}
                                {notification.type === 'feeding' && '🍽️'}
                                {notification.type === 'appointment' && '📅'}
                                {notification.type === 'health' && '🏥'}
                                {notification.type === 'alert' && '⚠️'}
                                {notification.type === 'info' && 'ℹ️'}
                              </span>
                              <h4 className="font-semibold text-gray-900 text-sm">
                                {notification.title}
                              </h4>
                              {notification.urgent && (
                                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                  URGENT
                                </span>
                              )}
                            </div>
                            {notification.petName && (
                              <p className="text-xs text-primary-600 font-medium mb-1">
                                🐾 {notification.petName}
                              </p>
                            )}
                            <p className="text-sm text-gray-600">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.timestamp.toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => onDelete(notification.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            aria-label="Delete notification"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
