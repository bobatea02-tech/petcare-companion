import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NoiseOverlay } from "@/components/NoiseOverlay";
import { PetCard } from "@/components/PetCard";
import { PetDashboard } from "@/components/PetDashboard";
import { AddPetDialog } from "@/components/AddPetDialog";
import { Pet, defaultPets } from "@/lib/petData";
import { LogOut } from "lucide-react";
import { usePetReminders } from "@/hooks/usePetReminders";
import { useNavigate } from "react-router-dom";
import petpalLogo from "@/assets/petpal-logo.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WelcomeBanner } from "@/components/WelcomeBanner";
import { BottomNav } from "@/components/BottomNav";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [showCelebration, setShowCelebration] = useState(false);

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
    localStorage.removeItem("petpal_user");
    navigate("/login");
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
    </motion.div>
  );
};

export default Dashboard;
