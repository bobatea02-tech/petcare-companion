import { Pet, petTypeEmoji } from "@/lib/petData";
import dogAvatar from "@/assets/dog-avatar.jpg";
import catAvatar from "@/assets/cat-avatar.jpg";
import { motion } from "framer-motion";

interface PetCardProps {
  pet: Pet;
  isSelected: boolean;
  onClick: () => void;
}

const avatarMap: Record<string, string> = {
  dog: dogAvatar,
  cat: catAvatar,
};

export const PetCard = ({ pet, isSelected, onClick }: PetCardProps) => {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex flex-col items-center justify-center w-24 h-24 rounded-card transition-all duration-500 cursor-pointer ${
        isSelected
          ? "bg-primary text-primary-foreground shadow-forest"
          : "bg-card text-card-foreground hover:shadow-forest"
      }`}
    >
      <div className="w-12 h-12 rounded-full overflow-hidden mb-1">
        <img
          src={pet.avatar || avatarMap[pet.type] || ""}
          alt={pet.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        {!pet.avatar && !avatarMap[pet.type] && (
          <div className="w-full h-full flex items-center justify-center text-2xl bg-secondary">
            {petTypeEmoji[pet.type]}
          </div>
        )}
      </div>
      <span className="text-label text-[9px]">{pet.name}</span>
    </motion.button>
  );
};
