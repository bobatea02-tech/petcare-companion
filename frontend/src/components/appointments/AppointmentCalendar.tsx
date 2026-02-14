import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Phone, AlertCircle, Download } from 'lucide-react';
import { api } from '@/lib/api';
import type { Appointment } from '@/types/appointments';
import {
  appointmentToCalendarEvent,
  findConflictingAppointments,
  formatAppointmentDate,
  downloadICalendar,
  groupAppointmentsByDate,
} from '@/lib/calendarUtils';

interface AppointmentCalendarProps {
  petId?: string;
}

export function AppointmentCalendar({ petId }: AppointmentCalendarProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    loadAppointments();
  }, [petId]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      let response;
      if (petId) {
        response = await api.getPetAppointments(petId, {
          include_past: true,
          include_cancelled: false,
        });
      } else {
        response = await api.getUserUpcomingAppointments(30);
      }

      if (response.data) {
        const appointmentList = petId ? response.data.appointments : response.data;
        setAppointments(appointmentList || []);
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadICS = (appointment: Appointment) => {
    downloadICalendar(appointment);
  };

  const upcomingAppointments = appointments.filter((apt) => apt.is_upcoming);
  const pastAppointments = appointments.filter((apt) => apt.is_past);
  const groupedAppointments = groupAppointmentsByDate(upcomingAppointments);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Appointments
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-lg ${
              view === 'list'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`px-4 py-2 rounded-lg ${
              view === 'calendar'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Upcoming ({upcomingAppointments.length})
          </h3>
          {Object.entries(groupedAppointments).map(([date, dateAppointments]) => (
            <div key={date} className="space-y-2">
              <p className="text-sm font-medium text-gray-600">{date}</p>
              {dateAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  onDownload={handleDownloadICS}
                  conflicts={findConflictingAppointments(appointment, appointments)}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">
            Past ({pastAppointments.length})
          </h3>
          {pastAppointments.slice(0, 5).map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onDownload={handleDownloadICS}
              isPast
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {appointments.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No appointments scheduled</p>
        </div>
      )}
    </div>
  );
}

interface AppointmentCardProps {
  appointment: Appointment;
  onDownload: (appointment: Appointment) => void;
  conflicts?: Appointment[];
  isPast?: boolean;
}

function AppointmentCard({
  appointment,
  onDownload,
  conflicts = [],
  isPast = false,
}: AppointmentCardProps) {
  const hasConflicts = conflicts.length > 0;

  return (
    <div
      className={`p-4 rounded-lg border-2 ${
        hasConflicts
          ? 'border-red-300 bg-red-50'
          : isPast
          ? 'border-gray-200 bg-gray-50'
          : 'border-blue-200 bg-blue-50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          {/* Type and Status */}
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                appointment.appointment_type === 'emergency'
                  ? 'bg-red-100 text-red-700'
                  : appointment.appointment_type === 'checkup'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {appointment.appointment_type}
            </span>
            <span className="text-xs text-gray-500">{appointment.status}</span>
          </div>

          {/* Clinic Name */}
          <h4 className="font-semibold text-gray-900">{appointment.clinic_name}</h4>

          {/* Date and Time */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{formatAppointmentDate(appointment.appointment_date)}</span>
            {appointment.hours_until_appointment !== undefined &&
              appointment.hours_until_appointment > 0 && (
                <span className="text-xs text-gray-500">
                  (in {Math.round(appointment.hours_until_appointment)}h)
                </span>
              )}
          </div>

          {/* Location */}
          {appointment.clinic_address && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{appointment.clinic_address}</span>
            </div>
          )}

          {/* Phone */}
          {appointment.clinic_phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{appointment.clinic_phone}</span>
            </div>
          )}

          {/* Purpose */}
          <p className="text-sm text-gray-700">{appointment.purpose}</p>

          {/* Veterinarian */}
          {appointment.veterinarian && (
            <p className="text-sm text-gray-600">Dr. {appointment.veterinarian}</p>
          )}

          {/* Conflicts Warning */}
          {hasConflicts && (
            <div className="flex items-start gap-2 p-2 bg-red-100 rounded">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-medium">Scheduling Conflict</p>
                <p>
                  This appointment conflicts with {conflicts.length} other
                  appointment{conflicts.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <button
          onClick={() => onDownload(appointment)}
          className="p-2 hover:bg-white rounded-lg transition-colors"
          title="Download to calendar"
        >
          <Download className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}
