/**
 * PrivacyControls Component
 * Allows users to select which profile sections to share
 */

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ProfileSection } from '@/services/ProfileSharingService';
import { 
  User, 
  Heart, 
  AlertTriangle, 
  Phone, 
  Utensils, 
  Pill 
} from 'lucide-react';

interface PrivacyControlsProps {
  selectedSections: ProfileSection[];
  onChange: (sections: ProfileSection[]) => void;
}

interface SectionOption {
  value: ProfileSection;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const SECTION_OPTIONS: SectionOption[] = [
  {
    value: 'basic_info',
    label: 'Basic Information',
    description: 'Name, breed, age, and photo',
    icon: <User className="h-4 w-4" />,
  },
  {
    value: 'medical_history',
    label: 'Medical History',
    description: 'Past illnesses, surgeries, and vet visits',
    icon: <Heart className="h-4 w-4" />,
  },
  {
    value: 'allergies',
    label: 'Allergies',
    description: 'Food and medication allergies',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  {
    value: 'emergency_contacts',
    label: 'Emergency Contacts',
    description: 'Vet and owner contact information',
    icon: <Phone className="h-4 w-4" />,
  },
  {
    value: 'feeding_schedule',
    label: 'Feeding Schedule',
    description: 'Meal times, portions, and dietary preferences',
    icon: <Utensils className="h-4 w-4" />,
  },
  {
    value: 'medications',
    label: 'Medications',
    description: 'Current medications and dosages',
    icon: <Pill className="h-4 w-4" />,
  },
];

export const PrivacyControls: React.FC<PrivacyControlsProps> = ({
  selectedSections,
  onChange,
}) => {
  const handleToggleSection = (section: ProfileSection) => {
    if (selectedSections.includes(section)) {
      // Remove section
      const newSections = selectedSections.filter(s => s !== section);
      onChange(newSections);
    } else {
      // Add section
      onChange([...selectedSections, section]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Select the information you want to share. At least one section must be selected.
      </div>
      
      <div className="space-y-3">
        {SECTION_OPTIONS.map((option) => (
          <div
            key={option.value}
            className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors"
          >
            <Checkbox
              id={option.value}
              checked={selectedSections.includes(option.value)}
              onCheckedChange={() => handleToggleSection(option.value)}
              className="mt-1"
            />
            <div className="flex-1 space-y-1">
              <Label
                htmlFor={option.value}
                className="flex items-center gap-2 font-medium cursor-pointer"
              >
                {option.icon}
                {option.label}
              </Label>
              <p className="text-sm text-muted-foreground">
                {option.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {selectedSections.length === 0 && (
        <div className="text-sm text-destructive">
          Please select at least one section to share
        </div>
      )}
    </div>
  );
};
