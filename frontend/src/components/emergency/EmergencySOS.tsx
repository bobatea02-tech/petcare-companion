/**
 * EmergencySOS Component
 * 
 * Main emergency SOS interface that combines medical summary, vet finder, and emergency checklist.
 * Activated when user presses the SOS floating button.
 */

import React, { useState, useEffect, useRef } from 'react';
import { emergencyService, type EmergencySession, type ChecklistItem } from '@/services/EmergencyService';
import { MedicalHistorySummary } from './MedicalHistorySummary';
import { EmergencyVetFinder } from './EmergencyVetFinder';
import { EmergencySOSSkeleton } from '@/components/LoadingStates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, FileText, MapPin, ClipboardList, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { focusManagement, keyboardNav } from '@/lib/accessibility';

interface EmergencySOSProps {
  petId: string;
  onClose: () => void;
}

export const EmergencySOS: React.FC<EmergencySOSProps> = ({
  petId,
  onClose
}) => {
  const [session, setSession] = useState<EmergencySession | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [activeTab, setActiveTab] = useState('medical');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Activate emergency session
    const emergencySession = emergencyService.activateEmergency(petId);
    setSession(emergencySession);
    setChecklist(emergencySession.checklist);
    
    // Announce emergency mode activation
    focusManagement.announce('Emergency mode activated', 'assertive');
    
    // Focus on the first interactive element
    setTimeout(() => {
      if (containerRef.current) {
        focusManagement.focusFirst(containerRef.current);
      }
    }, 100);
  }, [petId]);

  // Handle keyboard navigation for closing
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (keyboardNav.isEscapeKey(event)) {
      onClose();
    }
  };

  const handleChecklistToggle = (itemId: string) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
    
    // Announce checklist item completion
    const item = checklist.find(i => i.id === itemId);
    if (item) {
      const newState = !item.completed ? 'completed' : 'uncompleted';
      focusManagement.announce(`Checklist item ${newState}: ${item.text}`);
    }
  };

  const handleShareMedicalSummary = () => {
    if (!session) return;

    // Create a shareable text version of the medical summary
    const summary = session.medicalSummary;
    const text = `
EMERGENCY MEDICAL SUMMARY - ${summary.petName}

Species: ${summary.species}
Breed: ${summary.breed}
Age: ${summary.age}

ALLERGIES:
${summary.allergies.length > 0 ? summary.allergies.join(', ') : 'None'}

CURRENT MEDICATIONS:
${summary.currentMedications.length > 0 
  ? summary.currentMedications.map(m => `- ${m.name}: ${m.dosage}, ${m.frequency}`).join('\n')
  : 'None'}

RECENT VET VISITS:
${summary.recentVetVisits.length > 0
  ? summary.recentVetVisits.map(v => `- ${new Date(v.date).toLocaleDateString()}: ${v.reason}`).join('\n')
  : 'None'}

VACCINATIONS:
${summary.vaccinations.length > 0
  ? summary.vaccinations.map(v => `- ${v.name}: ${new Date(v.date).toLocaleDateString()}`).join('\n')
  : 'None'}

${summary.emergencyNotes ? `EMERGENCY NOTES:\n${summary.emergencyNotes}` : ''}
    `.trim();

    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
      alert('Medical summary copied to clipboard! You can now share it with the vet.');
    }).catch(() => {
      alert('Unable to copy to clipboard. Please manually share the information shown on screen.');
    });
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const totalCount = checklist.length;
  const checklistProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (!session) {
    return <EmergencySOSSkeleton />;
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-title"
      aria-describedby="emergency-description"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-red-600 text-white p-4 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6" aria-hidden="true" />
            <div>
              <h1 id="emergency-title" className="text-xl font-bold">Emergency Mode Active</h1>
              <p id="emergency-description" className="text-sm text-red-100">
                {session.medicalSummary.petName} - {new Date(session.startedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-red-700"
            aria-label="Close emergency mode"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto p-4 pb-20">
        <Alert className="mb-4 border-red-500 bg-red-50 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900 dark:text-red-100">
            <strong>Emergency Mode:</strong> This screen provides quick access to your pet's medical information,
            nearby emergency vets, and an emergency checklist. Stay calm and follow the checklist.
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="medical" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Medical Info
            </TabsTrigger>
            <TabsTrigger value="vets" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Find Vets
            </TabsTrigger>
            <TabsTrigger value="checklist" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Checklist
              {completedCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {completedCount}/{totalCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="medical" className="space-y-4">
            <MedicalHistorySummary
              summary={session.medicalSummary}
              format="display"
              onShare={handleShareMedicalSummary}
            />
          </TabsContent>

          <TabsContent value="vets" className="space-y-4">
            <EmergencyVetFinder />
          </TabsContent>

          <TabsContent value="checklist" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Emergency Checklist
                  </span>
                  <div className="text-sm font-normal">
                    <Badge variant={checklistProgress === 100 ? 'default' : 'secondary'}>
                      {completedCount} of {totalCount} complete
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      item.completed ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : 'bg-muted'
                    }`}
                  >
                    <Checkbox
                      id={item.id}
                      checked={item.completed}
                      onCheckedChange={() => handleChecklistToggle(item.id)}
                      className="mt-1"
                    />
                    <label
                      htmlFor={item.id}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={item.completed ? 'line-through text-muted-foreground' : ''}>
                          {item.text}
                        </span>
                        <Badge
                          variant={
                            item.priority === 'high'
                              ? 'destructive'
                              : item.priority === 'medium'
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {item.priority}
                        </Badge>
                      </div>
                    </label>
                    {item.completed && (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                ))}

                {checklistProgress === 100 && (
                  <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-900 dark:text-green-100">
                      <strong>Checklist Complete!</strong> You're prepared for the emergency vet visit.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmergencySOS;
