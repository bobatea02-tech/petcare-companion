import { motion } from "framer-motion";
import { Pet, groomingTips, petTypeEmoji } from "@/lib/petData";
import { Scissors, Sparkles, Calendar, Info, ChevronDown, ChevronUp } from "lucide-react";
import { GroomingScheduler } from "@/components/GroomingScheduler";
import { useState } from "react";

interface GroomingTipsProps {
  pet: Pet;
}

// Breed-specific grooming schedules
const breedGroomingSchedules: Record<string, { frequency: string; notes: string }> = {
  // Dogs
  "Golden Retriever": { frequency: "Every 6-8 weeks", notes: "Double coat requires regular brushing to prevent matting" },
  "Poodle": { frequency: "Every 4-6 weeks", notes: "Professional grooming recommended for coat maintenance" },
  "Labrador": { frequency: "Every 8-10 weeks", notes: "Frequent brushing during shedding season" },
  "German Shepherd": { frequency: "Every 8-12 weeks", notes: "Heavy shedder, brush 3-4 times weekly" },
  "Bulldog": { frequency: "Every 6-8 weeks", notes: "Clean facial wrinkles daily to prevent infections" },
  "Beagle": { frequency: "Every 8-10 weeks", notes: "Low maintenance coat, regular ear cleaning essential" },
  "Shih Tzu": { frequency: "Every 4-6 weeks", notes: "Daily brushing required to prevent tangles" },
  
  // Cats
  "Persian": { frequency: "Daily brushing", notes: "Long coat requires professional grooming every 6-8 weeks" },
  "Siamese": { frequency: "Weekly brushing", notes: "Short coat, minimal grooming needed" },
  "Maine Coon": { frequency: "2-3 times weekly", notes: "Long coat prone to matting, especially in winter" },
  "British Shorthair": { frequency: "Weekly brushing", notes: "Dense coat, increase during shedding season" },
  
  // Default
  "default": { frequency: "Every 6-8 weeks", notes: "Adjust based on coat type and activity level" }
};

export const GroomingTips = ({ pet }: GroomingTipsProps) => {
  const tips = groomingTips[pet.type] || groomingTips.other;
  const schedule = breedGroomingSchedules[pet.breed] || breedGroomingSchedules["default"];
  const [showTips, setShowTips] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      {/* Breed-Specific Schedule */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-accent/30 to-accent/10 rounded-card p-6 border-2 border-accent/40"
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <h4 className="font-display text-xl text-foreground mb-2">
              Recommended Schedule for {pet.breed}
            </h4>
            <div className="bg-card/50 rounded-card p-4 mb-3">
              <p className="text-sm text-foreground font-body mb-1">
                <span className="font-bold text-primary">Grooming Frequency:</span> {schedule.frequency}
              </p>
            </div>
            <div className="flex items-start gap-2 bg-muted/50 rounded-card p-3">
              <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground font-body">
                <span className="font-semibold">Breed Note:</span> {schedule.notes}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Reference Card - Always Visible */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-secondary/30 to-muted/50 rounded-card p-8 border-2 border-secondary/40"
      >
        <h4 className="font-display text-2xl text-foreground mb-6 flex items-center gap-2">
          <Scissors className="w-6 h-6 text-primary" />
          Quick Reference Guide
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card rounded-card p-4 border-l-4 border-primary">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-bold">Brushing</p>
            <p className="text-xl text-foreground font-display">
              {pet.type === "dog" ? "2-3x/week" : pet.type === "cat" ? "Weekly" : "As needed"}
            </p>
          </div>
          <div className="bg-card rounded-card p-4 border-l-4 border-accent">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-bold">Bathing</p>
            <p className="text-xl text-foreground font-display">
              {pet.type === "dog" ? "Every 4-6 weeks" : pet.type === "cat" ? "Rarely" : "Varies"}
            </p>
          </div>
          <div className="bg-card rounded-card p-4 border-l-4 border-primary">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-bold">Nail Trim</p>
            <p className="text-xl text-foreground font-display">
              {pet.type === "dog" || pet.type === "cat" ? "Every 3-4 weeks" : "As needed"}
            </p>
          </div>
          <div className="bg-card rounded-card p-4 border-l-4 border-accent">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-bold">Dental Care</p>
            <p className="text-xl text-foreground font-display">
              {pet.type === "dog" || pet.type === "cat" ? "Daily" : "Varies"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Grooming Scheduler - Always Visible */}
      <div className="mt-6">
        <GroomingScheduler pet={pet} />
      </div>

      {/* General Tips - Collapsible */}
      <div className="mt-6">
        <motion.button
          onClick={() => setShowTips(!showTips)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-between p-4 bg-secondary/30 rounded-card border-2 border-secondary/40 hover:border-secondary/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h4 className="text-label text-foreground">Essential Grooming Tips</h4>
          </div>
          {showTips ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </motion.button>

        {showTips && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 space-y-6"
          >
            {/* Tips List */}
            <div className="space-y-3">
              {tips.map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ scale: 1.02, x: 8 }}
                  transition={{ delay: index * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-card rounded-card p-5 shadow-forest border-2 border-primary/10 flex items-start gap-4 cursor-default hover:border-primary/30 transition-colors"
                >
                  <motion.div
                    whileHover={{ rotate: 20, scale: 1.1 }}
                    className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0"
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-base text-foreground font-body leading-relaxed font-medium">{tip}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
