import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, Bell, X } from "lucide-react";
import { api } from "@/lib/api";
import { format, differenceInHours, differenceInMinutes } from "date-fns";
import { toast } from "sonner";

interface Appointment {
  id: string;
  pet_id: string;
  appointment_date: string;
  appointment_type: string;
  purpose: string;
  clinic_name: string;
  clinic_address?: string;
  clinic_phone?: string;
  status: string;
}

export function UpcomingAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only load if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      loadUpcomingAppointments();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUpcomingAppointments = async () => {
    try {
      // Load from localStorage (mock database)
      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      
      // Filter upcoming appointments (not cancelled)
      const now = new Date();
      const upcoming = appointments
        .filter((apt: Appointment) => 
          new Date(apt.appointment_date) > now && 
          apt.status !== 'cancelled'
        )
        .sort((a: Appointment, b: Appointment) => 
          new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
        );
      
      setAppointments(upcoming.slice(0, 3)); // Show only next 3
    } catch (error) {
      console.error("Failed to load appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = (appointmentId: string) => {
    try {
      // Load appointments from localStorage
      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      
      // Update the appointment status to cancelled
      const updatedAppointments = appointments.map((apt: Appointment) => 
        apt.id === appointmentId 
          ? { ...apt, status: 'cancelled' }
          : apt
      );
      
      // Save back to localStorage
      localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
      
      // Reload appointments
      loadUpcomingAppointments();
      
      toast.success("Appointment cancelled successfully");
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
      toast.error("Failed to cancel appointment");
    }
  };

  const getTimeUntilAppointment = (appointmentDate: string) => {
    const now = new Date();
    const apptDate = new Date(appointmentDate);
    const hoursUntil = differenceInHours(apptDate, now);
    const minutesUntil = differenceInMinutes(apptDate, now);

    if (hoursUntil < 1) {
      return `in ${minutesUntil} minutes`;
    } else if (hoursUntil < 24) {
      return `in ${hoursUntil} hours`;
    } else {
      const days = Math.floor(hoursUntil / 24);
      return `in ${days} day${days > 1 ? 's' : ''}`;
    }
  };

  const shouldShowReminder = (appointmentDate: string) => {
    const now = new Date();
    const apptDate = new Date(appointmentDate);
    const hoursUntil = differenceInHours(apptDate, now);
    return hoursUntil <= 24 && hoursUntil >= 0;
  };

  if (loading) {
    return null;
  }

  if (appointments.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="mb-8"
    >
      <h2 className="text-label text-muted-foreground mb-4">Upcoming Appointments</h2>
      <div className="space-y-3">
        {appointments.map((appointment, index) => (
          <motion.div
            key={appointment.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-card rounded-card p-4 shadow-forest border-l-4 border-primary"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-display text-base text-foreground">
                    {format(new Date(appointment.appointment_date), "MMM dd, yyyy")}
                  </span>
                  <Clock className="w-4 h-4 text-muted-foreground ml-2" />
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(appointment.appointment_date), "h:mm a")}
                  </span>
                </div>

                <p className="text-sm font-medium text-foreground mb-1">
                  {appointment.purpose}
                </p>

                <div className="flex items-start gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">{appointment.clinic_name}</p>
                    {appointment.clinic_address && (
                      <p>{appointment.clinic_address}</p>
                    )}
                  </div>
                </div>

                {shouldShowReminder(appointment.appointment_date) && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-pill w-fit">
                    <Bell className="w-3 h-3" />
                    <span>Reminder: {getTimeUntilAppointment(appointment.appointment_date)}</span>
                  </div>
                )}
              </div>

              <div className="ml-4 flex flex-col items-end gap-2">
                <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-pill">
                  {appointment.appointment_type}
                </span>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCancelAppointment(appointment.id)}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-destructive/10 text-destructive rounded-pill hover:bg-destructive/20 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
