/**
 * Voice Usage Admin Page
 * Feature: jojo-voice-assistant-enhanced
 * Requirement: 15.6
 * 
 * Admin page for viewing JoJo voice assistant usage statistics
 */

import React from 'react';
import { UsageDashboard } from '@/components/voice/UsageDashboard';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export const VoiceUsageAdmin: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Voice Assistant Admin</h1>
              <p className="text-sm text-muted-foreground">
                Monitor JoJo's usage and performance
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-6">
        <UsageDashboard />
      </div>
    </div>
  );
};

export default VoiceUsageAdmin;
