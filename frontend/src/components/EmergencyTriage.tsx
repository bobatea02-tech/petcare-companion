import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pet, petTypeEmoji } from "@/lib/petData";
import { AlertTriangle, Phone, ArrowRight, ShieldAlert, Mic, ChevronDown, Activity, Thermometer, Heart, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EmergencyTriageProps {
  pet: Pet;
}

const emergencySymptoms = [
  { symptom: "Difficulty breathing", severity: "critical", action: "Rush to emergency vet immediately", icon: Activity },
  { symptom: "Seizures or convulsions", severity: "critical", action: "Keep away from objects, time the seizure, go to vet", icon: Zap },
  { symptom: "Uncontrolled bleeding", severity: "critical", action: "Apply pressure, go to emergency vet", icon: Heart },
  { symptom: "Suspected poisoning", severity: "critical", action: "Call pet poison helpline, then rush to vet", icon: AlertTriangle },
  { symptom: "Unable to urinate", severity: "critical", action: "Emergency vet visit within hours", icon: Thermometer },
  { symptom: "Bloated abdomen (dogs)", severity: "critical", action: "Could be GDV/bloat — emergency surgery may be needed", icon: Activity },
  { symptom: "Persistent vomiting (>24h)", severity: "high", action: "Withhold food 12h, offer small water sips. If continues, see vet", icon: Thermometer },
  { symptom: "Diarrhea with blood", severity: "high", action: "Vet visit within 24 hours recommended", icon: AlertTriangle },
  { symptom: "Lethargy / not eating (>24h)", severity: "high", action: "Monitor closely, vet visit if persists past 24h", icon: Heart },
  { symptom: "Limping or lameness", severity: "medium", action: "Rest and observe 24-48h. If no improvement, see vet", icon: Activity },
  { symptom: "Excessive scratching", severity: "low", action: "Check for fleas/ticks. Try oatmeal bath. Schedule vet if persistent", icon: Zap },
  { symptom: "Mild cough or sneezing", severity: "low", action: "Monitor for 2-3 days. Ensure warm environment. See vet if worsening", icon: Thermometer },
];

const severityConfig: Record<string, { color: string; bg: string; border: string; label: string; emoji: string; description: string }> = {
  critical: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", label: "Critical", emoji: "🚨", description: "Go to vet NOW — life threatening" },
  high: { color: "text-destructive", bg: "bg-destructive/5", border: "border-destructive/20", label: "High", emoji: "⚠️", description: "See vet within 24 hours" },
  medium: { color: "text-foreground", bg: "bg-muted", border: "border-accent/20", label: "Medium", emoji: "🔶", description: "Monitor closely, rest & observe" },
  low: { color: "text-muted-foreground", bg: "bg-secondary", border: "border-border", label: "Low", emoji: "✅", description: "Home care likely sufficient" },
};

export const EmergencyTriage = ({ pet }: EmergencyTriageProps) => {
  const navigate = useNavigate();
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const filtered = selectedSeverity
    ? emergencySymptoms.filter((s) => s.severity === selectedSeverity)
    : emergencySymptoms;

  // Group by severity for clear sections
  const grouped = selectedSeverity
    ? { [selectedSeverity]: filtered }
    : Object.keys(severityConfig).reduce((acc, key) => {
        const items = emergencySymptoms.filter((s) => s.severity === key);
        if (items.length > 0) acc[key] = items;
        return acc;
      }, {} as Record<string, typeof emergencySymptoms>);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6"
    >
      {/* Quick Action Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          className="bg-destructive/10 rounded-card p-6 flex items-center gap-4 cursor-default"
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-14 h-14 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0"
          >
            <Phone className="w-7 h-7 text-destructive" />
          </motion.div>
          <div>
            <span className="text-label text-destructive">Emergency Hotline</span>
            <p className="font-display text-3xl text-foreground">(888) 426-4435</p>
            <p className="text-xs text-muted-foreground font-body">ASPCA — 24/7 Available</p>
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(`/voice-assistant/${pet.id}`)}
          className="bg-primary rounded-card p-6 flex items-center gap-4 text-left text-primary-foreground"
        >
          <div className="w-14 h-14 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
            <Mic className="w-7 h-7" />
          </div>
          <div>
            <span className="text-label opacity-80">Need Help?</span>
            <p className="font-display text-2xl">Talk to Assistant</p>
            <p className="text-xs opacity-60 font-body">Describe {pet.name}'s symptoms by voice</p>
          </div>
        </motion.button>
      </div>

      {/* Pet Status Header */}
      <motion.div whileHover={{ scale: 1.01 }} className="bg-card rounded-card p-6 shadow-forest">
        <div className="flex items-center gap-3 mb-1">
          <ShieldAlert className="w-6 h-6 text-destructive" />
          <h3 className="font-display text-2xl text-foreground">Quick Triage for {pet.name} {petTypeEmoji[pet.type]}</h3>
        </div>
        <p className="text-sm text-muted-foreground font-body">Select your pet's symptom below to see immediate guidance.</p>
      </motion.div>

      {/* Severity Filter Pills */}
      <div className="flex flex-wrap gap-2">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setSelectedSeverity(null); setExpandedIndex(null); }}
          className={`text-[10px] uppercase tracking-widest font-bold px-5 py-2.5 rounded-pill transition-colors ${
            !selectedSeverity ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent/20"
          }`}
        >
          All Symptoms
        </motion.button>
        {Object.entries(severityConfig).map(([key, config]) => (
          <motion.button
            key={key}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setSelectedSeverity(key); setExpandedIndex(null); }}
            className={`text-[10px] uppercase tracking-widest font-bold px-5 py-2.5 rounded-pill transition-colors flex items-center gap-1.5 ${
              selectedSeverity === key ? "bg-primary text-primary-foreground" : `${config.bg} ${config.color} hover:opacity-80`
            }`}
          >
            <span>{config.emoji}</span> {config.label}
          </motion.button>
        ))}
      </div>

      {/* Grouped Symptom Sections */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([severity, items]) => {
          const config = severityConfig[severity];
          return (
            <div key={severity} className="space-y-2">
              {/* Section header */}
              <div className={`flex items-center gap-2 px-2 ${config.color}`}>
                <span className="text-lg">{config.emoji}</span>
                <span className="text-label">{config.label}</span>
                <span className="text-xs font-body opacity-60">— {config.description}</span>
              </div>

              {/* Symptom cards */}
              <div className="space-y-2">
                {items.map((item, idx) => {
                  const globalIdx = emergencySymptoms.indexOf(item);
                  const isExpanded = expandedIndex === globalIdx;
                  const Icon = item.icon;

                  return (
                    <motion.div
                      key={globalIdx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.01, x: 4 }}
                        onClick={() => setExpandedIndex(isExpanded ? null : globalIdx)}
                        className={`w-full text-left rounded-card p-4 border ${config.border} ${config.bg} transition-colors`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}>
                            <Icon className={`w-5 h-5 ${config.color}`} />
                          </div>
                          <span className="font-body font-semibold text-foreground flex-1">{item.symptom}</span>
                          <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          </motion.div>
                        </div>
                      </motion.button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <div className={`mx-4 p-4 rounded-b-card border-x border-b ${config.border} bg-card`}>
                              <div className="flex items-start gap-2">
                                <ArrowRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-body text-foreground font-medium">What to do:</p>
                                  <p className="text-sm font-body text-muted-foreground mt-1">{item.action}</p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};
