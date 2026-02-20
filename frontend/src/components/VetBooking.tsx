import { motion } from "framer-motion";
import { VetAppointment, Pet } from "@/lib/petData";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import { UpcomingAppointments } from "@/components/UpcomingAppointments";
import { AppointmentHistory } from "@/components/AppointmentHistory";
import { useVoiceControl } from "@/hooks/useVoiceControl";

interface VetBookingProps {
  pet: Pet;
  onUpdate: (pet: Pet) => void;
}

export const VetBooking = ({ pet, onUpdate }: VetBookingProps) => {
  // Enable voice control for vet booking
  const { notifyManualAction } = useVoiceControl({
    componentId: 'vet-booking',
    petId: pet.id,
    onVoiceCommand: (intent, result) => {
      // Handle voice commands for vet appointments
      if (result.success && intent.action === 'schedule') {
        // Voice command scheduled an appointment
        // UI will update automatically through onUpdate callback
      }
    },
  });

  const updateStatus = (apptId: string, status: VetAppointment["status"]) => {
    const updated = pet.vetAppointments.map((a) =>
      a.id === apptId ? { ...a, status } : a
    );
    onUpdate({ ...pet, vetAppointments: updated });
    // Notify voice system of manual action
    notifyManualAction('update-appointment-status', { appointmentId: apptId, status });
  };

  const upcoming = (pet.vetAppointments || []).filter((a) => a.status === "scheduled");
  const past = (pet.vetAppointments || []).filter((a) => a.status !== "scheduled");

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
      data-tour="vet-booking"
    >
      {/* Upcoming Appointments from Vet Search */}
      <UpcomingAppointments />

      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ type: "spring", stiffness: 400 }}
        className="bg-primary rounded-card p-8 text-primary-foreground flex items-center justify-between cursor-default"
      >
        <div>
          <span className="text-label opacity-60">Upcoming Appointments</span>
          <p className="font-display text-5xl mt-2">{upcoming.length}</p>
        </div>
        <CalendarDays className="w-12 h-12 opacity-40" />
      </motion.div>

      {/* Find Vets Button */}
      <motion.button
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => window.location.href = '/vet-search'}
        className="w-full bg-gradient-to-br from-primary/40 to-primary/30 text-foreground rounded-card p-6 text-left shadow-sm border border-primary/20"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg">Find Vets</h3>
            <p className="text-xs opacity-70">Search nearby clinics</p>
          </div>
        </div>
      </motion.button>

      {/* Appointment List */}
      {upcoming.length === 0 && past.length === 0 && (
        <p className="text-sm text-muted-foreground font-body text-center py-8">No appointments booked 🏥</p>
      )}

      {upcoming.map((appt) => (
            <motion.div
              key={appt.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.02, x: 4 }}
              className="bg-card rounded-card p-6 shadow-forest cursor-default"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-display text-2xl text-foreground">{appt.reason}</span>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground font-body">
                    <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {new Date(appt.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {appt.time}</span>
                  </div>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground font-body mt-1">
                    <MapPin className="w-3.5 h-3.5" /> {appt.vetName}
                  </p>
                  {appt.notes && <p className="text-xs text-muted-foreground/60 font-body mt-2">{appt.notes}</p>}
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => updateStatus(appt.id, "completed")}
                    className="text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-pill bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    Done
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => updateStatus(appt.id, "cancelled")}
                    className="text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-pill bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}

          {past.length > 0 && (
            <>
              <h4 className="text-label text-muted-foreground/50 mt-6">Past Appointments</h4>
              {past.map((appt) => (
                <motion.div
                  key={appt.id}
                  whileHover={{ scale: 1.02, x: 4 }}
                  className="bg-muted rounded-card p-5 opacity-60 cursor-default"
                >
                  <span className="font-body font-semibold text-foreground">{appt.reason}</span>
                  <p className="text-sm text-muted-foreground font-body">
                    {new Date(appt.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {appt.vetName} · <span className={appt.status === "completed" ? "text-primary" : "text-destructive"}>{appt.status}</span>
                  </p>
                </motion.div>
              ))}
            </>
          )}

      {/* Appointment History Section */}
      <div className="mt-8 pt-8 border-t border-border">
        <h3 className="text-label text-muted-foreground mb-4">Appointment History</h3>
        <AppointmentHistory petId={parseInt(pet.id)} petName={pet.name} />
      </div>
    </motion.div>
  );
};
