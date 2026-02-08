'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  vetName?: string;
  vetPhone?: string;
  vetEmail?: string;
}

interface ProfileSettingsProps {
  profile: ProfileData;
  onUpdate: (profile: ProfileData) => void;
  onSave: () => void;
}

export function ProfileSettings({ profile, onUpdate, onSave }: ProfileSettingsProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar || null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: keyof ProfileData, value: string) => {
    onUpdate({ ...profile, [field]: value });
    setHasChanges(true);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
        handleChange('avatar', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave();
    setHasChanges(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Settings</h2>
        <p className="text-gray-600">Manage your personal information and contact details</p>
      </div>

      {/* Avatar Upload */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-pink-400 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              profile.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
            <span className="text-2xl">🐾</span>
          </div>
        </div>
        <div>
          <label htmlFor="avatar-upload">
            <Button variant="outline" size="sm" className="cursor-pointer">
              Upload Photo
            </Button>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </label>
          <p className="text-sm text-gray-500 mt-2">JPG, PNG or GIF. Max 5MB.</p>
        </div>
      </div>

      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>👤</span>
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <Input
              value={profile.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              value={profile.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <Input
              type="tel"
              value={profile.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>
      </div>

      {/* Veterinarian Contact */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span>🏥</span>
          Veterinarian Contact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vet Name</label>
            <Input
              value={profile.vetName || ''}
              onChange={(e) => handleChange('vetName', e.target.value)}
              placeholder="Dr. Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vet Phone</label>
            <Input
              type="tel"
              value={profile.vetPhone || ''}
              onChange={(e) => handleChange('vetPhone', e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Vet Email</label>
            <Input
              type="email"
              value={profile.vetEmail || ''}
              onChange={(e) => handleChange('vetEmail', e.target.value)}
              placeholder="vet@clinic.com"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <p className="text-sm text-orange-600 flex items-center gap-2">
            <span>⚠️</span>
            You have unsaved changes
          </p>
          <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
