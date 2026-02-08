import React, { useState } from 'react';
import { BellIcon } from '../icons';

export interface Notification {
  id: string;
  type: 'medication' | 'feeding' | 'appointment' | 'health' | 'alert' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  urgent: boolean;
  petId?: string;
  petName?: string;
  actionUrl?: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onNotificationClick: (notification: Notification) => void;
}

const getNotificationIcon = (type: Notification['type']) => {
  const icons = {
    medication: '💊',
    feeding: '🍽️',
    appointment: '📅',
    health: '🏥',
    alert: '⚠️',
    info: 'ℹ️',
  };
  return icons[type];
};

const getNotificationColor = (type: Notification['type'], urgent: boolean) => {
  if (urgent) return 'bg-red-50 border-red-200';
  
  const colors = {
    medication: 'bg-purple-50 border-purple-200',
    feeding: 'bg-orange-50 border-orange-200',
    appointment: 'bg-blue-50 border-blue-200',
    health: 'bg-green-50 border-green-200',
    alert: 'bg-yellow-50 border-yellow-200',
    info: 'bg-gray-50 border-gray-200',
  };
  return colors[type];
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  onNotificationClick,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotifications = notifications.filter((notification) => {
    // Apply filter
    if (filter === 'unread' && notification.read) return false;
    if (filter === 'urgent' && !notification.urgent) return false;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        notification.title.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query) ||
        notification.petName?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const urgentCount = notifications.filter((n) => n.urgent && !n.read).length;

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg max-w-2xl w-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <BellIcon className="w-8 h-8 text-primary-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
          </div>
          {notifications.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={onMarkAllAsRead}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Mark all read
              </button>
              <button
                onClick={onClearAll}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('urgent')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'urgent'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Urgent ({urgentCount})
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="max-h-[600px] overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">🐾</div>
            <p className="text-gray-500 text-lg">
              {searchQuery
                ? 'No notifications match your search'
                : filter === 'unread'
                ? "You're all caught up!"
                : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
                onClick={() => onNotificationClick(notification)}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 ${getNotificationColor(
                      notification.type,
                      notification.urgent
                    )}`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className={`font-semibold ${
                              notification.read ? 'text-gray-700' : 'text-gray-900'
                            }`}
                          >
                            {notification.title}
                          </h3>
                          {notification.urgent && (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                              URGENT
                            </span>
                          )}
                          {!notification.read && (
                            <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                          )}
                        </div>
                        {notification.petName && (
                          <p className="text-sm text-primary-600 font-medium mb-1">
                            🐾 {notification.petName}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">{notification.message}</p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatTimestamp(notification.timestamp)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-2">
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsRead(notification.id);
                          }}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Mark as read
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(notification.id);
                        }}
                        className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
