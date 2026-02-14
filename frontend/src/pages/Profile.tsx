import { useState } from "react";
import { motion } from "framer-motion";
import { NoiseOverlay } from "@/components/NoiseOverlay";
import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit2, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Pet, defaultPets, petTypeEmoji } from "@/lib/petData";
import petpalLogo from "@/assets/petpal-logo.png";

const Profile = () => {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(localStorage.getItem("petpal_user") || "Pet Parent");
  const [bio, setBio] = useState(localStorage.getItem("petpal_bio") || "Passionate pet parent 🐾");
  const [location, setLocation] = useState(localStorage.getItem("petpal_location") || "");

  const pets: Pet[] = (() => {
    const saved = localStorage.getItem("petpal_pets");
    return saved ? JSON.parse(saved) : defaultPets;
  })();

  const handleSave = () => {
    localStorage.setItem("petpal_user", name);
    localStorage.setItem("petpal_bio", bio);
    localStorage.setItem("petpal_location", location);
    setEditing(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background pb-24">
      <NoiseOverlay />
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.1 }} onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            <img src={petpalLogo} alt="PetPal" className="w-8 h-8 rounded-full" />
            <span className="font-display text-2xl text-foreground">Profile</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-card p-8 shadow-forest text-center"
        >
          <div className="w-24 h-24 rounded-full bg-primary/10 mx-auto flex items-center justify-center font-display text-5xl text-primary mb-4">
            {name[0]?.toUpperCase()}
          </div>
          {editing ? (
            <div className="space-y-3 max-w-sm mx-auto">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="rounded-pill text-center" />
              <Input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Bio" className="rounded-pill text-center" />
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="rounded-pill text-center" />
              <Button onClick={handleSave} className="rounded-pill gap-2 w-full">
                <Save className="w-3 h-3" /> Save
              </Button>
            </div>
          ) : (
            <>
              <h2 className="font-display text-4xl text-foreground">{name}</h2>
              <p className="text-sm text-muted-foreground font-body mt-1">{bio}</p>
              {location && <p className="text-xs text-muted-foreground font-body mt-1">📍 {location}</p>}
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setEditing(true)}
                className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-pill bg-muted text-muted-foreground hover:bg-accent/20 transition-colors"
              >
                <Edit2 className="w-3 h-3" /> Edit Profile
              </motion.button>
            </>
          )}
        </motion.div>

        {/* My Pets */}
        <div>
          <h3 className="text-label text-muted-foreground mb-4">My Pets</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pets.map((pet) => (
              <motion.div
                key={pet.id}
                whileHover={{ scale: 1.02, y: -4 }}
                className="bg-card rounded-card p-5 shadow-forest flex items-center gap-4 cursor-pointer"
                onClick={() => navigate("/dashboard")}
              >
                <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-2xl flex-shrink-0">
                  {pet.avatar ? (
                    <img src={pet.avatar} alt={pet.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    petTypeEmoji[pet.type]
                  )}
                </div>
                <div>
                  <p className="font-display text-xl text-foreground">{pet.name}</p>
                  <p className="text-xs text-muted-foreground font-body">{pet.breed} · {pet.age} {pet.ageUnit}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-card p-5 shadow-forest text-center">
            <p className="font-display text-3xl text-foreground">{pets.length}</p>
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-1">Pets</p>
          </div>
          <div className="bg-card rounded-card p-5 shadow-forest text-center">
            <p className="font-display text-3xl text-foreground">{pets.reduce((a, p) => a + p.healthLogs.length, 0)}</p>
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-1">Logs</p>
          </div>
          <div className="bg-card rounded-card p-5 shadow-forest text-center">
            <p className="font-display text-3xl text-foreground">{pets.reduce((a, p) => a + p.vetAppointments.length, 0)}</p>
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-1">Vet Visits</p>
          </div>
        </div>
      </main>
      <BottomNav />
    </motion.div>
  );
};

export default Profile;
