'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface NotificationChannel {
  push: boolean;
  email: boolean;
  sms: boolean;
}

interface NotificationCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
  channels: NotificationChannel;
  time?: string;
}

interface NotificationSettingsProps {
  categories: NotificationCategory[];
  onUpdate: (categories: NotificationCategory[]) => void;
  onSave: () => void;
}

export function NotificationSettings({ categories, onUpdate, onSave }: NotificationSettingsProps) {
  const [hasChanges, setHasChanges] = useState(false);

  const handleChannelToggle = (categoryId: string, channel: keyof NotificationChannel) => {
    const updated = categories.map((cat) =>
      cat.id === categoryId
        ? { ...cat, channels: { ...cat.channels, [channel]: !cat.channels[channel] } }
        : cat
    );
    onUpdate(updated);
    setHasChanges(true);
  };

  const handleTimeChange = (categoryId: string, time: string) => {
    const updated = categories.map((cat) =>
      cat.id === categoryId ? { ...cat, time } : cat
    );
    onUpdate(updated);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave();
    setHasChanges(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Notification Preferences</h2>
        <p className="text-gray-600">Choose how you want to receive notifications</p>
      </div>

      {/* Channel Legend */}
      <div className="flex flex-wrap gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔔</span>
          <span className="text-sm font-medium text-gray-700">Push</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl">📧</span>
          <span className="text-sm font-medium text-gray-700">Email</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl">📱</span>
          <span className="text-sm font-medium text-gray-700">SMS</span>
        </div>
      </div>

      {/* Notification Categories */}
      <div className="space-y-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{category.label}</h3>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 ml-11">
              {/* Channel Toggles */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={category.channels.push}
                  onChange={() => handleChannelToggle(category.id, 'push')}
                  className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">🔔 Push</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={category.channels.email}
                  onChange={() => handleChannelToggle(category.id, 'email')}
                  className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">📧 Email</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={category.channels.sms}
                  onChange={() => handleChannelToggle(category.id, 'sms')}
                  className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">📱 SMS</span>
              </label>

              {/* Time Picker for scheduled notifications */}
              {category.time !== undefined && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-gray-600">Remind at:</span>
                  <input
                    type="time"
                    value={category.time}
                    onChange={(e) => handleTimeChange(category.id, e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-sm text-orange-600 flex items-center gap-2">
            <span>⚠️</span>
            You have unsaved changes
          </p>
          <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
            Save Preferences
          </Button>
        </div>
      )}
    </div>
  );
}
