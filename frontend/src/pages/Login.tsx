import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NoiseOverlay } from "@/components/NoiseOverlay";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";

const floatingEmojis = ["🐕", "🐱", "🐦", "🐰", "🐟", "🐾", "❤️", "🌿"];

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      if (isRegister) {
        // Register new user
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/v1/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            full_name: name
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          alert(data.detail || 'Registration failed');
          setIsLoggingIn(false);
          return;
        }
        
        // Use AuthContext to manage authentication state
        login(data.access_token, data.user_id, email, name);
        
        // Navigate to onboarding for new users
        setTimeout(() => navigate("/onboarding"), 1200);
      } else {
        // Login existing user
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          alert(data.detail || 'Login failed');
          setIsLoggingIn(false);
          return;
        }
        
        // Use AuthContext to manage authentication state
        login(data.access_token, data.user_id, email, data.full_name || name || "Pet Parent");
        
        // Navigate to dashboard for existing users
        setTimeout(() => navigate("/dashboard"), 1200);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Connection error. Please check if the backend is running.');
      setIsLoggingIn(false);
    }
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
              <motion.div
                className="mb-4 flex justify-center"
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 1, repeat: 1 }}
              >
                <Logo size="xl" showText={false} />
              </motion.div>
              <p className="font-display text-4xl text-primary-foreground font-bold">Welcome to PawPal</p>
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
          <div className="mb-4">
            <Logo size="lg" showText={false} animated={true} className="justify-center" />
          </div>
          <h1 className="font-display text-6xl bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 bg-clip-text text-transparent font-bold tracking-tight">PawPal</h1>
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
