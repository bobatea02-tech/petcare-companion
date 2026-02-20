import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Pet, defaultPets } from "@/lib/petData";

const Messages = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Get the first pet or default pet
    const pets: Pet[] = JSON.parse(localStorage.getItem("petpal_pets") || JSON.stringify(defaultPets));
    const firstPet = pets[0];
    
    if (firstPet) {
      // Redirect to Voice Assistant with the first pet
      navigate(`/voice-assistant/${firstPet.id}`, { replace: true });
    } else {
      // If no pets, redirect to dashboard
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  return null;
};

export default Messages;
