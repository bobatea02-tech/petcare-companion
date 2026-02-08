'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface PrivacySettingsProps {
  onExportData: () => void;
  onDeleteAccount: () => void;
}

export function PrivacySettings({ onExportData, onDeleteAccount }: PrivacySettingsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleDeleteAccount = () => {
    if (deleteConfirmText === 'DELETE') {
      onDeleteAccount();
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Privacy & Data</h2>
        <p className="text-gray-600">Manage your data and privacy settings</p>
      </div>

      {/* Data Export */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>📦</span>
          Export Your Data
        </h3>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-gray-700 mb-4">
            Download a copy of all your pet data, health records, and activity logs. This includes:
          </p>
          <ul className="space-y-2 mb-4">
            <li className="flex items-start gap-2 text-gray-700">
              <span className="text-green-600 mt-1">✓</span>
              <span>Pet profiles and medical history</span>
            </li>
            <li className="flex items-start gap-2 text-gray-700">
              <span className="text-green-600 mt-1">✓</span>
              <span>Medication and feeding logs</span>
            </li>
            <li className="flex items-start gap-2 text-gray-700">
              <span className="text-green-600 mt-1">✓</span>
              <span>Appointment records and health assessments</span>
            </li>
            <li className="flex items-start gap-2 text-gray-700">
              <span className="text-green-600 mt-1">✓</span>
              <span>Uploaded documents and photos</span>
            </li>
          </ul>
          <Button onClick={onExportData} variant="outline" className="w-full md:w-auto">
            <span className="mr-2">⬇️</span>
            Download My Data
          </Button>
        </div>
      </div>

      {/* Privacy Controls */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>🔒</span>
          Privacy Controls
        </h3>
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-orange-300 transition-colors">
            <input
              type="checkbox"
              defaultChecked
              className="mt-1 w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
            />
            <div>
              <div className="font-medium text-gray-900">Share anonymized data for research</div>
              <div className="text-sm text-gray-600">
                Help improve pet care by sharing anonymized health data with veterinary researchers
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-orange-300 transition-colors">
            <input
              type="checkbox"
              defaultChecked
              className="mt-1 w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
            />
            <div>
              <div className="font-medium text-gray-900">Allow usage analytics</div>
              <div className="text-sm text-gray-600">
                Help us improve PawPal by collecting anonymous usage statistics
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-orange-300 transition-colors">
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
            />
            <div>
              <div className="font-medium text-gray-900">Marketing communications</div>
              <div className="text-sm text-gray-600">
                Receive tips, updates, and special offers about pet care
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Account Deletion */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>⚠️</span>
          Danger Zone
        </h3>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-semibold text-red-900 mb-2">Delete Account</h4>
          <p className="text-red-700 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Delete My Account
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-red-800 font-medium">
                Type <span className="font-mono bg-red-100 px-2 py-1 rounded">DELETE</span> to
                confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE'}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Deletion
                </Button>
                <Button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Retention Info */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <span>ℹ️</span>
          Data Retention Policy
        </h4>
        <p className="text-sm text-gray-700">
          We retain your data for as long as your account is active. After account deletion, some
          data may be retained for up to 30 days for backup purposes, then permanently deleted.
          Anonymized data used for research cannot be deleted as it's no longer linked to your
          identity.
        </p>
      </div>
    </div>
  );
}
