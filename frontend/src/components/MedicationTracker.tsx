import { useState } from "react";
import { motion } from "framer-motion";
import { Medication, Pet } from "@/lib/petData";
import { Pill, Plus, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface MedicationTrackerProps {
  pet: Pet;
  onUpdate: (pet: Pet) => void;
}

export const MedicationTracker = ({ pet, onUpdate }: MedicationTrackerProps) => {
  const [open, setOpen] = useState(false);
  const [newMed, setNewMed] = useState<Partial<Medication>>({
    active: true,
    startDate: new Date().toISOString().split("T")[0],
  });

  const handleAdd = () => {
    if (!newMed.name || !newMed.dosage || !newMed.frequency) return;
    const med: Medication = {
      id: Date.now().toString(),
      name: newMed.name,
      dosage: newMed.dosage,
      frequency: newMed.frequency,
      startDate: newMed.startDate || new Date().toISOString().split("T")[0],
      endDate: newMed.endDate,
      notes: newMed.notes,
      active: true,
    };
    onUpdate({ ...pet, medications: [...pet.medications, med] });
    setNewMed({ active: true, startDate: new Date().toISOString().split("T")[0] });
    setOpen(false);
  };

  const toggleActive = (medId: string) => {
    const updated = pet.medications.map((m) =>
      m.id === medId ? { ...m, active: !m.active } : m
    );
    onUpdate({ ...pet, medications: updated });
  };

  const activeMeds = (pet.medications || []).filter((m) => m.active);
  const inactiveMeds = (pet.medications || []).filter((m) => !m.active);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      {/* Summary */}
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ type: "spring", stiffness: 400 }}
        className="bg-secondary rounded-card p-8 flex items-center justify-between cursor-default"
      >
        <div>
          <span className="text-label text-secondary-foreground/60">Active Medications</span>
          <p className="font-display text-5xl text-secondary-foreground mt-2">{activeMeds.length}</p>
        </div>
        <Pill className="w-12 h-12 text-secondary-foreground/40" />
      </motion.div>

      <div className="flex items-center justify-between">
        <h3 className="text-label text-muted-foreground">Medications</h3>
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
              <DialogTitle className="font-display text-2xl">Add Medication</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input placeholder="Medication name" value={newMed.name || ""} onChange={(e) => setNewMed({ ...newMed, name: e.target.value })} />
              <Input placeholder="Dosage (e.g., 1 tablet)" value={newMed.dosage || ""} onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })} />
              <Input placeholder="Frequency (e.g., Twice daily)" value={newMed.frequency || ""} onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })} />
              <Input type="date" value={newMed.startDate} onChange={(e) => setNewMed({ ...newMed, startDate: e.target.value })} />
              <Input placeholder="Notes (optional)" value={newMed.notes || ""} onChange={(e) => setNewMed({ ...newMed, notes: e.target.value })} />
              <Button onClick={handleAdd} className="w-full rounded-pill font-body text-label">Add Medication</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {activeMeds.length === 0 && inactiveMeds.length === 0 && (
        <p className="text-sm text-muted-foreground font-body text-center py-8">No medications tracked yet 💊</p>
      )}

      {activeMeds.map((med) => (
        <motion.div
          key={med.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.02, x: 4 }}
          className="bg-card rounded-card p-5 shadow-forest cursor-default"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-body font-semibold text-foreground">{med.name}</span>
                <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-pill bg-primary/10 text-primary">Active</span>
              </div>
              <p className="text-sm text-muted-foreground font-body mt-1">{med.dosage} · {med.frequency}</p>
              {med.notes && <p className="text-xs text-muted-foreground/60 font-body mt-1">{med.notes}</p>}
              <p className="text-[11px] text-muted-foreground/60 font-body mt-2">Since {new Date(med.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.2, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => toggleActive(med.id)}
              className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      ))}

      {inactiveMeds.length > 0 && (
        <>
          <h4 className="text-label text-muted-foreground/50 mt-6">Past Medications</h4>
          {inactiveMeds.map((med) => (
            <motion.div
              key={med.id}
              whileHover={{ scale: 1.02, x: 4 }}
              className="bg-muted rounded-card p-5 opacity-60 cursor-default"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-body font-semibold text-foreground">{med.name}</span>
                  <p className="text-sm text-muted-foreground font-body mt-1">{med.dosage} · {med.frequency}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleActive(med.id)}
                  className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center"
                >
                  <Check className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </>
      )}
    </motion.div>
  );
};
