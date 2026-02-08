'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'zh';

interface ThemeSettingsProps {
  theme: Theme;
  language: Language;
  onThemeChange: (theme: Theme) => void;
  onLanguageChange: (language: Language) => void;
}

const themes: { value: Theme; label: string; icon: string; description: string }[] = [
  { value: 'light', label: 'Light', icon: '☀️', description: 'Bright and cheerful' },
  { value: 'dark', label: 'Dark', icon: '🌙', description: 'Easy on the eyes' },
  { value: 'system', label: 'System', icon: '💻', description: 'Match your device' },
];

const languages: { value: Language; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'zh', label: '中文', flag: '🇨🇳' },
];

export function ThemeSettings({
  theme,
  language,
  onThemeChange,
  onLanguageChange,
}: ThemeSettingsProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Appearance & Language</h2>
        <p className="text-gray-600">Customize how PawPal looks and speaks</p>
      </div>

      {/* Theme Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>🎨</span>
          Theme
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themes.map((t) => (
            <button
              key={t.value}
              onClick={() => onThemeChange(t.value)}
              className={cn(
                'p-4 border-2 rounded-lg text-left transition-all',
                'hover:border-orange-300 hover:shadow-md',
                theme === t.value
                  ? 'border-orange-500 bg-orange-50 shadow-md'
                  : 'border-gray-200 bg-white'
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{t.icon}</span>
                <span className="font-semibold text-gray-900">{t.label}</span>
              </div>
              <p className="text-sm text-gray-600">{t.description}</p>
              {theme === t.value && (
                <div className="mt-2 flex items-center gap-1 text-orange-600 text-sm font-medium">
                  <span>✓</span>
                  <span>Active</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Language Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>🌍</span>
          Language
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {languages.map((lang) => (
            <button
              key={lang.value}
              onClick={() => onLanguageChange(lang.value)}
              className={cn(
                'p-4 border-2 rounded-lg text-left transition-all flex items-center gap-3',
                'hover:border-orange-300',
                language === lang.value
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white'
              )}
            >
              <span className="text-3xl">{lang.flag}</span>
              <span className="font-medium text-gray-900">{lang.label}</span>
              {language === lang.value && (
                <span className="ml-auto text-orange-600">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="p-6 bg-gradient-to-br from-orange-50 to-pink-50 rounded-lg border border-orange-200">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🐾</span>
          <h4 className="font-semibold text-gray-900">Preview</h4>
        </div>
        <p className="text-gray-700 mb-2">
          Your PawPal experience will look great in {theme} mode!
        </p>
        <p className="text-sm text-gray-600">
          Language: {languages.find((l) => l.value === language)?.label}
        </p>
      </div>
    </div>
  );
}
