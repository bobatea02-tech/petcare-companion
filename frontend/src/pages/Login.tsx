import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NoiseOverlay } from "@/components/NoiseOverlay";
import { useNavigate } from "react-router-dom";
import petpalLogo from "@/assets/petpal-logo.png";

const floatingEmojis = ["🐕", "🐱", "🐦", "🐰", "🐟", "🐾", "❤️", "🌿"];

const Login = () => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    localStorage.setItem("petpal_user", name || "Pet Parent");
    setTimeout(() => navigate("/dashboard"), 1200);
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4 overflow-hidden relative">
      <NoiseOverlay />

      {/* Floating background emojis */}
      {floatingEmojis.map((emoji, i) => (
        <motion.span
          key={i}
          className="absolute text-4xl opacity-10 pointer-events-none select-none"
          initial={{
            x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 800),
            y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 600),
          }}
          animate={{
            y: [null, -30, 30, -20, 0],
            x: [null, 20, -20, 10, 0],
            rotate: [0, 10, -10, 5, 0],
          }}
          transition={{
            duration: 8 + i * 1.5,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        >
          {emoji}
        </motion.span>
      ))}

      <AnimatePresence>
        {isLoggingIn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-primary flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <motion.span
                className="text-8xl block mb-4"
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 1, repeat: 1 }}
              >
                🐾
              </motion.span>
              <p className="font-display text-4xl text-primary-foreground">Welcome to PetPal</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: isLoggingIn ? 0 : 1, y: isLoggingIn ? -40 : 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.img
            src={petpalLogo}
            alt="PetPal"
            className="w-20 h-20 rounded-full mx-auto mb-4 shadow-forest"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            whileHover={{ scale: 1.15, rotate: 10 }}
          />
          <h1 className="font-display text-6xl text-foreground">PetPal</h1>
          <p className="text-label text-muted-foreground mt-2">Your Pet Care Companion</p>
        </div>

        {/* Form Card */}
        <motion.div
          whileHover={{ boxShadow: "0 25px 60px -15px rgba(1, 71, 46, 0.2)" }}
          className="bg-card rounded-section p-8 shadow-forest transition-shadow duration-500"
        >
          <AnimatePresence mode="wait">
            <motion.h2
              key={isRegister ? "register" : "login"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="font-display text-3xl text-center text-foreground mb-6"
            >
              {isRegister ? "Create Account" : "Welcome Back"}
            </motion.h2>
          </AnimatePresence>
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
            >
              <label className="text-label text-muted-foreground block mb-1">Your Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-olive border border-accent rounded-pill px-5 py-3 font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"
                placeholder="Pet Parent Name"
                required
              />
            </motion.div>
            <div>
              <label className="text-label text-muted-foreground block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-olive border border-accent rounded-pill px-5 py-3 font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"
                placeholder="hello@petpal.com"
                required
              />
            </div>
            <div>
              <label className="text-label text-muted-foreground block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-olive border border-accent rounded-pill px-5 py-3 font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"
                placeholder="••••••••"
                required
              />
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-primary text-primary-foreground rounded-pill py-4 text-label tracking-[0.2em] hover:opacity-90 transition-opacity"
            >
              {isRegister ? "Sign Up" : "Log In"}
            </motion.button>
          </form>
          <p className="text-center mt-6 font-body text-sm text-muted-foreground">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button onClick={() => setIsRegister(!isRegister)} className="text-foreground font-bold underline hover:text-primary transition-colors">
              {isRegister ? "Log In" : "Sign Up"}
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
