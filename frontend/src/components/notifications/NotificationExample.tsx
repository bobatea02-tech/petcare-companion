/**
 * Notification Example Component
 * Demonstrates how to use the notification system
 * This is for demonstration purposes only - remove or adapt for production
 */

import { useState } from 'react';
import { notificationService } from '@/services/NotificationService';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export function NotificationExample() {
  const [status, setStatus] = useState<string>('');

  const testMedicationReminder = () => {
    notificationService.scheduleMedicationReminder(
      {
        id: 'med-demo-1',
        petId: 'pet-demo-1',
        name: 'Heartgard Plus',
        quantity: 5,
        dailyDosage: 1,
      },
      'Buddy'
    );
    setStatus('Medication reminder sent!');
  };

  const testVaccinationReminder = () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    
    notificationService.scheduleVaccinationReminder(
      {
        id: 'vac-demo-1',
        petId: 'pet-demo-1',
        name: 'Rabies Booster',
        dueDate: futureDate,
      },
      'Buddy'
    );
    setStatus('Vaccination reminder sent!');
  };

  const testGroomingReminder = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    notificationService.scheduleGroomingReminder(
      {
        id: 'groom-demo-1',
        petId: 'pet-demo-1',
        type: 'Bath & Nail Trim',
        scheduledTime: tomorrow,
      },
      'Buddy'
    );
    setStatus('Grooming reminder sent!');
  };

  const testBirthdayReminder = () => {
    const today = new Date();
    
    notificationService.scheduleBirthdayReminder({
      id: 'pet-demo-1',
      name: 'Buddy',
      birthday: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
    });
    setStatus('Birthday notification sent!');
  };

  const testPredictiveAlert = () => {
    // Simulate declining health score
    const healthScoreTrend = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      healthScoreTrend.push({
        date,
        score: 85 - (i * 3), // Declining score
      });
    }

    notificationService.analyzePatternsForAlerts('pet-demo-1', 'Buddy', {
      healthScoreTrend,
    });
    setStatus('Predictive alert sent!');
  };

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="font-['Anton'] text-2xl text-[#2D5016]">
          Notification System Demo
        </CardTitle>
        <CardDescription className="font-['Inter']">
          Test the notification features by clicking the buttons below
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={testMedicationReminder}
            className="bg-blue-500 hover:bg-blue-600 font-['Inter']"
          >
            Test Medication Reminder
          </Button>
          <Button
            onClick={testVaccinationReminder}
            className="bg-purple-500 hover:bg-purple-600 font-['Inter']"
          >
            Test Vaccination Reminder
          </Button>
          <Button
            onClick={testGroomingReminder}
            className="bg-pink-500 hover:bg-pink-600 font-['Inter']"
          >
            Test Grooming Reminder
          </Button>
          <Button
            onClick={testBirthdayReminder}
            className="bg-yellow-500 hover:bg-yellow-600 font-['Inter']"
          >
            Test Birthday Notification
          </Button>
          <Button
            onClick={testPredictiveAlert}
            className="bg-orange-500 hover:bg-orange-600 font-['Inter'] md:col-span-2"
          >
            Test Predictive Alert
          </Button>
        </div>

        {status && (
          <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
            <p className="text-green-800 font-['Inter'] text-sm">{status}</p>
          </div>
        )}

        <div className="mt-6 p-4 bg-[#F5F1E8] rounded-lg">
          <h3 className="font-['Inter'] font-semibold text-sm text-[#2D5016] mb-2">
            Instructions:
          </h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 font-['Inter']">
            <li>Click any button above to trigger a notification</li>
            <li>Check the notification center (bell icon) to see the notification</li>
            <li>If you've enabled push notifications, you'll also see a browser notification</li>
            <li>Try marking notifications as read or dismissing them</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
