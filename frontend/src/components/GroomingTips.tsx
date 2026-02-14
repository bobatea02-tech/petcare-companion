import { motion } from "framer-motion";
import { Pet, groomingTips, petTypeEmoji } from "@/lib/petData";
import { Scissors, Sparkles } from "lucide-react";

interface GroomingTipsProps {
  pet: Pet;
}

export const GroomingTips = ({ pet }: GroomingTipsProps) => {
  const tips = groomingTips[pet.type] || groomingTips.other;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ type: "spring", stiffness: 400 }}
        className="bg-primary rounded-card p-8 text-primary-foreground cursor-default"
      >
        <div className="flex items-center gap-3 mb-2">
          <Scissors className="w-8 h-8" />
          <h3 className="font-display text-3xl">Grooming Guide</h3>
        </div>
        <p className="text-sm opacity-70 font-body">
          Tailored tips for your {pet.breed} {petTypeEmoji[pet.type]}
        </p>
      </motion.div>

      <div className="space-y-3">
        {tips.map((tip, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.02, x: 8 }}
            transition={{ delay: index * 0.05, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="bg-card rounded-card p-5 shadow-forest flex items-start gap-4 cursor-default"
          >
            <motion.div
              whileHover={{ rotate: 20, scale: 1.1 }}
              className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center flex-shrink-0 mt-0.5"
            >
              <Sparkles className="w-4 h-4" />
            </motion.div>
            <p className="text-sm text-foreground font-body leading-relaxed">{tip}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
