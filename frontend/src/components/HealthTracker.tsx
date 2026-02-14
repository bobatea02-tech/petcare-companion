import { useState } from "react";
import { motion } from "framer-motion";
import { HealthLog, Pet } from "@/lib/petData";
import { Activity, Heart, TrendingUp, Plus, Thermometer, Smile, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

const logTypeConfig: Record<string, { icon: any; color: string; label: string }> = {
  symptom: { icon: Thermometer, color: "bg-destructive/10 text-destructive", label: "Symptom" },
  checkup: { icon: Heart, color: "bg-primary/10 text-primary", label: "Checkup" },
  weight: { icon: TrendingUp, color: "bg-accent/20 text-accent-foreground", label: "Weight" },
  mood: { icon: Smile, color: "bg-secondary text-secondary-foreground", label: "Mood" },
  activity: { icon: Activity, color: "bg-muted text-muted-foreground", label: "Activity" },
};

const severityColor: Record<string, string> = {
  low: "bg-accent/20 text-accent-foreground",
  medium: "bg-muted text-foreground",
  high: "bg-destructive/10 text-destructive",
};

interface HealthTrackerProps {
  pet: Pet;
  onUpdate: (pet: Pet) => void;
}

export const HealthTracker = ({ pet, onUpdate }: HealthTrackerProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [newLog, setNewLog] = useState<Partial<HealthLog>>({
    type: "symptom",
    severity: "low",
    date: new Date().toISOString().split("T")[0],
  });

  const handleAdd = () => {
    if (!newLog.title || !newLog.description) return;
    const log: HealthLog = {
      id: Date.now().toString(),
      date: newLog.date || new Date().toISOString().split("T")[0],
      type: newLog.type as HealthLog["type"],
      title: newLog.title,
      description: newLog.description,
      severity: newLog.severity as HealthLog["severity"],
    };
    onUpdate({ ...pet, healthLogs: [log, ...pet.healthLogs] });
    setNewLog({ type: "symptom", severity: "low", date: new Date().toISOString().split("T")[0] });
    setOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      {/* Health Score Card */}
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ type: "spring", stiffness: 400 }}
        className="bg-primary rounded-card p-8 text-primary-foreground flex items-center justify-between cursor-default"
      >
        <div>
          <span className="text-label opacity-60">Health Score</span>
          <p className="font-display text-7xl mt-2">{pet.healthScore}%</p>
        </div>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 rounded-full border-4 border-primary-foreground/30 flex items-center justify-center"
        >
          <Heart className="w-10 h-10" />
        </motion.div>
      </motion.div>

      {/* Log Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-label text-muted-foreground">Health Logs</h3>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/health-records/${pet.id}`)}
            className="px-4 py-2 rounded-pill bg-accent/20 text-accent-foreground flex items-center gap-2 text-sm font-body"
          >
            <FileText className="w-4 h-4" />
            View Full Records
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
              <DialogTitle className="font-display text-2xl">Add Health Log</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <Select value={newLog.type} onValueChange={(v) => setNewLog({ ...newLog, type: v as any })}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="symptom">Symptom</SelectItem>
                    <SelectItem value="checkup">Checkup</SelectItem>
                    <SelectItem value="weight">Weight</SelectItem>
                    <SelectItem value="mood">Mood</SelectItem>
                    <SelectItem value="activity">Activity</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newLog.severity} onValueChange={(v) => setNewLog({ ...newLog, severity: v as any })}>
                  <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input type="date" value={newLog.date} onChange={(e) => setNewLog({ ...newLog, date: e.target.value })} />
              <Input placeholder="Title (e.g., Mild cough)" value={newLog.title || ""} onChange={(e) => setNewLog({ ...newLog, title: e.target.value })} />
              <Input placeholder="Description" value={newLog.description || ""} onChange={(e) => setNewLog({ ...newLog, description: e.target.value })} />
              <Button onClick={handleAdd} className="w-full rounded-pill font-body text-label">Add Log</Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        {(pet.healthLogs || []).length === 0 && (
          <p className="text-sm text-muted-foreground font-body text-center py-8">No health logs yet. Start tracking! 📋</p>
        )}
        {(pet.healthLogs || []).map((log, index) => {
          const config = logTypeConfig[log.type];
          const Icon = config.icon;
          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.02, x: 4 }}
              transition={{ duration: 0.3 }}
              className="bg-card rounded-card p-5 shadow-forest flex items-start gap-4 cursor-default"
            >
              <motion.div
                whileHover={{ rotate: 15 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}
              >
                <Icon className="w-5 h-5" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-body font-semibold text-foreground">{log.title}</span>
                  {log.severity && (
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-pill ${severityColor[log.severity]}`}>
                      {log.severity}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground font-body mt-1">{log.description}</p>
                <p className="text-[11px] text-muted-foreground/60 font-body mt-2">
                  {new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
