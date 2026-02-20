/**
 * Medication Calendar Component
 * Unified medication calendar showing all pets' medication timings
 * Feature: additional-amazing-features
 * Task: 9.3 Create MedicationCalendar component
 * Requirements: 6.4
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { comparisonService, Pet, Medication } from '@/services/ComparisonService';
import { MedicationEvent } from '@/types/features';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { Pill, Clock } from 'lucide-react';

interface MedicationCalendarProps {
  pets: Pet[];
}

export const MedicationCalendar: React.FC<MedicationCalendarProps> = ({ pets }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Mock medications - in production, this would come from API
  const medications = useMemo((): Medication[] => {
    const meds: Medication[] = [];
    const now = new Date();

    pets.forEach((pet, index) => {
      // Generate 1-2 medications per pet
      const medCount = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < medCount; i++) {
        const schedule: Date[] = [];
        // Generate medication schedule for next 30 days
        for (let day = 0; day < 30; day++) {
          // Some medications are daily, some every other day
          if (i === 0 || day % 2 === 0) {
            const date = new Date(now);
            date.setDate(date.getDate() + day);
            date.setHours(8 + i * 12, 0, 0, 0); // 8 AM or 8 PM
            schedule.push(date);
          }
        }

        meds.push({
          petId: pet.id,
          name: i === 0 ? 'Vitamin Supplement' : 'Flea Prevention',
          schedule,
          completed: false,
        });
      }
    });

    return meds;
  }, [pets]);

  // Get medication events for the selected month
  const monthEvents = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);

    return comparisonService.getMedicationCalendar(pets, medications, start, end);
  }, [pets, medications, selectedDate]);

  // Get events for the selected date
  const dayEvents = useMemo(() => {
    return monthEvents.filter((event) => isSameDay(event.time, selectedDate));
  }, [monthEvents, selectedDate]);

  // Get dates that have medication events
  const datesWithEvents = useMemo(() => {
    const dates = new Set<string>();
    monthEvents.forEach((event) => {
      dates.add(format(event.time, 'yyyy-MM-dd'));
    });
    return dates;
  }, [monthEvents]);

  // Group events by pet for the selected date
  const eventsByPet = useMemo(() => {
    const grouped: { [petId: string]: MedicationEvent[] } = {};
    dayEvents.forEach((event) => {
      if (!grouped[event.petId]) {
        grouped[event.petId] = [];
      }
      grouped[event.petId].push(event);
    });
    return grouped;
  }, [dayEvents]);

  // Get pet color
  const getPetColor = (petId: string): string => {
    const colors = ['bg-forest-600', 'bg-sage-600', 'bg-green-600', 'bg-teal-600', 'bg-emerald-600'];
    const index = pets.findIndex((p) => p.id === petId);
    return colors[index % colors.length];
  };

  if (medications.length === 0) {
    return (
      <div className="text-center py-8 text-sage-600">
        <Pill className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No medication schedules found for your pets.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar View */}
        <Card className="bg-white border-sage-200">
          <CardContent className="pt-6">
            <h4 className="text-sm font-semibold text-sage-700 mb-4">
              Medication Schedule
            </h4>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border border-sage-200"
              modifiers={{
                hasEvent: (date) => datesWithEvents.has(format(date, 'yyyy-MM-dd')),
              }}
              modifiersStyles={{
                hasEvent: {
                  fontWeight: 'bold',
                  textDecoration: 'underline',
                  color: '#2D5016',
                },
              }}
            />
            <div className="mt-4 text-xs text-sage-600">
              <p>Dates with medications are underlined</p>
              <p className="mt-1">
                Total events this month: <span className="font-semibold">{monthEvents.length}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Daily Schedule */}
        <Card className="bg-white border-sage-200">
          <CardContent className="pt-6">
            <h4 className="text-sm font-semibold text-sage-700 mb-4">
              {format(selectedDate, 'MMMM d, yyyy')}
            </h4>

            {dayEvents.length === 0 ? (
              <div className="text-center py-8 text-sage-600">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No medications scheduled for this day</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(eventsByPet).map(([petId, events]) => {
                  const pet = pets.find((p) => p.id === petId);
                  if (!pet) return null;

                  return (
                    <div key={petId} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getPetColor(petId)}>{pet.name}</Badge>
                        <span className="text-xs text-sage-600">
                          {events.length} medication{events.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="space-y-2 pl-4">
                        {events
                          .sort((a, b) => a.time.getTime() - b.time.getTime())
                          .map((event, index) => (
                            <div
                              key={`${event.petId}-${event.medicationName}-${index}`}
                              className="flex items-center gap-3 p-3 bg-sage-50 rounded-lg"
                            >
                              <Checkbox
                                checked={event.completed}
                                className="border-sage-400"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-sm text-forest-800">
                                  {event.medicationName}
                                </div>
                                <div className="text-xs text-sage-600">
                                  {format(event.time, 'h:mm a')}
                                </div>
                              </div>
                              <Pill className="w-4 h-4 text-sage-400" />
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      <Card className="bg-sage-50 border-sage-200">
        <CardContent className="pt-6">
          <h4 className="text-sm font-semibold text-sage-700 mb-4">
            Medication Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-anton text-forest-800">
                {medications.length}
              </div>
              <div className="text-xs text-sage-600">Active Medications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-anton text-forest-800">
                {monthEvents.length}
              </div>
              <div className="text-xs text-sage-600">Events This Month</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-anton text-forest-800">
                {dayEvents.length}
              </div>
              <div className="text-xs text-sage-600">Today's Medications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-anton text-forest-800">
                {pets.length}
              </div>
              <div className="text-xs text-sage-600">Pets on Medication</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
