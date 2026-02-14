import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Pet } from "@/lib/petData";

const REMINDER_CHECK_INTERVAL = 60_000; // check every minute
const SHOWN_KEY = "petpal_shown_reminders";

function getShownReminders(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(SHOWN_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function markShown(id: string) {
  const shown = getShownReminders();
  shown.add(id);
  // Keep only last 200 entries to avoid bloat
  const arr = [...shown].slice(-200);
  localStorage.setItem(SHOWN_KEY, JSON.stringify(arr));
}

function isToday(dateStr: string): boolean {
  const today = new Date();
  const d = new Date(dateStr);
  return d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
}

function isTomorrow(dateStr: string): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const d = new Date(dateStr);
  return d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate();
}

function isWithinDays(dateStr: string, days: number): boolean {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return diff > 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function getCurrentTimeSlot(): string {
  const h = new Date().getHours();
  const m = new Date().getMinutes();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function isTimeNear(timeStr: string, withinMinutes: number = 30): boolean {
  const now = getCurrentTimeSlot();
  const [nh, nm] = now.split(":").map(Number);
  const [th, tm] = timeStr.split(":").map(Number);
  const nowMins = nh * 60 + nm;
  const targetMins = th * 60 + tm;
  const diff = targetMins - nowMins;
  return diff >= 0 && diff <= withinMinutes;
}

export function usePetReminders(pets: Pet[]) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const checkReminders = () => {
      const shown = getShownReminders();
      const today = new Date().toISOString().split("T")[0];

      pets.forEach((pet) => {
        // --- Feeding Reminders ---
        (pet.feedingSchedule || []).forEach((f) => {
          if (f.completed) return;
          const id = `feed_${pet.id}_${f.id}_${today}`;
          if (shown.has(id)) return;
          if (isTimeNear(f.time, 15)) {
            markShown(id);
            toast(`🍽️ Feeding Time for ${pet.name}`, {
              description: `${f.food} — ${f.amount} at ${f.time}`,
              duration: 8000,
            });
          }
        });

        // --- Medication Reminders ---
        (pet.medications || []).forEach((med) => {
          if (!med.active) return;
          const id = `med_${pet.id}_${med.id}_${today}`;
          if (shown.has(id)) return;
          // Show med reminders in the morning
          const h = new Date().getHours();
          if (h >= 8 && h <= 10) {
            markShown(id);
            toast(`💊 Medication Reminder for ${pet.name}`, {
              description: `${med.name} — ${med.dosage} (${med.frequency})`,
              duration: 10000,
            });
          }
        });

        // --- Vet Appointment Reminders ---
        (pet.vetAppointments || []).forEach((appt) => {
          if (appt.status !== "scheduled") return;

          // Tomorrow reminder
          if (isTomorrow(appt.date)) {
            const id = `vet_tmr_${pet.id}_${appt.id}`;
            if (!shown.has(id)) {
              markShown(id);
              toast(`📅 Vet Tomorrow for ${pet.name}`, {
                description: `${appt.reason} with ${appt.vetName} at ${appt.time}`,
                duration: 12000,
              });
            }
          }

          // Today reminder
          if (isToday(appt.date)) {
            const id = `vet_today_${pet.id}_${appt.id}`;
            if (!shown.has(id)) {
              markShown(id);
              toast(`🏥 Vet Appointment Today for ${pet.name}!`, {
                description: `${appt.reason} with ${appt.vetName} at ${appt.time}`,
                duration: 15000,
              });
            }
          }
        });

        // --- Vaccination Reminder ---
        if (!pet.vaccinated) {
          const id = `vax_${pet.id}_${today}`;
          if (!shown.has(id)) {
            markShown(id);
            toast(`💉 Vaccination Needed for ${pet.name}`, {
              description: `${pet.name} is not vaccinated. Schedule a vaccination appointment soon.`,
              duration: 10000,
            });
          }
        }

        // --- Upcoming Vet Visit Reminder (within 7 days) ---
        if (pet.nextVetVisit && isWithinDays(pet.nextVetVisit, 7)) {
          const id = `nextvet_${pet.id}_${today}`;
          if (!shown.has(id)) {
            markShown(id);
            const visitDate = new Date(pet.nextVetVisit).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            toast(`🗓️ Upcoming Vet Visit for ${pet.name}`, {
              description: `Next vet visit scheduled for ${visitDate}`,
              duration: 8000,
            });
          }
        }
      });
    };

    // Run immediately on mount, then periodically
    checkReminders();
    intervalRef.current = setInterval(checkReminders, REMINDER_CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pets]);
}
