import { motion } from "framer-motion";

export const WelcomeBanner = () => {
  const hour = new Date().getHours();
  const userName = localStorage.getItem("petpal_user") || "Pet Parent";

  let emoji = "🌅";
  let sub = "Start the day with a health check!";

  if (hour >= 12 && hour < 17) {
    emoji = "☀️";
    sub = "Don't forget feeding time!";
  } else if (hour >= 17) {
    emoji = "🌙";
    sub = "Time to wind down with your pets.";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="bg-gradient-to-br from-primary/10 via-secondary/60 to-accent/20 backdrop-blur-sm rounded-card p-6 md:p-8 mb-8 border border-accent/20"
    >
      <div className="flex items-center justify-center gap-3">
        <span className="text-4xl">{emoji}</span>
        <div className="text-center">
          <h2 className="font-display text-3xl md:text-4xl text-foreground leading-none">
            Welcome, {userName}
          </h2>
          <p className="text-sm text-muted-foreground font-body mt-1">{sub}</p>
        </div>
      </div>
    </motion.div>
  );
};
