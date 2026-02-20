import { useState } from "react";
import { Pet, petTypeEmoji } from "@/lib/petData";
import { generateCareNotes } from "@/lib/careNotesGenerator";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Shield, Calendar, Weight, AlertTriangle, Mic, Stethoscope, Trash2 } from "lucide-react";
import { getWeightStatus } from "@/lib/weightStatus";
import dogAvatar from "@/assets/dog-avatar.jpg";
import catAvatar from "@/assets/cat-avatar.jpg";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HealthTracker } from "@/components/HealthTracker";
import { MedicationTracker } from "@/components/MedicationTracker";
import { FeedingReminders } from "@/components/FeedingReminders";
import { GroomingTips } from "@/components/GroomingTips";
import { VetBooking } from "@/components/VetBooking";
import { EmergencyTriage } from "@/components/EmergencyTriage";
import { EditPetDialog } from "@/components/EditPetDialog";
import { MilestoneTracker } from "@/components/milestones/MilestoneTracker";
import { ProfileSharing } from "@/components/ProfileSharing";
import { useVoiceControl } from "@/hooks/useVoiceControl";
import { useVoiceIntegration } from "@/services/voice/voiceIntegration";

const avatarMap: Record<string, string> = {
  dog: dogAvatar,
  cat: catAvatar,
};

interface PetDashboardProps {
  pet: Pet;
  onUpdate?: (pet: Pet) => void;
  onDelete?: (petId: string) => void;
}

const StatCard = ({ icon: Icon, label, value, color, subtitle }: { icon: any; label: string; value: string; color: string; subtitle?: { label: string; color: string; emoji: string } }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.08, y: -6 }}
    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    className="bg-gradient-to-br from-card to-muted/30 rounded-card p-6 shadow-forest flex flex-col items-center gap-3 cursor-default group border border-border/50 backdrop-blur-sm"
  >
    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color} shadow-forest transition-all duration-300 group-hover:scale-125 group-hover:shadow-lg`}>
      <Icon className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12" />
    </div>
    <span className="text-label text-muted-foreground text-center">{label}</span>
    <span className="font-display text-3xl text-foreground leading-none">{value}</span>
    {subtitle && (
      <motion.span
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-xs font-body font-semibold ${subtitle.color} text-center`}
      >
        {subtitle.emoji} {subtitle.label}
      </motion.span>
    )}
  </motion.div>
);

