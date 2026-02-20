import { motion } from "framer-motion";
import { Mic, Heart, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface TourIntroStepProps {
  onStartTour: () => void;
  onSkipTour: () => void;
}

const tourFeatures = [
  {
    icon: Mic,
    title: "Voice Assistant",
    description: "Talk to JoJo and get instant help with your pet care questions",
  },
  {
    icon: Heart,
    title: "Health Tracker",
    description: "Keep track of vaccinations, medications, and health records",
  },
  {
    icon: Calendar,
    title: "Vet Booking",
    description: "Find and book appointments with nearby veterinarians",
  },
];

export const TourIntroStep = ({ onStartTour, onSkipTour }: TourIntroStepProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-block mb-4"
        >
          <Sparkles className="h-16 w-16 text-primary" />
        </motion.div>
        <h2 className="font-display text-4xl text-foreground mb-2">
          Welcome to PetPal!
        </h2>
        <p className="font-body text-lg text-muted-foreground">
          Let's take a quick tour of the key features
        </p>
      </div>

      {/* Feature Preview Cards */}
      <div className="grid gap-6 mb-8">
        {tourFeatures.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-start gap-4 p-6 bg-olive border-2 border-accent rounded-[2.5rem] hover:border-primary transition-colors"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-sage flex items-center justify-center">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl text-foreground mb-1">
                  {feature.title}
                </h3>
                <p className="font-body text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tour Duration Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center mb-6"
      >
        <p className="font-body text-sm text-muted-foreground">
          This tour takes less than 1 minute
        </p>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Button
          onClick={onStartTour}
          className="flex-1 rounded-[2.5rem] bg-primary text-primary-foreground font-body py-6 text-lg hover:opacity-90 transition-opacity"
        >
          Start Tour
        </Button>
        <Button
          onClick={onSkipTour}
          variant="outline"
          className="flex-1 rounded-[2.5rem] border-accent font-body py-6 text-lg hover:bg-sage transition-colors"
        >
          Skip for Now
        </Button>
      </motion.div>
    </motion.div>
  );
};
