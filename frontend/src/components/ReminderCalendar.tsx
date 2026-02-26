import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pet } from "@/lib/petData";
import { Calendar, ChevronLeft, ChevronRight, Pill, Scissors, Stethoscope, Clock, AlertCircle, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, isPast, startOfDay } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface CalendarEvent {
  id: string;
  type: "grooming" | "medication" | "appointment" | "custom";
  title: string;
  date: Date;
  time?: string;
  petName: string;
  petId: string;
  description?: string;
  status: "upcoming" | "due" | "overdue";
  isCustom?: boolean;
}

interface CustomEvent {
  id: string;
  petId: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  type: "grooming" | "medication" | "appointment" | "custom";
}

interface ReminderCalendarProps {
  pets: Pet[];
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

export const ReminderCalendar = ({ pets, isOpen = false, onToggle }: ReminderCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);
  const [showCalendar, setShowCalendar] = useState(isOpen);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<CustomEvent>>({
    type: "custom",
  });

  useEffect(() => {
    setShowCalendar(isOpen);
  }, [isOpen]);

  useEffect(() => {
    loadAllEvents();
  }, [pets, currentMonth]);

  useEffect(() => {
    if (selectedDate) {
      const dayEvents = events.filter(event => isSameDay(event.date, selectedDate));
      setSelectedEvents(dayEvents);
    }
  }, [selectedDate, events]);

  const loadAllEvents = () => {
    const allEvents: CalendarEvent[] = [];
    const today = startOfDay(new Date());

    pets.forEach(pet => {
      // Load grooming tasks
      const groomingTasks = localStorage.getItem(`grooming_tasks_${pet.id}`);
      if (groomingTasks) {
        const tasks = JSON.parse(groomingTasks);
        tasks.forEach((task: any) => {
          if (!task.completed) {
            const taskDate = startOfDay(new Date(task.scheduledDate));
            const taskTypes: Record<string, string> = {
              bath: "🛁 Bath",
              brush: "🪮 Brushing",
              nails: "💅 Nail Trim",
              teeth: "🦷 Dental Care",
              ears: "👂 Ear Cleaning",
              haircut: "✂️ Haircut",
            };

            let status: "upcoming" | "due" | "overdue" = "upcoming";
            if (isPast(taskDate) && !isToday(taskDate)) {
              status = "overdue";
            } else if (isToday(taskDate)) {
              status = "due";
            }

            allEvents.push({
              id: `grooming-${task.id}`,
              type: "grooming",
              title: taskTypes[task.taskType] || task.taskType,
              date: taskDate,
              petName: pet.name,
              petId: pet.id,
              description: task.notes,
              status,
            });
          }
        });
      }

      // Load medications (show for current month)
      if (pet.medications && pet.medications.length > 0) {
        pet.medications.forEach(med => {
          const isActive = !med.endDate || new Date(med.endDate) >= today;
          if (isActive) {
            const monthStart = startOfMonth(currentMonth);
            const monthEnd = endOfMonth(currentMonth);
            const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

            daysInMonth.forEach(day => {
              if (day >= today) {
                allEvents.push({
                  id: `medication-${med.id}-${format(day, "yyyy-MM-dd")}`,
                  type: "medication",
                  title: med.name,
                  date: day,
                  petName: pet.name,
                  petId: pet.id,
                  description: `${med.dosage} - ${med.frequency}`,
                  status: isToday(day) ? "due" : "upcoming",
                });
              }
            });
          }
        });
      }

      // Load appointments
      const appointments = localStorage.getItem("vet_appointments");
      if (appointments) {
        const allAppointments = JSON.parse(appointments);
        allAppointments.forEach((apt: any) => {
          if (apt.petId === pet.id && apt.status !== "cancelled") {
            const aptDate = startOfDay(new Date(apt.date));
            
            let status: "upcoming" | "due" | "overdue" = "upcoming";
            if (isPast(aptDate) && !isToday(aptDate)) {
              status = "overdue";
            } else if (isToday(aptDate)) {
              status = "due";
            }

            allEvents.push({
              id: `appointment-${apt.id}`,
              type: "appointment",
              title: apt.clinicName,
              date: aptDate,
              time: apt.time,
              petName: pet.name,
              petId: pet.id,
              description: apt.reason,
              status,
            });
          }
        });
      }

      // Load custom events
      const customEvents = localStorage.getItem(`custom_events_${pet.id}`);
      if (customEvents) {
        const events: CustomEvent[] = JSON.parse(customEvents);
        events.forEach(event => {
          const eventDate = startOfDay(new Date(event.date));
          
          let status: "upcoming" | "due" | "overdue" = "upcoming";
          if (isPast(eventDate) && !isToday(eventDate)) {
            status = "overdue";
          } else if (isToday(eventDate)) {
            status = "due";
          }

          allEvents.push({
            id: `custom-${event.id}`,
            type: event.type as any,
            title: event.title,
            date: eventDate,
            time: event.time,
            petName: pet.name,
            petId: pet.id,
            description: event.description,
            status,
            isCustom: true,
          });
        });
      }
    });

    setEvents(allEvents);
  };

