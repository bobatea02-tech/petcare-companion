'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

export interface SettingsSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

interface SettingsLayoutProps {
  sections: SettingsSection[];
  defaultSection?: string;
}

export function SettingsLayout({ sections, defaultSection }: SettingsLayoutProps) {
  const [activeSection, setActiveSection] = useState(defaultSection || sections[0]?.id);

  const currentSection = sections.find((s) => s.id === activeSection);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your PawPal account and preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all',
                    'hover:bg-orange-50',
                    activeSection === section.id
                      ? 'bg-orange-100 text-orange-700 font-medium'
                      : 'text-gray-700'
                  )}
                >
                  <span className="text-xl">{section.icon}</span>
                  <span>{section.label}</span>
                </button>
              ))}
            </nav>

            {/* Decorative Paw Prints */}
            <div className="hidden lg:block mt-6 space-y-2 opacity-20">
              <div className="text-4xl">🐾</div>
              <div className="text-3xl ml-8">🐾</div>
              <div className="text-2xl ml-4">🐾</div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
              {currentSection?.component}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
