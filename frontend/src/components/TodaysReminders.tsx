import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Pet } from "@/lib/petData";
import { Bell, Calendar, Pill, Scissors, AlertCircle, Check } from "lucide-react";
import { format, isToday, isPast } from "date-fns";
import { toast } from "sonner";

interface Reminder {
  id: string;
  type: "grooming" | "medication" | "appointment";
  title: string;
  description: string;
  time?: string;
  icon: any;
  color: string;
  petName: string;
  petId: string;
}

interface CompletedReminder {
  id: string;
  type: string;
  completedAt: string;
  date: string;
}

interface TodaysRemindersProps {
  pets: Pet[];
  onViewCalendar?: () => void;
}

export const TodaysReminders = ({ pets, onViewCalendar }: TodaysRemindersProps) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTodaysReminders();
    loadCompletedReminders();
  }, [pets]);

  const loadCompletedReminders = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const completed = localStorage.getItem("completed_reminders");
    if (completed) {
      const allCompleted: CompletedReminder[] = JSON.parse(completed);
      const todayCompleted = allCompleted
        .filter(c => c.date === today)
        .map(c => c.id);
      setCompletedToday(new Set(todayCompleted));
    }
  };

  const loadTodaysReminders = () => {
    const allReminders: Reminder[] = [];

    pets.forEach(pet => {
      // Load grooming tasks
      const groomingTasks = localStorage.getItem(`grooming_tasks_${pet.id}`);
      if (groomingTasks) {
        const tasks = JSON.parse(groomingTasks);
        tasks.forEach((task: any) => {
          if (!task.completed && (isToday(new Date(task.scheduledDate)) || isPast(new Date(task.scheduledDate)))) {
            const taskTypes: Record<string, string> = {
              bath: "🛁 Bath",
              brush: "🪮 Brushing",
              nails: "💅 Nail Trim",
              teeth: "🦷 Dental Care",
              ears: "👂 Ear Cleaning",
              haircut: "✂️ Haircut",
            };
            
            allReminders.push({
              id: `grooming-${task.id}`,
              type: "grooming",
              title: taskTypes[task.taskType] || task.taskType,
              description: task.notes || "Scheduled grooming task",
              time: format(new Date(task.scheduledDate), "MMM dd"),
              icon: Scissors,
              color: "text-primary",
              petName: pet.name,
              petId: pet.id,
            });
          }
        });
      }

      // Load medication reminders (active medications)
      if (pet.medications && pet.medications.length > 0) {
        pet.medications.forEach(med => {
          // Check if medication is active (no end date or end date is in future)
          const isActive = !med.endDate || new Date(med.endDate) >= new Date();
          if (isActive) {
            allReminders.push({
              id: `medication-${med.id}`,
              type: "medication",
              title: med.name,
              description: `${med.dosage} - ${med.frequency}`,
              icon: Pill,
              color: "text-accent",
              petName: pet.name,
              petId: pet.id,
            });
          }
        });
      }

      // Load appointments for today
      const appointments = localStorage.getItem("vet_appointments");
      if (appointments) {
        const allAppointments = JSON.parse(appointments);
        allAppointments.forEach((apt: any) => {
          if (apt.petId === pet.id && isToday(new Date(apt.date))) {
            allReminders.push({
              id: `appointment-${apt.id}`,
              type: "appointment",
              title: `Vet Appointment - ${apt.clinicName}`,
              description: apt.reason || "Checkup",
              time: apt.time,
              icon: Calendar,
              color: "text-sage",
              petName: pet.name,
              petId: pet.id,
            });
          }
        });
      }
    });

    setReminders(allReminders);
  };

  const handleMarkAsDone = (reminder: Reminder) => {
    const today = format(new Date(), "yyyy-MM-dd");
    
    // Save to completed reminders
    const completed = localStorage.getItem("completed_reminders");
    const allCompleted: CompletedReminder[] = completed ? JSON.parse(completed) : [];
    
    const newCompleted: CompletedReminder = {
      id: reminder.id,
      type: reminder.type,
      completedAt: new Date().toISOString(),
      date: today,
    };
    
    allCompleted.push(newCompleted);
    localStorage.setItem("completed_reminders", JSON.stringify(allCompleted));
    
    // Update completed today set
    setCompletedToday(prev => new Set([...prev, reminder.id]));
    
    // If it's a grooming task, mark it as complete in the grooming tasks
    if (reminder.type === "grooming") {
      const taskId = reminder.id.replace("grooming-", "");
      const groomingTasks = localStorage.getItem(`grooming_tasks_${reminder.petId}`);
      if (groomingTasks) {
        const tasks = JSON.parse(groomingTasks);
        const updatedTasks = tasks.map((task: any) => {
          if (task.id === taskId) {
            const completedTask = {
              ...task,
              completed: true,
              completedDate: new Date().toISOString(),
            };

            // If recurring, create next task
            if (task.recurring && task.recurringInterval) {
              const nextDate = new Date(task.scheduledDate);
              nextDate.setDate(nextDate.getDate() + task.recurringInterval);
              
              const nextTask = {
                id: Date.now().toString(),
                petId: reminder.petId,
                taskType: task.taskType,
                scheduledDate: nextDate.toISOString(),
                recurring: true,
                recurringInterval: task.recurringInterval,
                completed: false,
                notes: task.notes,
              };
              
              setTimeout(() => {
                const currentTasks = JSON.parse(localStorage.getItem(`grooming_tasks_${reminder.petId}`) || "[]");
                const newTasks = [...currentTasks.filter((t: any) => t.id !== taskId), completedTask, nextTask];
                localStorage.setItem(`grooming_tasks_${reminder.petId}`, JSON.stringify(newTasks));
              }, 100);
            }

            return completedTask;
          }
          return task;
        });
        
        localStorage.setItem(`grooming_tasks_${reminder.petId}`, JSON.stringify(updatedTasks));
      }
    }
    
    toast.success(`✓ ${reminder.title} marked as done!`, {
      description: `Completed for ${reminder.petName}`,
    });
    
    // Reload reminders
    setTimeout(() => {
      loadTodaysReminders();
    }, 200);
  };

  const activeReminders = reminders.filter(r => !completedToday.has(r.id));

  if (activeReminders.length === 0 && completedToday.size === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-8"
    >
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-label text-foreground">Today's Reminders</h2>
          {activeReminders.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-pill bg-primary/20 text-primary font-semibold">
              {activeReminders.length}
            </span>
          )}
          {completedToday.size > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-pill bg-accent/20 text-accent font-semibold">
              {completedToday.size} done
            </span>
          )}
        </div>
        {onViewCalendar && (
          <motion.button
            onClick={onViewCalendar}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-secondary/20 hover:bg-secondary/30 text-secondary-foreground text-sm font-semibold transition-colors"
          >
            <Calendar className="w-4 h-4" />
            View in Calendar
          </motion.button>
        )}
      </div>

      {activeReminders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card rounded-card p-6 text-center border-2 border-accent/20"
        >
          <Check className="w-12 h-12 text-accent mx-auto mb-2" />
          <p className="text-lg font-display text-foreground">All reminders completed! 🎉</p>
          <p className="text-sm text-muted-foreground mt-1">Great job taking care of your pets today!</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeReminders.map((reminder, index) => {
            const Icon = reminder.icon;
            return (
              <motion.div
                key={reminder.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-card p-4 shadow-sm border-2 border-primary/20 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ${reminder.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-display text-base text-foreground truncate">
                        {reminder.title}
                      </h3>
                      {reminder.time && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {reminder.time}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {reminder.description}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-3">
                      <div className="flex items-center gap-1 text-xs text-primary">
                        <AlertCircle className="w-3 h-3" />
                        <span>For {reminder.petName}</span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleMarkAsDone(reminder)}
                        className="px-3 py-1.5 rounded-pill bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 hover:bg-primary/90 transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        Mark Done
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.section>
  );
};