  const handleAddEvent = () => {
    if (!newEvent.petId || !newEvent.title || !newEvent.date) {
      toast.error("Please fill in all required fields");
      return;
    }

    const pet = pets.find(p => p.id === newEvent.petId);
    if (!pet) return;

    const customEvent: CustomEvent = {
      id: Date.now().toString(),
      petId: newEvent.petId,
      title: newEvent.title,
      description: newEvent.description || "",
      date: newEvent.date,
      time: newEvent.time,
      type: newEvent.type as any,
    };

    // Save to localStorage
    const existing = localStorage.getItem(`custom_events_${newEvent.petId}`);
    const events: CustomEvent[] = existing ? JSON.parse(existing) : [];
    events.push(customEvent);
    localStorage.setItem(`custom_events_${newEvent.petId}`, JSON.stringify(events));

    toast.success("Event added to calendar!");
    setShowAddDialog(false);
    setNewEvent({ type: "custom" });
    loadAllEvents();
  };

  const handleDeleteEvent = (event: CalendarEvent) => {
    if (!event.isCustom) {
      toast.error("Only custom events can be deleted from calendar");
      return;
    }

    const eventId = event.id.replace("custom-", "");
    const existing = localStorage.getItem(`custom_events_${event.petId}`);
    if (existing) {
      const events: CustomEvent[] = JSON.parse(existing);
      const filtered = events.filter(e => e.id !== eventId);
      localStorage.setItem(`custom_events_${event.petId}`, JSON.stringify(filtered));
      toast.success("Event deleted");
      loadAllEvents();
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.date, day));
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "grooming": return "bg-primary/20 text-primary";
      case "medication": return "bg-accent/20 text-accent";
      case "appointment": return "bg-sage/20 text-sage";
      case "custom": return "bg-secondary/20 text-secondary";
      default: return "bg-muted";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "overdue": return "border-destructive/50 bg-destructive/5";
      case "due": return "border-primary bg-primary/5";
      case "upcoming": return "border-border";
      default: return "border-border";
    }
  };

  const upcomingCount = events.filter(e => e.status === "upcoming").length;
  const dueCount = events.filter(e => e.status === "due").length;
  const overdueCount = events.filter(e => e.status === "overdue").length;

  const handleToggle = () => {
    const newState = !showCalendar;
    setShowCalendar(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-8"
    >
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-label text-foreground">Reminder Calendar</h2>
          {events.length > 0 && (
            <div className="flex items-center gap-2">
              {overdueCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-pill bg-destructive/20 text-destructive font-semibold">
                  {overdueCount} overdue
                </span>
              )}
              {dueCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-pill bg-primary/20 text-primary font-semibold">
                  {dueCount} due today
                </span>
              )}
              {upcomingCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-pill bg-accent/20 text-accent font-semibold">
                  {upcomingCount} upcoming
                </span>
              )}
            </div>
          )}
        </div>
        <motion.button
          onClick={handleToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-secondary/20 hover:bg-secondary/30 text-secondary-foreground text-sm font-semibold transition-colors"
        >
          {showCalendar ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide Calendar
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show Calendar
            </>
          )}
        </motion.button>
      </div>

      {/* Calendar Content */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar */}
              <div className="lg:col-span-2 bg-card rounded-card p-6 shadow-sm border-2 border-border">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </motion.button>
                  <h3 className="font-display text-xl text-foreground">
                    {format(currentMonth, "MMMM yyyy")}
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2">
                  {daysInMonth.map((day, index) => {
                    const dayEvents = getEventsForDay(day);
                    const hasOverdue = dayEvents.some(e => e.status === "overdue");
                    const hasDue = dayEvents.some(e => e.status === "due");
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    return (
                      <motion.button
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedDate(day)}
                        className={`
                          aspect-square p-2 rounded-card border-2 transition-all
                          ${!isSameMonth(day, currentMonth) ? "opacity-30" : ""}
                          ${isToday(day) ? "border-primary bg-primary/10" : "border-border"}
                          ${isSelected ? "ring-2 ring-primary" : ""}
                          ${hasOverdue ? "bg-destructive/5" : hasDue ? "bg-primary/5" : "bg-card"}
                          hover:border-primary/50
                        `}
                      >
                        <div className="text-sm font-semibold text-foreground mb-1">
                          {format(day, "d")}
                        </div>
                        {dayEvents.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 justify-center">
                            {dayEvents.slice(0, 3).map((event, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  event.type === "grooming" ? "bg-primary" :
                                  event.type === "medication" ? "bg-accent" :
                                  event.type === "appointment" ? "bg-sage" :
                                  "bg-secondary"
                                }`}
                              />
                            ))}
                            {dayEvents.length > 3 && (
                              <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 3}</span>
                            )}
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-border flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-xs text-muted-foreground">Grooming</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-accent" />
                    <span className="text-xs text-muted-foreground">Medication</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-sage" />
                    <span className="text-xs text-muted-foreground">Appointment</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-secondary" />
                    <span className="text-xs text-muted-foreground">Custom</span>
                  </div>
                </div>
              </div>

              {/* Selected Day Events */}
              <div className="bg-card rounded-card p-6 shadow-sm border-2 border-border max-h-[600px] overflow-y-auto thin-scrollbar">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg text-foreground">
                    {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Select a date"}
                  </h3>
                  {selectedDate && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setNewEvent({ ...newEvent, date: format(selectedDate, "yyyy-MM-dd") });
                        setShowAddDialog(true);
                      }}
                      className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                      title="Add custom event"
                    >
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>

                {selectedDate && selectedEvents.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No reminders for this day
                  </p>
                )}

                <AnimatePresence mode="popLayout">
                  {selectedEvents.map((event, index) => {
                    const Icon = event.type === "grooming" ? Scissors : event.type === "medication" ? Pill : Stethoscope;
                    
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className={`mb-3 p-4 rounded-card border-2 ${getStatusColor(event.status)}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getEventTypeColor(event.type)}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-display text-sm text-foreground mb-1">
                                {event.title}
                              </h4>
                              {event.isCustom && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleDeleteEvent(event)}
                                  className="w-5 h-5 rounded-full bg-destructive/10 text-destructive flex items-center justify-center"
                                  title="Delete custom event"
                                >
                                  <X className="w-3 h-3" />
                                </motion.button>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-xs text-muted-foreground mb-1">
                                {event.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-primary">{event.petName}</span>
                              {event.time && (
                                <>
                                  <span className="text-muted-foreground">•</span>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    {event.time}
                                  </div>
                                </>
                              )}
                            </div>
                            {event.status === "overdue" && (
                              <div className="flex items-center gap-1 text-xs text-destructive mt-2">
                                <AlertCircle className="w-3 h-3" />
                                <span>Overdue</span>
                              </div>
                            )}
                            {event.status === "due" && (
                              <div className="flex items-center gap-1 text-xs text-primary mt-2">
                                <AlertCircle className="w-3 h-3" />
                                <span>Due Today</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Event Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="rounded-card">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Add Calendar Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Pet</label>
              <Select value={newEvent.petId} onValueChange={(v) => setNewEvent({ ...newEvent, petId: v })}>
                <SelectTrigger className="rounded-pill">
                  <SelectValue placeholder="Select pet" />
                </SelectTrigger>
                <SelectContent className="rounded-card">
                  {pets.map(pet => (
                    <SelectItem key={pet.id} value={pet.id}>
                      {pet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Event Type</label>
              <Select value={newEvent.type} onValueChange={(v) => setNewEvent({ ...newEvent, type: v as any })}>
                <SelectTrigger className="rounded-pill">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-card">
                  <SelectItem value="grooming">Grooming</SelectItem>
                  <SelectItem value="medication">Medication</SelectItem>
                  <SelectItem value="appointment">Appointment</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Title</label>
              <Input
                placeholder="Event title"
                value={newEvent.title || ""}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="rounded-pill"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Date</label>
              <Input
                type="date"
                value={newEvent.date || ""}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                className="rounded-pill"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Time (optional)</label>
              <Input
                type="time"
                value={newEvent.time || ""}
                onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                className="rounded-pill"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Description (optional)</label>
              <Input
                placeholder="Add notes..."
                value={newEvent.description || ""}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="rounded-pill"
              />
            </div>

            <Button onClick={handleAddEvent} className="w-full rounded-pill">
              Add Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
