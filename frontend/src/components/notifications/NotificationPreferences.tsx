import React, { useState } from 'react';
import { BellIcon } from '../icons';

export interface NotificationPreference {
  id: string;
  category: string;
  label: string;
  description: string;
  channels: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  timing?: {
    enabled: boolean;
    time: string; // HH:MM format
  };
}

interface NotificationPreferencesProps {
  preferences: NotificationPreference[];
  onUpdate: (preferences: NotificationPreference[]) => void;
  onSave: () => void;
}

const categories = [
  { id: 'medication', label: 'Medication Reminders', icon: '💊' },
  { id: 'feeding', label: 'Feeding Reminders', icon: '🍽️' },
  { id: 'appointments', label: 'Appointments', icon: '📅' },
  { id: 'health', label: 'Health Updates', icon: '🏥' },
  { id: 'alerts', label: 'Urgent Alerts', icon: '⚠️' },
  { id: 'reports', label: 'Weekly Reports', icon: '📊' },
];

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  preferences,
  onUpdate,
  onSave,
}) => {
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [hasChanges, setHasChanges] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState('default');

  const sounds = [
    { id: 'default', label: 'Default Bell', preview: '🔔' },
    { id: 'bark', label: 'Friendly Bark', preview: '🐕' },
    { id: 'meow', label: 'Gentle Meow', preview: '🐱' },
    { id: 'chirp', label: 'Bird Chirp', preview: '🐦' },
    { id: 'none', label: 'Silent', preview: '🔇' },
  ];

  const updatePreference = (
    id: string,
    channel: 'push' | 'email' | 'sms',
    value: boolean
  ) => {
    const updated = localPreferences.map((pref) =>
      pref.id === id
        ? {
            ...pref,
            channels: {
              ...pref.channels,
              [channel]: value,
            },
          }
        : pref
    );
    setLocalPreferences(updated);
    setHasChanges(true);
  };

  const updateTiming = (id: string, enabled: boolean, time?: string) => {
    const updated = localPreferences.map((pref) =>
      pref.id === id
        ? {
            ...pref,
            timing: {
              enabled,
              time: time || pref.timing?.time || '09:00',
            },
          }
        : pref
    );
    setLocalPreferences(updated);
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate(localPreferences);
    onSave();
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalPreferences(preferences);
    setHasChanges(false);
  };

  const getPreferencesByCategory = (categoryId: string) => {
    return localPreferences.filter((pref) => pref.category === categoryId);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg max-w-4xl w-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <BellIcon className="w-8 h-8 text-primary-500" />
          <h2 className="text-2xl font-bold text-gray-900">Notification Preferences</h2>
        </div>
        <p className="text-gray-600">
          Customize how and when you receive notifications about your pets
        </p>
      </div>

      <div className="p-6">
        {/* Sound Settings */}
        <div className="mb-8 p-4 bg-gray-50 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sound Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-900">Enable Notification Sounds</label>
                <p className="text-sm text-gray-600">Play sounds for notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>

            {soundEnabled && (
              <div>
                <label className="block font-medium text-gray-900 mb-2">
                  Notification Sound
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {sounds.map((sound) => (
                    <button
                      key={sound.id}
                      onClick={() => setSelectedSound(sound.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedSound === sound.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{sound.preview}</div>
                      <div className="text-xs font-medium text-gray-700">{sound.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notification Categories */}
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryPrefs = getPreferencesByCategory(category.id);
            if (categoryPrefs.length === 0) return null;

            return (
              <div key={category.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{category.icon}</span>
                  <h3 className="text-lg font-semibold text-gray-900">{category.label}</h3>
                </div>

                <div className="space-y-4">
                  {categoryPrefs.map((pref) => (
                    <div key={pref.id} className="border-l-4 border-primary-200 pl-4">
                      <div className="mb-3">
                        <h4 className="font-medium text-gray-900">{pref.label}</h4>
                        <p className="text-sm text-gray-600">{pref.description}</p>
                      </div>

                      {/* Channel toggles */}
                      <div className="flex flex-wrap gap-4 mb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pref.channels.push}
                            onChange={(e) =>
                              updatePreference(pref.id, 'push', e.target.checked)
                            }
                            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            🔔 Push Notifications
                          </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pref.channels.email}
                            onChange={(e) =>
                              updatePreference(pref.id, 'email', e.target.checked)
                            }
                            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium text-gray-700">📧 Email</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pref.channels.sms}
                            onChange={(e) =>
                              updatePreference(pref.id, 'sms', e.target.checked)
                            }
                            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm font-medium text-gray-700">📱 SMS</span>
                        </label>
                      </div>

                      {/* Timing settings */}
                      {pref.timing && (
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={pref.timing.enabled}
                              onChange={(e) =>
                                updateTiming(pref.id, e.target.checked, pref.timing?.time)
                              }
                              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              Custom time
                            </span>
                          </label>
                          {pref.timing.enabled && (
                            <input
                              type="time"
                              value={pref.timing.time}
                              onChange={(e) =>
                                updateTiming(pref.id, true, e.target.value)
                              }
                              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        {hasChanges && (
          <div className="mt-6 flex gap-3 justify-end p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800 flex-1">
              You have unsaved changes to your notification preferences
            </p>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium transition-colors"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
