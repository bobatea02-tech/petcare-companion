import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Pill, Calendar, Clock, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  notes?: string;
  is_active: boolean;
}

interface MedicationHistoryProps {
  petId: number;
  petName: string;
}

export const MedicationHistory = ({ petId, petName }: MedicationHistoryProps) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  useEffect(() => {
    fetchMedications();
  }, [petId, showActiveOnly]);

  const fetchMedications = async () => {
    setLoading(true);
    try {
      // For now, use mock data from localStorage
      // In production, this would call the backend API
      const mockMeds: Medication[] = [];
      
      // Load from localStorage if available
      const savedMeds = localStorage.getItem(`medications_${petId}`);
      if (savedMeds) {
        const parsedMeds = JSON.parse(savedMeds);
        setMedications(parsedMeds);
      } else {
        setMedications(mockMeds);
      }
    } catch (error) {
      console.error("Error loading medications:", error);
      setMedications([]);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Medication", "Dosage", "Frequency", "Start Date", "End Date", "Status", "Notes"];
    const rows = medications.map(med => [
      med.name,
      med.dosage,
      med.frequency,
      format(new Date(med.start_date), "MM/dd/yyyy"),
      med.end_date ? format(new Date(med.end_date), "MM/dd/yyyy") : "Ongoing",
      med.is_active ? "Active" : "Completed",
      med.notes || ""
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${petName}_medications.csv`;
    a.click();
    toast.success("Medications exported!");
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
      {/* Header with toggle and export */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant={showActiveOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowActiveOnly(true)}
            className="rounded-pill"
          >
            Active Only
          </Button>
          <Button
            variant={!showActiveOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowActiveOnly(false)}
            className="rounded-pill"
          >
            All Medications
          </Button>
        </div>
        
        <Button
          onClick={exportToCSV}
          variant="outline"
          size="sm"
          className="rounded-pill"
          disabled={medications.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Medications list */}
      {medications.length === 0 ? (
        <div className="text-center py-12">
          <Pill className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">
            No {showActiveOnly ? "active" : ""} medications found
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {medications.map((med) => (
            <motion.div
              key={med.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.01, x: 4 }}
              className={`rounded-card p-5 shadow-sm border ${
                med.is_active
                  ? "bg-card border-primary/20 border-l-4 border-l-primary"
                  : "bg-muted/50 border-border opacity-70"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Pill className={`w-4 h-4 ${med.is_active ? "text-primary" : "text-muted-foreground"}`} />
                    <h4 className="font-display text-lg text-foreground">{med.name}</h4>
                    {med.is_active ? (
                      <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-pill bg-primary/10 text-primary">
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-pill bg-muted text-muted-foreground">
                        Completed
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="font-medium">Dosage:</span>
                        <span>{med.dosage}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-medium">Frequency:</span>
                        <span>{med.frequency}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="font-medium">Duration:</span>
                      <span>
                        {format(new Date(med.start_date), "MMM dd, yyyy")}
                        {med.end_date ? (
                          <> → {format(new Date(med.end_date), "MMM dd, yyyy")}</>
                        ) : (
                          <> → Ongoing</>
                        )}
                      </span>
                    </div>
                    
                    {med.notes && (
                      <div className="text-xs text-muted-foreground/60 mt-2 italic">
                        {med.notes}
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
