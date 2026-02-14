import { useState } from "react";
import { motion } from "framer-motion";
import { VetAppointment, Pet } from "@/lib/petData";
import { CalendarDays, Plus, MapPin, Clock, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MumbaiRealtimeBooking } from "@/components/appointments";

interface VetBookingProps {
  pet: Pet;
  onUpdate: (pet: Pet) => void;
}

export const VetBooking = ({ pet, onUpdate }: VetBookingProps) => {
  const [open, setOpen] = useState(false);
  const [newAppt, setNewAppt] = useState<Partial<VetAppointment & { location: string; visitType: string }>>({
    status: "scheduled",
    location: "",
    visitType: "",
  });

  const handleAdd = () => {
    if (!newAppt.date || !newAppt.time || !newAppt.reason || !newAppt.vetName) return;
    const appt: VetAppointment = {
      id: Date.now().toString(),
      date: newAppt.date,
      time: newAppt.time,
      reason: newAppt.reason,
      vetName: newAppt.vetName,
      status: "scheduled",
      notes: newAppt.notes,
    };
    onUpdate({ ...pet, vetAppointments: [...pet.vetAppointments, appt].sort((a, b) => a.date.localeCompare(b.date)) });
    setNewAppt({ status: "scheduled" });
    setOpen(false);
  };

  const updateStatus = (apptId: string, status: VetAppointment["status"]) => {
    const updated = pet.vetAppointments.map((a) =>
      a.id === apptId ? { ...a, status } : a
    );
    onUpdate({ ...pet, vetAppointments: updated });
  };

  const upcoming = (pet.vetAppointments || []).filter((a) => a.status === "scheduled");
  const past = (pet.vetAppointments || []).filter((a) => a.status !== "scheduled");

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
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

      {/* Tabs for Manual vs Mumbai Booking */}
      <Tabs defaultValue="mumbai" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mumbai" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Mumbai Real-Time Booking
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Manual Entry
          </TabsTrigger>
        </TabsList>

        {/* Mumbai Real-Time Booking Tab */}
        <TabsContent value="mumbai" className="mt-6">
          <div className="bg-gradient-to-r from-orange-50 to-green-50 rounded-card p-4 mb-4 border border-orange-200">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin className="w-4 h-4 text-orange-600" />
              <span className="font-medium">Book with real Mumbai veterinary clinics</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Real-time availability • 10+ verified clinics • Instant confirmation
            </p>
          </div>
          
          <MumbaiRealtimeBooking
            petId={pet.id}
            onSuccess={() => {
              // Refresh appointments or show success message
              window.location.reload();
            }}
          />
        </TabsContent>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-label text-muted-foreground">Manual Appointments</h3>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
              </DialogTrigger>
              <DialogContent className="rounded-card">
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl">Book Appointment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-label text-muted-foreground">Date</Label>
                      <Input type="date" value={newAppt.date || ""} onChange={(e) => setNewAppt({ ...newAppt, date: e.target.value })} className="rounded-pill mt-1" />
                    </div>
                    <div>
                      <Label className="text-label text-muted-foreground">Time</Label>
                      <Input type="time" value={newAppt.time || ""} onChange={(e) => setNewAppt({ ...newAppt, time: e.target.value })} className="rounded-pill mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-label text-muted-foreground">Visit Type</Label>
                    <Select value={newAppt.visitType || ""} onValueChange={(v) => setNewAppt({ ...newAppt, visitType: v, reason: v })}>
                      <SelectTrigger className="rounded-pill mt-1">
                        <SelectValue placeholder="Select visit type" />
                      </SelectTrigger>
                      <SelectContent className="rounded-card">
                        <SelectItem value="Annual Checkup">🩺 Annual Checkup</SelectItem>
                        <SelectItem value="Vaccination">💉 Vaccination</SelectItem>
                        <SelectItem value="Dental Cleaning">🦷 Dental Cleaning</SelectItem>
                        <SelectItem value="Illness/Injury">🤒 Illness / Injury</SelectItem>
                        <SelectItem value="Surgery">🏥 Surgery</SelectItem>
                        <SelectItem value="Grooming">✂️ Grooming</SelectItem>
                        <SelectItem value="Follow-up">📋 Follow-up Visit</SelectItem>
                        <SelectItem value="Other">📝 Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newAppt.visitType === "Other" && (
                    <Input placeholder="Describe the reason" value={newAppt.reason || ""} onChange={(e) => setNewAppt({ ...newAppt, reason: e.target.value })} className="rounded-pill" />
                  )}
                  <div>
                    <Label className="text-label text-muted-foreground">Vet / Clinic Name</Label>
                    <Input placeholder="e.g., Dr. Sarah Wilson" value={newAppt.vetName || ""} onChange={(e) => setNewAppt({ ...newAppt, vetName: e.target.value })} className="rounded-pill mt-1" />
                  </div>
                  <div>
                    <Label className="text-label text-muted-foreground">📍 Location / Area</Label>
                    <Input placeholder="e.g., Downtown, Brooklyn, Near Central Park" value={(newAppt as any).location || ""} onChange={(e) => setNewAppt({ ...newAppt, location: e.target.value })} className="rounded-pill mt-1" />
                  </div>
                  <div>
                    <Label className="text-label text-muted-foreground">Pet</Label>
                    <div className="flex items-center gap-2 mt-1 bg-secondary rounded-pill px-4 py-2.5">
                      <span className="text-lg">{pet.type === "dog" ? "🐕" : pet.type === "cat" ? "🐱" : "🐾"}</span>
                      <span className="font-body text-sm text-foreground">{pet.name} — {pet.breed}</span>
                    </div>
                  </div>
                  <Input placeholder="Notes (optional)" value={newAppt.notes || ""} onChange={(e) => setNewAppt({ ...newAppt, notes: e.target.value })} className="rounded-pill" />
                  <Button onClick={handleAdd} className="w-full rounded-pill font-body text-label">Book Appointment</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

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
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
