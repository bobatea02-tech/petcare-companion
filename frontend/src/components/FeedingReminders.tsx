import { useState } from "react";
import { motion } from "framer-motion";
import { FeedingSchedule, Pet } from "@/lib/petData";
import { UtensilsCrossed, Plus, Check, RotateCcw, Clock, Coffee, Sun, Moon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useVoiceControl } from "@/hooks/useVoiceControl";

interface FeedingRemindersProps {
  pet: Pet;
  onUpdate: (pet: Pet) => void;
}

const getTimeIcon = (time: string) => {
  const hour = parseInt(time.split(":")[0]);
  if (hour < 10) return Coffee;
  if (hour < 16) return Sun;
  return Moon;
};

const getTimePeriod = (time: string) => {
  const hour = parseInt(time.split(":")[0]);
  if (hour < 10) return "Morning";
  if (hour < 16) return "Afternoon";
  return "Evening";
};

export const FeedingReminders = ({ pet, onUpdate }: FeedingRemindersProps) => {
  const [open, setOpen] = useState(false);
  const [newFeeding, setNewFeeding] = useState<Partial<FeedingSchedule>>({});

  // Enable voice control for feeding reminders
  const { notifyManualAction } = useVoiceControl({
    componentId: 'feeding-reminders',
    petId: pet.id,
    onVoiceCommand: (intent, result) => {
      // Handle voice commands for feeding
      if (result.success && intent.action === 'log_data') {
        // Voice command added a feeding entry
        // UI will update automatically through onUpdate callback
      }
    },
  });

  const handleAdd = () => {
    if (!newFeeding.time || !newFeeding.food || !newFeeding.amount) return;
    const feeding: FeedingSchedule = {
      id: Date.now().toString(),
      time: newFeeding.time,
      food: newFeeding.food,
      amount: newFeeding.amount,
      completed: false,
    };
    onUpdate({ ...pet, feedingSchedule: [...pet.feedingSchedule, feeding].sort((a, b) => a.time.localeCompare(b.time)) });
    // Notify voice system of manual action
    notifyManualAction('add-feeding', { feeding });
    setNewFeeding({});
    setOpen(false);
  };

  const toggleCompleted = (feedingId: string) => {
    const updated = pet.feedingSchedule.map((f) =>
      f.id === feedingId ? { ...f, completed: !f.completed } : f
    );
    onUpdate({ ...pet, feedingSchedule: updated });
    // Notify voice system of manual action
    notifyManualAction('toggle-feeding', { feedingId });
  };

  const resetAll = () => {
    const updated = pet.feedingSchedule.map((f) => ({ ...f, completed: false }));
    onUpdate({ ...pet, feedingSchedule: updated });
    // Notify voice system of manual action
    notifyManualAction('reset-feedings', {});
  };

  const completedCount = (pet.feedingSchedule || []).filter((f) => f.completed).length;
  const totalCount = (pet.feedingSchedule || []).length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Summary with progress bar */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 400 }}
        className="bg-secondary rounded-card p-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-label text-secondary-foreground/60">Today's Feedings</span>
            <p className="font-display text-5xl text-secondary-foreground mt-2">{completedCount}/{totalCount}</p>
          </div>
          <UtensilsCrossed className="w-12 h-12 text-secondary-foreground/40" />
        </div>
        <div className="w-full bg-secondary-foreground/10 rounded-pill h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="h-full bg-primary rounded-pill"
          />
        </div>
      </motion.div>

      <div className="flex items-center justify-between">
        <h3 className="text-label text-muted-foreground">Feeding Schedule</h3>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.15, rotate: -180 }}
            whileTap={{ scale: 0.9 }}
            onClick={resetAll}
            className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center"
            title="Reset all"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
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
                <DialogTitle className="font-display text-2xl">Add Feeding</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input type="time" value={newFeeding.time || ""} onChange={(e) => setNewFeeding({ ...newFeeding, time: e.target.value })} />
                <Input placeholder="Food name" value={newFeeding.food || ""} onChange={(e) => setNewFeeding({ ...newFeeding, food: e.target.value })} />
                <Input placeholder="Amount (e.g., 2 cups)" value={newFeeding.amount || ""} onChange={(e) => setNewFeeding({ ...newFeeding, amount: e.target.value })} />
                <Button onClick={handleAdd} className="w-full rounded-pill font-body text-label">Add Feeding</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {totalCount === 0 && (
        <p className="text-sm text-muted-foreground font-body text-center py-8">No feeding schedule set 🍽️</p>
      )}

      {/* Timeline-style feeding cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(pet.feedingSchedule || []).map((feeding, index) => {
          const TimeIcon = getTimeIcon(feeding.time);
          const period = getTimePeriod(feeding.time);
          return (
            <motion.div
              key={feeding.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 1.03, y: -4 }}
              onClick={() => toggleCompleted(feeding.id)}
              className={`rounded-card p-6 shadow-forest cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                feeding.completed ? "bg-primary/10 border-2 border-primary/30" : "bg-card border-2 border-transparent hover:border-accent"
              }`}
            >
              {/* Period label */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{period}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  feeding.completed ? "bg-primary text-primary-foreground scale-110" : "bg-muted text-muted-foreground group-hover:bg-accent/30"
                }`}>
                  {feeding.completed ? <Check className="w-4 h-4" /> : <TimeIcon className="w-4 h-4" />}
                </div>
              </div>

              {/* Time */}
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-display text-2xl text-foreground">{feeding.time}</span>
              </div>

              {/* Food & Amount */}
              <p className={`text-sm font-body font-medium ${feeding.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {feeding.food}
              </p>
              <p className="text-xs text-muted-foreground font-body mt-1">{feeding.amount}</p>

              {/* Completed overlay */}
              {feeding.completed && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 text-lg"
                >
                  ✓
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
