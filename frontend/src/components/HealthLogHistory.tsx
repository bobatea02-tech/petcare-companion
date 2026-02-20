import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Calendar, Search, Filter, Download, Stethoscope } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

interface HealthLog {
  id: number;
  log_date: string;
  log_type: string;
  title: string;
  notes?: string;
  vet_name?: string;
  created_at: string;
}

interface HealthLogHistoryProps {
  petId: number;
  petName: string;
  petHealthLogs?: any[]; // Pass the pet's health logs directly
}

export const HealthLogHistory = ({ petId, petName, petHealthLogs = [] }: HealthLogHistoryProps) => {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logType, setLogType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchLogs();
  }, [petId, logType, startDate, endDate, petHealthLogs]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Convert pet health logs to the format expected by this component
      let filteredLogs = petHealthLogs.map((log: any) => ({
        id: parseInt(log.id) || 0,
        log_date: log.date,
        log_type: log.type,
        title: log.title,
        notes: log.description,
        vet_name: log.vetName || undefined,
        created_at: log.date
      }));

      // Apply filters
      if (logType !== "all") {
        filteredLogs = filteredLogs.filter((log: any) => log.log_type === logType);
      }

      if (startDate) {
        filteredLogs = filteredLogs.filter((log: any) => new Date(log.log_date) >= new Date(startDate));
      }

      if (endDate) {
        filteredLogs = filteredLogs.filter((log: any) => new Date(log.log_date) <= new Date(endDate));
      }

      if (searchQuery) {
        filteredLogs = filteredLogs.filter((log: any) => 
          log.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.title?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setLogs(filteredLogs);
    } catch (error) {
      console.error("Error loading health logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchLogs();
  };

  const getLogTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "checkup":
        return "text-blue-600 bg-blue-50 dark:bg-blue-900/20";
      case "emergency":
        return "text-red-600 bg-red-50 dark:bg-red-900/20";
      case "surgery":
        return "text-purple-600 bg-purple-50 dark:bg-purple-900/20";
      case "vaccination":
        return "text-green-600 bg-green-50 dark:bg-green-900/20";
      case "dental":
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getLogTypeIcon = (type: string) => {
    return "🏥";
  };

  const exportToCSV = () => {
    const headers = ["Date", "Type", "Title", "Vet", "Notes"];
    const rows = logs.map(log => [
      format(new Date(log.log_date), "MM/dd/yyyy"),
      log.log_type,
      log.title,
      log.vet_name || "",
      log.notes || ""
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${petName}_health_logs.csv`;
    a.click();
    toast.success("Health logs exported!");
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
      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={logType} onValueChange={setLogType}>
            <SelectTrigger className="w-40 rounded-pill">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-card">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="checkup">Checkup</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="surgery">Surgery</SelectItem>
              <SelectItem value="vaccination">Vaccination</SelectItem>
              <SelectItem value="dental">Dental</SelectItem>
              <SelectItem value="grooming">Grooming</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start date"
              className="w-40 rounded-pill"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End date"
              className="w-40 rounded-pill"
            />
          </div>

          <Button
            onClick={exportToCSV}
            variant="outline"
            size="sm"
            className="rounded-pill ml-auto"
            disabled={logs.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search in notes..."
            className="flex-1 rounded-pill"
          />
          <Button onClick={handleSearch} size="sm" className="rounded-pill">
            Search
          </Button>
        </div>
      </div>

      {/* Logs list */}
      {logs.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No health logs found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.01, x: 4 }}
              className="bg-card rounded-card p-5 shadow-sm border border-border"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getLogTypeIcon(log.log_type)}</span>
                    <h4 className="font-display text-lg text-foreground">{log.title}</h4>
                    <span className={`text-xs px-2 py-1 rounded-pill ${getLogTypeColor(log.log_type)}`}>
                      {log.log_type}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {format(new Date(log.log_date), "EEEE, MMMM dd, yyyy")}
                      </span>
                    </div>
                    
                    {log.vet_name && (
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>{log.vet_name}</span>
                      </div>
                    )}
                    
                    {log.notes && (
                      <div className="text-xs text-muted-foreground/60 mt-2 ml-5">
                        {log.notes}
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
