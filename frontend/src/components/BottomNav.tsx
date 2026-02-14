import { motion } from "framer-motion";
import { Home, Users, User, MessageCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const navItems = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/community", icon: Users, label: "Community" },
  { path: "/messages", icon: MessageCircle, label: "Chat" },
  { path: "/profile", icon: User, label: "Profile" },
];

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card/90 backdrop-blur-xl border border-border rounded-pill px-3 py-2.5 shadow-forest flex items-center gap-1"
    >
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <motion.button
            key={item.path}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-pill transition-all duration-300 ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <item.icon className="w-4 h-4" />
            {isActive && (
              <motion.span
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "auto", opacity: 1 }}
                className="text-[10px] uppercase tracking-widest font-bold whitespace-nowrap overflow-hidden"
              >
                {item.label}
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </motion.nav>
  );
};
