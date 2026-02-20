import { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NoiseOverlay } from "@/components/NoiseOverlay";
import { PetCard } from "@/components/PetCard";
import { PetDashboard } from "@/components/PetDashboard";
import { AddPetDialog } from "@/components/AddPetDialog";
import { UpcomingAppointments } from "@/components/UpcomingAppointments";
import { TodaysReminders } from "@/components/TodaysReminders";
import { ReminderCalendar } from "@/components/ReminderCalendar";
import { JojoVoiceButton } from "@/components/JojoVoiceButton";
import { Pet, defaultPets } from "@/lib/petData";
import { LogOut, Bell, AlertCircle } from "lucide-react";
import { usePetReminders } from "@/hooks/usePetReminders";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import petpalLogo from "@/assets/petpal-logo.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WelcomeBanner } from "@/components/WelcomeBanner";
import { BottomNav } from "@/components/BottomNav";
import { toast } from "sonner";
import { HealthScoreDashboard } from "@/components/HealthScoreDashboard";
import { DailyTip } from "@/components/DailyTip";
import { ExpenseTracker } from "@/components/ExpenseTracker";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { EmergencySOS } from "@/components/emergency/EmergencySOS";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Lazy load GuidedTour component for code splitting
const GuidedTour = lazy(() => import("@/components/tour").then(m => ({ default: m.GuidedTour })));

const Dashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEmergencySOS, setShowEmergencySOS] = useState(false);

  // Check if user should see the tour (first-time user or tour requested)
  useEffect(() => {
    const tourCompleted = localStorage.getItem("tour_completed");
    const startTour = localStorage.getItem("start_tour");
    
    if (startTour === "true" && !tourCompleted) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        setIsTourActive(true);
      }, 1000);
      localStorage.removeItem("start_tour");
    }
  }, []);

  // Fetch pets from backend on mount
  useEffect(() => {
    fetchPetsFromBackend();
  }, []);

  const fetchPetsFromBackend = async () => {
    try {
      setLoadingPets(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        // No token, use mock data
        const saved = localStorage.getItem("petpal_pets");
        const mockPets = saved ? JSON.parse(saved) : defaultPets;
        setPets(mockPets);
        setSelectedPetId(mockPets[0]?.id || "");
        setLoadingPets(false);
        return;
      }

      const response = await fetch("http://localhost:8000/api/v1/pets", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const backendPets = await response.json();
        console.log("Fetched pets from backend:", backendPets);
        
        if (backendPets && backendPets.length > 0) {
          // Convert backend pet format to frontend format
          const convertedPets: Pet[] = backendPets.map((bp: any) => ({
            id: bp.id,
            name: bp.name,
            type: bp.species?.toLowerCase() || "other",
            breed: bp.breed || "Mixed",
            gender: bp.gender || "male",
            age: bp.birth_date ? calculateAge(bp.birth_date) : 1,
            ageUnit: "years" as const,
            weight: bp.weight || 0,
            allergies: bp.allergies ? bp.allergies.split(",").map((a: string) => a.trim()) : [],
            behavior: bp.medical_conditions || "Friendly and playful",
            avatar: bp.photo_url || "",
            healthScore: 85,
            vaccinated: true,
            nextVetVisit: null,
            healthLogs: [],
            medications: [],
            feedingSchedule: [],
            vetAppointments: []
          }));
          
          setPets(convertedPets);
          setSelectedPetId(convertedPets[0]?.id || "");
        } else {
          // No pets from backend, use mock data
          const saved = localStorage.getItem("petpal_pets");
          const mockPets = saved ? JSON.parse(saved) : defaultPets;
          setPets(mockPets);
          setSelectedPetId(mockPets[0]?.id || "");
        }
      } else {
        // API error, fallback to mock data
        console.warn("Failed to fetch pets from backend, using mock data");
        const saved = localStorage.getItem("petpal_pets");
        const mockPets = saved ? JSON.parse(saved) : defaultPets;
        setPets(mockPets);
        setSelectedPetId(mockPets[0]?.id || "");
      }
    } catch (error) {
      console.error("Error fetching pets:", error);
      // Fallback to mock data
      const saved = localStorage.getItem("petpal_pets");
      const mockPets = saved ? JSON.parse(saved) : defaultPets;
      setPets(mockPets);
      setSelectedPetId(mockPets[0]?.id || "");
    } finally {
      setLoadingPets(false);
    }
  };

  const calculateAge = (birthDate: string): number => {
    const birth = new Date(birthDate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    return years > 0 ? years : 1;
  };

  usePetReminders(pets);

  const selectedPet = pets.find(p => p.id === selectedPetId);

  const savePets = (newPets: Pet[]) => {
    setPets(newPets);
    localStorage.setItem("petpal_pets", JSON.stringify(newPets));
  };

  const handleAddPet = (pet: Pet) => {
    const newPets = [...pets, pet];
    savePets(newPets);
    setSelectedPetId(pet.id);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 2500);
  };

  const handleUpdatePet = (updatedPet: Pet) => {
    const newPets = pets.map((p) => (p.id === updatedPet.id ? updatedPet : p));
    savePets(newPets);
  };

  const handleDeletePet = (petId: string) => {
    const newPets = pets.filter((p) => p.id !== petId);
    savePets(newPets);
    if (selectedPetId === petId) {
      setSelectedPetId(newPets[0]?.id || "");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleTourComplete = () => {
    setIsTourActive(false);
    localStorage.setItem("tour_completed", "true");
    toast.success("Tour completed! You're all set to use PetPal.");
  };

  const handleTourSkip = () => {
    setIsTourActive(false);
    localStorage.setItem("tour_completed", "true");
    toast.info("Tour skipped. You can always explore features on your own!");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-background pb-24"
    >
      <NoiseOverlay />

      {/* Celebration overlay on pet add */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
          >
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [1, 1, 0],
                  scale: [0, 1.8, 0.3],
                  x: Math.cos((i / 20) * Math.PI * 2) * 300,
                  y: Math.sin((i / 20) * Math.PI * 2) * 300 - 120,
                  rotate: [0, Math.random() * 360],
                }}
                transition={{ duration: 2.5, ease: "easeOut", delay: i * 0.02 }}
                className="absolute text-4xl"
              >
                {["🐾", "🎉", "✨", "🐕", "🐱", "❤️", "🌟", "🦴", "🐟", "🐰", "🎊", "💛", "🎈", "🎀", "⭐", "🌈", "🎁", "💝", "🏆", "🎵"][i]}
              </motion.div>
            ))}
            <motion.div
              initial={{ scale: 0, rotateZ: -10 }}
              animate={{ scale: [0, 1.35, 1], rotateZ: [0, 5, 0] }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="bg-gradient-to-br from-primary to-accent text-primary-foreground px-12 py-8 rounded-card shadow-forest font-display text-5xl border-2 border-primary-foreground/30"
            >
              🎉 Welcome to PetPal! 🐾
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border"
      >
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3"
          >
            <img src={petpalLogo} alt="PetPal" className="w-10 h-10 rounded-full" />
            <span className="font-display text-2xl text-foreground">— PetPal</span>
          </motion.div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowNotifications(true)}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-foreground" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors"
            >
              <LogOut className="w-4 h-4 text-foreground" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      <main className="container max-w-6xl mx-auto px-4 py-8">
        <WelcomeBanner />

        {/* Dashboard Widgets Grid */}
        {!loadingPets && pets.length > 0 && selectedPet && (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="mb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {/* Health Score Widget */}
            <div className="lg:col-span-2">
              <ErrorBoundary featureName="Health Score Dashboard">
                <HealthScoreDashboard petId={selectedPet.id} />
              </ErrorBoundary>
            </div>

            {/* Daily Tip Widget */}
            <div>
              <ErrorBoundary featureName="Daily Tip">
                <DailyTip petType={selectedPet.type} breed={selectedPet.breed} />
              </ErrorBoundary>
            </div>

            {/* Expense Summary Widget */}
            {selectedPet && (
              <div className="lg:col-span-2">
                <ErrorBoundary featureName="Expense Tracker">
                  <ExpenseTracker 
                    petId={selectedPet.id} 
                    userId={localStorage.getItem("userId") || "default-user"} 
                  />
                </ErrorBoundary>
              </div>
            )}

            {/* Multi-Pet Comparison Link */}
            {pets.length > 1 && (
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-primary to-accent rounded-card p-6 shadow-forest cursor-pointer"
                onClick={() => navigate("/multi-pet-comparison")}
              >
                <h3 className="font-display text-xl text-primary-foreground mb-2">
                  Compare Your Pets
                </h3>
                <p className="text-sm text-primary-foreground/80 mb-4">
                  View health metrics across all {pets.length} pets
                </p>
                <Button variant="secondary" size="sm">
                  View Comparison
                </Button>
              </motion.div>
            )}
          </motion.section>
        )}

        {/* Today's Reminders */}
        {!loadingPets && pets.length > 0 && (
          <TodaysReminders 
            pets={pets} 
            onViewCalendar={() => setCalendarOpen(true)} 
          />
        )}

        {/* Reminder Calendar */}
        {!loadingPets && pets.length > 0 && (
          <ReminderCalendar 
            pets={pets} 
            isOpen={calendarOpen}
            onToggle={setCalendarOpen}
          />
        )}

        {/* Pet Profiles Row */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <h2 className="text-label text-muted-foreground mb-4">Your Pets</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {pets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                isSelected={pet.id === selectedPetId}
                onClick={() => setSelectedPetId(pet.id)}
              />
            ))}
            <AddPetDialog onAdd={handleAddPet} />
          </div>
        </motion.section>

        {/* Selected Pet Dashboard */}
        {loadingPets ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-20"
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading your pets...</p>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {selectedPet ? (
              <PetDashboard key={selectedPet.id} pet={selectedPet} onUpdate={handleUpdatePet} onDelete={handleDeletePet} />
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-20"
              >
                <p className="font-display text-4xl text-muted-foreground">Add your first pet! 🐾</p>
                <p className="text-sm text-muted-foreground mt-2 font-body">Click the + button above to get started</p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
      <BottomNav />
      
      {/* JoJo Voice Button */}
      {!loadingPets && pets.length > 0 && <JojoVoiceButton pets={pets} />}
      
      {/* Floating Emergency SOS Button */}
      {!loadingPets && pets.length > 0 && selectedPet && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowEmergencySOS(true)}
          className="fixed bottom-48 left-6 z-50 w-16 h-16 rounded-full bg-destructive text-destructive-foreground shadow-lg flex items-center justify-center"
          title="Emergency SOS"
        >
          <AlertCircle className="w-8 h-8" />
        </motion.button>
      )}

      {/* Emergency SOS Modal */}
      {showEmergencySOS && selectedPet && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <ErrorBoundary featureName="Emergency SOS">
              <EmergencySOS 
                petId={selectedPet.id} 
                onClose={() => setShowEmergencySOS(false)} 
              />
            </ErrorBoundary>
          </motion.div>
        </div>
      )}

      {/* Notification Center */}
      {showNotifications && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm" onClick={() => setShowNotifications(false)}>
          <div className="fixed right-0 top-0 h-full w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <ErrorBoundary featureName="Notification Center">
              <NotificationCenter />
            </ErrorBoundary>
          </div>
        </div>
      )}
      
      {/* Guided Tour - Lazy loaded */}
      {isTourActive && (
        <Suspense fallback={null}>
          <GuidedTour
            isActive={isTourActive}
            onComplete={handleTourComplete}
            onSkip={handleTourSkip}
          />
        </Suspense>
      )}
    </motion.div>
  );
};

export default Dashboard;
