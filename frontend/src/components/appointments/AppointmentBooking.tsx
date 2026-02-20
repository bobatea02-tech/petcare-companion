import { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import type { Appointment } from '@/types/appointments';
import {
  findConflictingAppointments,
  getAvailableTimeSlots,
} from '@/lib/calendarUtils';

interface AppointmentBookingProps {
  petId: string;
  clinicInfo?: {
    placeId?: string;
    name?: string;
    address?: string;
    phone?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AppointmentBooking({
  petId,
  clinicInfo,
  onSuccess,
  onCancel,
}: AppointmentBookingProps) {
  const [formData, setFormData] = useState({
    appointment_date: '',
    appointment_time: '',
    appointment_type: 'checkup',
    purpose: '',
    clinic_name: clinicInfo?.name || '',
    clinic_address: clinicInfo?.address || '',
    clinic_phone: clinicInfo?.phone || '',
    veterinarian: '',
    notes: '',
  });

  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
  const [conflicts, setConflicts] = useState<Appointment[]>([]);
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadExistingAppointments();
  }, [petId]);

  useEffect(() => {
    if (formData.appointment_date) {
      checkConflicts();
      updateAvailableSlots();
    }
  }, [formData.appointment_date, formData.appointment_time]);

  const loadExistingAppointments = async () => {
    try {
      const response = await api.getPetAppointments(petId, {
        include_past: false,
        include_cancelled: false,
      });
      if (response.data) {
        setExistingAppointments(response.data.appointments || []);
      }
    } catch (error) {
      console.error('Failed to load appointments:', error);
    }
  };

  const updateAvailableSlots = () => {
    if (!formData.appointment_date) return;

    const selectedDate = new Date(formData.appointment_date);
    const slots = getAvailableTimeSlots(selectedDate, existingAppointments);
    setAvailableSlots(slots);
  };

  const checkConflicts = () => {
    if (!formData.appointment_date || !formData.appointment_time) {
      setConflicts([]);
      return;
    }

    const dateTime = `${formData.appointment_date}T${formData.appointment_time}:00`;
    const mockAppointment: Appointment = {
      id: 'temp',
      pet_id: petId,
      appointment_date: new Date(dateTime).toISOString(),
      appointment_type: formData.appointment_type,
      purpose: formData.purpose,
      clinic_name: formData.clinic_name,
      status: 'scheduled',
      is_upcoming: true,
      is_past: false,
    };

    const foundConflicts = findConflictingAppointments(
      mockAppointment,
      existingAppointments
    );
    setConflicts(foundConflicts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const dateTime = `${formData.appointment_date}T${formData.appointment_time}:00`;
      const appointmentData = {
        appointment_date: new Date(dateTime).toISOString(),
        appointment_type: formData.appointment_type,
        purpose: formData.purpose,
        clinic_name: formData.clinic_name,
        clinic_address: formData.clinic_address || undefined,
        clinic_phone: formData.clinic_phone || undefined,
        veterinarian: formData.veterinarian || undefined,
        notes: formData.notes || undefined,
      };

      const response = await api.createAppointment(petId, appointmentData);

      if (response.error) {
        setError(response.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
        }, 1500);
      }
    } catch (error) {
      setError('Failed to create appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Appointment Booked!
        </h3>
        <p className="text-gray-600">
          Your appointment has been scheduled successfully.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-semibold flex items-center gap-2">
        <Calendar className="w-6 h-6" />
        Book Appointment
      </h2>

      {/* Appointment Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Appointment Type
        </label>
        <select
          name="appointment_type"
          value={formData.appointment_type}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="checkup">Regular Checkup</option>
          <option value="vaccination">Vaccination</option>
          <option value="surgery">Surgery</option>
          <option value="dental">Dental</option>
          <option value="grooming">Grooming</option>
          <option value="emergency">Emergency</option>
          <option value="follow-up">Follow-up</option>
          <option value="consultation">Consultation</option>
        </select>
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            name="appointment_date"
            value={formData.appointment_date}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time
          </label>
          <input
            type="time"
            name="appointment_time"
            value={formData.appointment_time}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Conflict Warning */}
      {conflicts.length > 0 && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="text-sm text-red-700">
            <p className="font-medium">Scheduling Conflict Detected</p>
            <p>
              This time conflicts with {conflicts.length} existing appointment
              {conflicts.length > 1 ? 's' : ''}. Consider choosing a different
              time.
            </p>
          </div>
        </div>
      )}

      {/* Purpose */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Purpose
        </label>
        <input
          type="text"
          name="purpose"
          value={formData.purpose}
          onChange={handleChange}
          placeholder="e.g., Annual checkup, vaccination"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Any special instructions or notes"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading || conflicts.length > 0}
          className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Booking...' : 'Book Appointment'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
