/**
 * MedicalHistorySummary Component
 * 
 * Displays a comprehensive medical history summary for emergency situations.
 * Can be displayed on screen or formatted for sharing with emergency vets.
 */

import React from 'react';
import { type MedicalSummary } from '@/services/EmergencyService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Pill, Syringe, Stethoscope, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MedicalHistorySummaryProps {
  summary: MedicalSummary;
  format?: 'display' | 'shareable';
  onShare?: () => void;
}

export const MedicalHistorySummary: React.FC<MedicalHistorySummaryProps> = ({
  summary,
  format = 'display',
  onShare
}) => {
  const isShareable = format === 'shareable';

  return (
    <Card className={isShareable ? 'border-2 border-red-500' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Emergency Medical Summary
          </span>
          {onShare && (
            <Button onClick={onShare} variant="outline" size="sm">
              Share with Vet
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pet Basic Info */}
        <div>
          <h3 className="font-semibold text-lg mb-2">{summary.petName}</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Species:</span>{' '}
              <span className="font-medium">{summary.species}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Breed:</span>{' '}
              <span className="font-medium">{summary.breed}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Age:</span>{' '}
              <span className="font-medium">{summary.age}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Allergies */}
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Allergies
          </h4>
          {summary.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {summary.allergies.map((allergy, index) => (
                <Badge key={index} variant="destructive">
                  {allergy}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No known allergies</p>
          )}
        </div>

        <Separator />

        {/* Current Medications */}
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-2">
            <Pill className="h-4 w-4 text-blue-500" />
            Current Medications
          </h4>
          {summary.currentMedications.length > 0 ? (
            <div className="space-y-2">
              {summary.currentMedications.map((med, index) => (
                <div key={index} className="text-sm bg-muted p-2 rounded">
                  <div className="font-medium">{med.name}</div>
                  <div className="text-muted-foreground">
                    {med.dosage} - {med.frequency}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No current medications</p>
          )}
        </div>

        <Separator />

        {/* Recent Vet Visits */}
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-2">
            <Stethoscope className="h-4 w-4 text-green-500" />
            Recent Vet Visits (Last 6 Months)
          </h4>
          {summary.recentVetVisits.length > 0 ? (
            <div className="space-y-2">
              {summary.recentVetVisits.map((visit, index) => (
                <div key={index} className="text-sm bg-muted p-2 rounded">
                  <div className="flex justify-between">
                    <span className="font-medium">{visit.reason}</span>
                    <span className="text-muted-foreground">
                      {new Date(visit.date).toLocaleDateString()}
                    </span>
                  </div>
                  {visit.diagnosis && (
                    <div className="text-muted-foreground mt-1">
                      {visit.diagnosis}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent vet visits</p>
          )}
        </div>

        <Separator />

        {/* Vaccinations */}
        <div>
          <h4 className="font-semibold flex items-center gap-2 mb-2">
            <Syringe className="h-4 w-4 text-purple-500" />
            Vaccinations
          </h4>
          {summary.vaccinations.length > 0 ? (
            <div className="space-y-2">
              {summary.vaccinations.map((vac, index) => (
                <div key={index} className="text-sm bg-muted p-2 rounded">
                  <div className="flex justify-between">
                    <span className="font-medium">{vac.name}</span>
                    <span className="text-muted-foreground">
                      {new Date(vac.date).toLocaleDateString()}
                    </span>
                  </div>
                  {vac.nextDue && (
                    <div className="text-muted-foreground mt-1">
                      Next due: {new Date(vac.nextDue).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No vaccination records</p>
          )}
        </div>

        {/* Emergency Notes */}
        {summary.emergencyNotes && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Emergency Notes</h4>
              <p className="text-sm bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
                {summary.emergencyNotes}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MedicalHistorySummary;
