import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pet } from "@/lib/petData";
import { Calendar, Plus, Check, X, Bell, Scissors, Droplets, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format, differenceInDays, isPast, isToday } from "date-fns";

interface GroomingTask {
  id: string;
  petId: string;
  taskType: string;
  scheduledDate: string;
  recurring: boolean;
  recurringInterval?: number; // days
  completed: boolean;
  completedDate?: string;
  notes?: string;
}

interface GroomingSchedulerProps {
  pet: Pet;
}

const taskTypes = [
  { value: "bath", label: "🛁 Bath", icon: Droplets },
  { value: "brush", label: "🪮 Brushing", icon: Sparkles },
  { value: "nails", label: "💅 Nail Trim", icon: Scissors },
  { value: "teeth", label: "🦷 Dental Care", icon: Sparkles },
  { value: "ears", label: "👂 Ear Cleaning", icon: Sparkles },
  { value: "haircut", label: "✂️ Haircut", icon: Scissors },
];

export const GroomingScheduler = ({ pet }: GroomingSchedulerProps) => {
  const [tasks, setTasks] = useState<GroomingTask[]>([]);
  const [open, setOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<GroomingTask>>({
    taskType: "bath",
    recurring: false,
    recurringInterval: 7,
  });

  useEffect(() => {
    loadTasks();
    checkReminders();
  }, [pet.id]);

  const loadTasks = () => {
    const saved = localStorage.getItem(`grooming_tasks_${pet.id}`);
    if (saved) {
      setTasks(JSON.parse(saved));
    }
  };

  const saveTasks = (updatedTasks: GroomingTask[]) => {
    localStorage.setItem(`grooming_tasks_${pet.id}`, JSON.stringify(updatedTasks));
    setTasks(updatedTasks);
  };

  const checkReminders = () => {
    const saved = localStorage.getItem(`grooming_tasks_${pet.id}`);
    if (!saved) return;

    const tasks: GroomingTask[] = JSON.parse(saved);
    tasks.forEach(task => {
      if (!task.completed && (isToday(new Date(task.scheduledDate)) || isPast(new Date(task.scheduledDate)))) {
        const taskLabel = taskTypes.find(t => t.value === task.taskType)?.label || task.taskType;
        toast.info(`Grooming Reminder: ${taskLabel} for ${pet.name}`, {
          description: `Scheduled for ${format(new Date(task.scheduledDate), "MMM dd, yyyy")}`,
          duration: 5000,
        });
      }
    });
  };

  const handleAddTask = () => {
    if (!newTask.taskType || !newTask.scheduledDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const task: GroomingTask = {
      id: Date.now().toString(),
      petId: pet.id,
      taskType: newTask.taskType,
      scheduledDate: newTask.scheduledDate,
      recurring: newTask.recurring || false,
      recurringInterval: newTask.recurringInterval,
      completed: false,
      notes: newTask.notes,
    };

    const updatedTasks = [...tasks, task].sort((a, b) => 
      new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
    );
    saveTasks(updatedTasks);
    setNewTask({ taskType: "bath", recurring: false, recurringInterval: 7 });
    setOpen(false);
    toast.success("Grooming task scheduled!");
  };

  const handleMarkComplete = (taskId: string) => {
    const updatedTasks = tasks.map(task => {
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
          
          const nextTask: GroomingTask = {
            id: Date.now().toString(),
            petId: pet.id,
            taskType: task.taskType,
            scheduledDate: nextDate.toISOString(),
            recurring: true,
            recurringInterval: task.recurringInterval,
            completed: false,
            notes: task.notes,
          };
          
          setTimeout(() => {
            saveTasks([...tasks.filter(t => t.id !== taskId), completedTask, nextTask]);
            toast.success("Task completed! Next task scheduled.");
          }, 100);
          
          return completedTask;
        }

        return completedTask;
      }
      return task;
    });

    if (!tasks.find(t => t.id === taskId)?.recurring) {
      saveTasks(updatedTasks);
      toast.success("Task marked as complete!");
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    saveTasks(updatedTasks);
    toast.success("Task deleted");
  };

  const getDaysUntil = (date: string) => {
    const days = differenceInDays(new Date(date), new Date());
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `In ${days} days`;
  };

  const upcomingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-label text-muted-foreground">Grooming Schedule</h3>
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
              <DialogTitle className="font-display text-2xl">Schedule Grooming Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Task Type</label>
                <Select value={newTask.taskType} onValueChange={(v) => setNewTask({ ...newTask, taskType: v })}>
                  <SelectTrigger className="rounded-pill">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-card">
                    {taskTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Scheduled Date</label>
                <Input
                  type="date"
                  value={newTask.scheduledDate || ""}
                  onChange={(e) => setNewTask({ ...newTask, scheduledDate: e.target.value })}
                  className="rounded-pill"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={newTask.recurring}
                  onChange={(e) => setNewTask({ ...newTask, recurring: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="recurring" className="text-sm text-foreground">
                  Recurring task
                </label>
              </div>

              {newTask.recurring && (
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Repeat every (days)</label>
                  <Input
                    type="number"
                    value={newTask.recurringInterval || 7}
                    onChange={(e) => setNewTask({ ...newTask, recurringInterval: parseInt(e.target.value) })}
                    className="rounded-pill"
                    min="1"
                  />
                </div>
              )}

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Notes (optional)</label>
                <Input
                  placeholder="Add any notes..."
                  value={newTask.notes || ""}
                  onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  className="rounded-pill"
                />
              </div>

              <Button onClick={handleAddTask} className="w-full rounded-pill">
                Schedule Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upcoming Tasks */}
      {upcomingTasks.length === 0 && completedTasks.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No grooming tasks scheduled ✂️
        </p>
      )}

      <AnimatePresence>
        {upcomingTasks.map((task, index) => {
          const taskType = taskTypes.find(t => t.value === task.taskType);
          const Icon = taskType?.icon || Scissors;
          const isOverdue = isPast(new Date(task.scheduledDate)) && !isToday(new Date(task.scheduledDate));
          const isDueToday = isToday(new Date(task.scheduledDate));

          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-card rounded-card p-5 shadow-sm border-2 ${
                isOverdue ? "border-destructive/50" : isDueToday ? "border-primary" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isOverdue ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-display text-lg text-foreground">
                        {taskType?.label || task.taskType}
                      </h4>
                      {task.recurring && (
                        <span className="text-xs px-2 py-0.5 rounded-pill bg-accent/20 text-accent-foreground">
                          Recurring
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{format(new Date(task.scheduledDate), "MMM dd, yyyy")}</span>
                      <span className={`font-semibold ${
                        isOverdue ? "text-destructive" : isDueToday ? "text-primary" : ""
                      }`}>
                        • {getDaysUntil(task.scheduledDate)}
                      </span>
                    </div>
                    {task.notes && (
                      <p className="text-xs text-muted-foreground/60 mt-1">{task.notes}</p>
                    )}
                    {isDueToday && (
                      <div className="flex items-center gap-1 text-xs text-primary mt-2">
                        <Bell className="w-3 h-3" />
                        <span>Reminder: Due today!</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleMarkComplete(task.id)}
                    className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20"
                  >
                    <Check className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDeleteTask(task.id)}
                    className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="mt-6">
          <h4 className="text-label text-muted-foreground/50 mb-3">Completed Tasks</h4>
          <div className="space-y-2">
            {completedTasks.slice(0, 5).map((task) => {
              const taskType = taskTypes.find(t => t.value === task.taskType);
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-muted/50 rounded-card p-4 opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-sm text-foreground font-medium">
                        {taskType?.label || task.taskType}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {task.completedDate && format(new Date(task.completedDate), "MMM dd")}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};
