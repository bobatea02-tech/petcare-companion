import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, MapPin, Filter, Download } from "lucide-react";
import { api } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Appointment {
  id: number;
  appointment_date: string;
  appointment_time: string;
  vet_name: string;
  clinic_name?: string;
  clinic_address?: string;
  reason: string;
  status: string;
  notes?: string;
  created_at: string;
}

interface AppointmentHistoryProps {
  petId: number;
  petName: string;
}

export const AppointmentHistory = ({ petId, petName }: AppointmentHistoryProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("completed");

  useEffect(() => {
    fetchAppointments();
  }, [petId, statusFilter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      // Load from localStorage (mock database)
      const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      
      // Filter by status (completed or cancelled)
      const filtered = allAppointments.filter((apt: any) => 
        apt.status === statusFilter
      );
      
      // Sort by date (newest first)
      const sorted = filtered.sort((a: any, b: any) => 
        new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
      );
      
      setAppointments(sorted);
    } catch (error) {
      console.error("Error loading appointment history:", error);
      toast.error("Error loading appointments");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-primary bg-primary/10";
      case "scheduled":
        return "text-blue-600 bg-blue-50 dark:bg-blue-900/20";
      case "cancelled":
        return "text-destructive bg-destructive/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const exportToCSV = () => {
    const headers = ["Date", "Time", "Vet", "Clinic", "Reason", "Status", "Notes"];
    const rows = appointments.map(apt => [
      new Date(apt.appointment_date).toLocaleDateString(),
      apt.appointment_time || "",
      apt.vet_name,
      apt.clinic_name || "",
      apt.reason,
      apt.status,
      apt.notes || ""
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${petName}_appointments.csv`;
    a.click();
    toast.success("Appointments exported!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header with filters */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 rounded-pill">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-card">
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button
          onClick={exportToCSV}
          variant="outline"
          size="sm"
          className="rounded-pill"
          disabled={appointments.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Appointments list */}
      {appointments.length === 0 ? (
        <div className="text-center py-12">
          <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No {statusFilter} appointments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <motion.div
              key={apt.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.01, x: 4 }}
              className="bg-card rounded-card p-5 shadow-sm border border-border"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-display text-lg text-foreground">{apt.purpose || apt.reason}</h4>
                    <span className={`text-xs px-2 py-1 rounded-pill ${getStatusColor(apt.status)}`}>
                      {apt.status}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>
                        {new Date(apt.appointment_date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </span>
                      {apt.appointment_time && (
                        <>
                          <Clock className="w-3.5 h-3.5 ml-2" />
                          <span>{apt.appointment_time}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{apt.clinic_name || apt.vet_name}</span>
                    </div>
                    
                    {apt.clinic_address && (
                      <div className="text-xs text-muted-foreground/70 ml-5">
                        {apt.clinic_address}
                      </div>
                    )}
                    
                    {apt.notes && (
                      <div className="text-xs text-muted-foreground/60 mt-2 ml-5 italic">
                        {apt.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
