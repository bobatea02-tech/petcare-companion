import { motion } from "framer-motion";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const MumbaiAppointmentBanner = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={() => navigate("/mumbai-appointments")}
      className="bg-gradient-to-r from-orange-500 to-green-500 rounded-card p-6 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-display text-2xl mb-1">Book Vet Appointment</h3>
            <div className="flex items-center gap-2 text-sm opacity-90">
              <MapPin className="w-4 h-4" />
              <span>10+ Clinics across Mumbai, Maharashtra</span>
            </div>
            <p className="text-xs opacity-75 mt-1">Real-time availability • Instant booking</p>
          </div>
        </div>
        <motion.div
          whileHover={{ x: 5 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <ArrowRight className="w-8 h-8" />
        </motion.div>
      </div>
    </motion.div>
  );
};