export const PetDashboard = ({ pet, onUpdate, onDelete }: PetDashboardProps) => {
  const navigate = useNavigate();
  const careNotes = generateCareNotes(pet);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("health");

  // Initialize voice integration with navigation
  useVoiceIntegration();

  // Enable voice control for this dashboard
  const { notifyManualAction } = useVoiceControl({
    componentId: 'pet-dashboard',
    petId: pet.id,
    onVoiceCommand: (intent, result) => {
      // Handle voice commands that affect the dashboard
      if (result.success && intent.target === 'tab') {
        // Voice command to switch tabs
        const tabName = intent.parameters.tabName;
        if (tabName) {
          setActiveTab(tabName);
        }
      }
    },
  });

  const handlePetUpdate = (updatedPet: Pet) => {
    onUpdate?.(updatedPet);
    // Notify voice system of manual update
    notifyManualAction('update-pet', { petId: pet.id, updates: updatedPet });
  };

  const scrollToHealthTab = () => {
    setActiveTab("health");
    // Notify voice system of manual navigation
    notifyManualAction('navigate-tab', { tab: 'health' });
    // Scroll to tabs section
    setTimeout(() => {
      const tabsElement = document.querySelector('[role="tablist"]');
      if (tabsElement) {
        tabsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };


  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pet.id}
        initial={{ opacity: 0, y: 60, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -40, scale: 0.97 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-8"
      >
        {/* Pet Header */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ boxShadow: "0 20px 60px -15px rgba(1, 71, 46, 0.25)" }}
          className="bg-secondary rounded-section p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 transition-shadow duration-500"
        >
          <motion.div
            whileHover={{ rotate: 3, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="w-32 h-32 md:w-40 md:h-40 rounded-card overflow-hidden shadow-forest animate-float flex-shrink-0"
          >
            <img
              src={pet.avatar || avatarMap[pet.type] || ""}
              alt={pet.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            {!pet.avatar && !avatarMap[pet.type] && (
              <div className="w-full h-full flex items-center justify-center text-6xl bg-muted">
                {petTypeEmoji[pet.type]}
              </div>
            )}
          </motion.div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h2 className="font-display text-5xl md:text-7xl text-foreground leading-none">{pet.name}</h2>
              <span className="text-4xl">{petTypeEmoji[pet.type]}</span>
            </div>
            <p className="text-label text-muted-foreground mb-3">
              {pet.breed} · {pet.gender === "male" ? "♂ Male" : "♀ Female"} · {pet.age} {pet.ageUnit}
            </p>
            <p className="font-body text-muted-foreground text-sm max-w-md">
              {pet.behavior}
            </p>
          </div>
          <div className="flex flex-col gap-3 items-center">
            <div className="flex gap-2">
              {onUpdate && <EditPetDialog pet={pet} onUpdate={handlePetUpdate} />}
              {onDelete && (
                <motion.button
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-all duration-300 shadow-forest"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              )}
            </div>
            {/* Voice Assistant Hero */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/voice-assistant/${pet.id}`)}
              className="bg-primary text-primary-foreground rounded-card p-4 md:p-6 flex items-center gap-3 shadow-forest w-full max-w-[200px]"
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0"
              >
                <Mic className="w-6 h-6" />
              </motion.div>
              <div className="text-left">
                <span className="font-display text-lg leading-none block">Voice Chat</span>
                <span className="text-[10px] uppercase tracking-widest opacity-60 font-body">Ask about {pet.name}</span>
              </div>
            </motion.button>
            
            {/* Health Records Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={scrollToHealthTab}
              className="bg-accent text-accent-foreground rounded-card p-4 md:p-6 flex items-center gap-3 shadow-forest w-full max-w-[200px]"
            >
              <div className="w-12 h-12 rounded-full bg-accent-foreground/20 flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="font-display text-lg leading-none block">Health Records</span>
                <span className="text-[10px] uppercase tracking-widest opacity-60 font-body">View medical history</span>
              </div>
            </motion.button>
          </div>

          {/* Delete Confirmation */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setShowDeleteConfirm(false)}
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-card rounded-card p-8 shadow-forest max-w-sm w-full text-center space-y-4"
                >
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                    <Trash2 className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="font-display text-2xl text-foreground">Delete {pet.name}?</h3>
                  <p className="text-sm text-muted-foreground font-body">This will permanently remove {pet.name}'s profile and all associated data.</p>
                  <div className="flex gap-3 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-6 py-3 rounded-pill bg-muted text-foreground text-label"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { onDelete(pet.id); setShowDeleteConfirm(false); }}
                      className="px-6 py-3 rounded-pill bg-destructive text-destructive-foreground text-label"
                    >
                      Delete
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Heart} label="Health Score" value={`${pet.healthScore}%`} color="bg-secondary text-primary" />
          <StatCard icon={Weight} label="Weight" value={`${pet.weight} kg`} color="bg-muted text-accent" subtitle={getWeightStatus(pet.type, pet.weight)} />
          <StatCard icon={Shield} label="Vaccinated" value={pet.vaccinated ? "Yes ✓" : "No ✗"} color="bg-secondary text-primary" />
          <StatCard icon={Calendar} label="Next Vet" value={pet.nextVetVisit ? new Date(pet.nextVetVisit).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Not set"} color="bg-muted text-accent" />
        </div>

        {/* Tabbed Features */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-secondary rounded-card p-2">
            <TabsTrigger value="health" className="rounded-pill text-label text-[10px] flex-1 min-w-[100px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 hover:bg-primary/10">Health</TabsTrigger>
            <TabsTrigger value="meds" className="rounded-pill text-label text-[10px] flex-1 min-w-[100px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 hover:bg-primary/10">Medications</TabsTrigger>
            <TabsTrigger value="feeding" className="rounded-pill text-label text-[10px] flex-1 min-w-[100px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 hover:bg-primary/10">Feeding</TabsTrigger>
            <TabsTrigger value="grooming" className="rounded-pill text-label text-[10px] flex-1 min-w-[100px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 hover:bg-primary/10">Grooming</TabsTrigger>
            <TabsTrigger value="vet" className="rounded-pill text-label text-[10px] flex-1 min-w-[100px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 hover:bg-primary/10">Vet</TabsTrigger>
            <TabsTrigger value="milestones" className="rounded-pill text-label text-[10px] flex-1 min-w-[100px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 hover:bg-primary/10">Milestones</TabsTrigger>
            <TabsTrigger value="sharing" className="rounded-pill text-label text-[10px] flex-1 min-w-[100px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 hover:bg-primary/10">Share Profile</TabsTrigger>
            <TabsTrigger value="emergency" className="rounded-pill text-label text-[10px] flex-1 min-w-[100px] data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground transition-all duration-300 hover:bg-destructive/10">Emergency</TabsTrigger>
          </TabsList>

          <TabsContent value="health" className="mt-6">
            <HealthTracker pet={pet} onUpdate={handlePetUpdate} />
          </TabsContent>
          <TabsContent value="meds" className="mt-6">
            <MedicationTracker pet={pet} onUpdate={handlePetUpdate} />
          </TabsContent>
          <TabsContent value="feeding" className="mt-6">
            <FeedingReminders pet={pet} onUpdate={handlePetUpdate} />
          </TabsContent>
          <TabsContent value="grooming" className="mt-6">
            <GroomingTips pet={pet} />
          </TabsContent>
          <TabsContent value="vet" className="mt-6">
            <VetBooking pet={pet} onUpdate={handlePetUpdate} />
          </TabsContent>
          <TabsContent value="milestones" className="mt-6">
            <MilestoneTracker 
              petId={pet.id} 
              petName={pet.name} 
              petPhoto={pet.avatar || ""} 
            />
          </TabsContent>
          <TabsContent value="sharing" className="mt-6">
            <ProfileSharing 
              petId={pet.id} 
              userId={localStorage.getItem("userId") || "default-user"}
              petName={pet.name}
            />
          </TabsContent>
          <TabsContent value="emergency" className="mt-6">
            <EmergencyTriage pet={pet} />
          </TabsContent>
        </Tabs>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Allergies */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="bg-card rounded-card p-6 shadow-forest"
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span className="text-label text-muted-foreground">Allergies</span>
            </div>
            {pet.allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {pet.allergies.map((allergy) => (
                  <motion.span
                    key={allergy}
                    whileHover={{ scale: 1.1 }}
                    className="bg-destructive/10 text-destructive rounded-pill px-4 py-1 text-sm font-body font-medium cursor-default"
                  >
                    {allergy}
                  </motion.span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground font-body">No known allergies 🎉</p>
            )}
          </motion.div>

          {/* Dynamic Care Notes */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="bg-card rounded-card p-6 shadow-forest"
          >
            <div className="flex items-center gap-2 mb-4">
              <Stethoscope className="w-5 h-5 text-accent" />
              <span className="text-label text-muted-foreground">Smart Care Notes</span>
            </div>
            <div className="space-y-2">
              {careNotes.map((note, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="text-sm text-foreground font-body leading-relaxed border-l-2 border-accent/30 pl-3"
                >
                  {note}
                </motion.p>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
