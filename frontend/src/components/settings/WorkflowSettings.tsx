'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface WorkflowSchedule {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  time: string;
  days: string[];
}

interface WorkflowSettingsProps {
  workflows: WorkflowSchedule[];
  onUpdate: (workflows: WorkflowSchedule[]) => void;
  onSave: () => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function WorkflowSettings({ workflows, onUpdate, onSave }: WorkflowSettingsProps) {
  const [hasChanges, setHasChanges] = useState(false);

  const handleToggle = (id: string) => {
    const updated = workflows.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w));
    onUpdate(updated);
    setHasChanges(true);
  };

  const handleTimeChange = (id: string, time: string) => {
    const updated = workflows.map((w) => (w.id === id ? { ...w, time } : w));
    onUpdate(updated);
    setHasChanges(true);
  };

  const handleDayToggle = (id: string, day: string) => {
    const updated = workflows.map((w) => {
      if (w.id === id) {
        const days = w.days.includes(day)
          ? w.days.filter((d) => d !== day)
          : [...w.days, day];
        return { ...w, days };
      }
      return w;
    });
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Automated Workflows</h2>
        <p className="text-gray-600">Customize your automated reminders and schedules</p>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
        <span className="text-2xl">💡</span>
        <div>
          <h4 className="font-semibold text-gray-900 mb-1">About Workflows</h4>
          <p className="text-sm text-gray-700">
            Workflows automatically send you reminders for medications, feeding times, and
            appointments. Customize when and how often you receive these notifications.
          </p>
        </div>
      </div>

      {/* Workflow List */}
      <div className="space-y-4">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className={cn(
              'p-5 border-2 rounded-lg transition-all',
              workflow.enabled
                ? 'border-orange-300 bg-orange-50'
                : 'border-gray-200 bg-white opacity-75'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{workflow.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                  <p className="text-sm text-gray-600">
                    {workflow.enabled ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={workflow.enabled}
                  onChange={() => handleToggle(workflow.id)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            {/* Schedule Settings */}
            {workflow.enabled && (
              <div className="space-y-4 ml-11">
                {/* Time Picker */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700">Time:</label>
                  <input
                    type="time"
                    value={workflow.time}
                    onChange={(e) => handleTimeChange(workflow.id, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {/* Day Selector */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Days:</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => (
                      <button
                        key={day}
                        onClick={() => handleDayToggle(workflow.id, day)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                          workflow.days.includes(day)
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
            Save Workflows
          </Button>
        </div>
      )}
    </div>
  );
}
