import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NoiseOverlay } from "@/components/NoiseOverlay";
import { useNavigate, useParams } from "react-router-dom";
import { Pet, defaultPets, petTypeEmoji } from "@/lib/petData";
import { ArrowLeft, Send, Bot, User } from "lucide-react";
import petpalLogo from "@/assets/petpal-logo.png";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { VoiceVisualizer, VoiceControls, VoiceAlert } from "@/components/voice";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const quickReplies = [
  "My pet is not eating well",
  "Home remedy for pet itching",
  "When should I visit a vet?",
  "My pet has a fever",
  "Pet vaccination schedule",
];

const getAIResponse = (userMessage: string, pet: Pet): string => {
  const msg = userMessage.toLowerCase();

  if (msg.includes("not eating") || msg.includes("appetite") || msg.includes("food")) {
    return `I understand you're worried about ${pet.name}'s appetite. Here are some things to try:\n\n🍖 **Home Remedies:**\n- Try warming their food slightly to enhance aroma\n- Add a small amount of low-sodium broth\n- Ensure fresh, clean water is always available\n- Try feeding at consistent times\n\n⚠️ **See a vet if:**\n- ${pet.name} hasn't eaten for more than 24 hours\n- There's vomiting or diarrhea alongside\n- Lethargy or unusual behavior persists`;
  }

  if (msg.includes("itch") || msg.includes("scratch") || msg.includes("skin")) {
    return `For ${pet.name}'s itching, here's what you can do:\n\n🏠 **Home Remedies:**\n- Oatmeal bath (colloidal oatmeal mixed with lukewarm water)\n- Coconut oil applied to affected areas\n- Apple cider vinegar spray (diluted 50/50 with water)\n- Ensure regular flea prevention\n\n${pet.allergies.length > 0 ? `⚠️ Note: ${pet.name} has known allergies to: ${pet.allergies.join(", ")}. This could be related.` : ""}\n\n🏥 **Consult a vet if** itching is severe, there's hair loss, or skin appears infected.`;
  }

  if (msg.includes("fever") || msg.includes("temperature") || msg.includes("hot")) {
    return `If you suspect ${pet.name} has a fever:\n\n🌡️ **Normal temperature for ${pet.type === "dog" ? "dogs" : pet.type === "cat" ? "cats" : "pets"}:** ${pet.type === "dog" ? "101-102.5°F (38.3-39.2°C)" : pet.type === "cat" ? "100.4-102.5°F (38-39.2°C)" : "varies by species"}\n\n🏠 **At home:**\n- Keep ${pet.name} hydrated with fresh water\n- Apply cool (not cold) damp towels to ears and paws\n- Provide a cool, comfortable resting area\n- Monitor temperature every few hours\n\n🏥 **Visit a vet immediately if** temperature exceeds 104°F (40°C) or persists more than 24 hours.`;
  }

  if (msg.includes("vet") || msg.includes("doctor") || msg.includes("clinic")) {
    return `Great question! Here's when ${pet.name} should see a vet:\n\n📅 **Routine visits:** Every 6-12 months for check-ups\n${pet.nextVetVisit ? `📌 ${pet.name}'s next scheduled visit: ${new Date(pet.nextVetVisit).toLocaleDateString()}` : ""}\n\n🚨 **Emergency signs:**\n- Difficulty breathing\n- Severe vomiting/diarrhea\n- Inability to urinate\n- Seizures\n- Trauma or injury\n- Sudden collapse\n\nWould you like me to help with anything specific about ${pet.name}'s health?`;
  }

  if (msg.includes("vaccin")) {
    return `Here's a general vaccination guide for ${pet.name}:\n\n💉 **${pet.type === "dog" ? "Dog" : pet.type === "cat" ? "Cat" : "Pet"} Vaccination Schedule:**\n${pet.type === "dog" ? "- DHPP (Distemper, Hepatitis, Parainfluenza, Parvovirus)\n- Rabies\n- Bordetella (Kennel Cough)\n- Leptospirosis" : pet.type === "cat" ? "- FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia)\n- Rabies\n- FeLV (Feline Leukemia)" : "- Consult your vet for species-specific vaccines"}\n\n${pet.vaccinated ? `✅ ${pet.name} is currently vaccinated!` : `⚠️ ${pet.name}'s vaccination status needs updating. Please consult your vet.`}\n\nAlways follow your veterinarian's recommended schedule.`;
  }

  return `Thanks for reaching out about ${pet.name}! 🐾\n\nI'm your PetPal assistant. I can help with:\n\n• 🍖 Diet and nutrition advice\n• 🏠 Home remedies for common symptoms\n• 🌡️ Fever and illness guidance\n• 💉 Vaccination schedules\n• 🏥 When to visit a vet\n\nCould you tell me more about what's going on with ${pet.name}? The more details you provide, the better I can help!`;
};

const VoiceAssistant = () => {
  const navigate = useNavigate();
  const { petId } = useParams<{ petId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const pets: Pet[] = JSON.parse(localStorage.getItem("petpal_pets") || JSON.stringify(defaultPets));
  const pet = pets.find(p => p.id === petId) || pets[0];

  // Voice assistant hook
  const voice = useVoiceAssistant({
    onTranscript: (text) => {
      setInput(text);
      setVoiceState('processing');
      sendMessage(text);
    },
    onError: (error) => {
      console.error('Voice error:', error);
    },
    onListeningChange: (listening) => {
      setVoiceState(listening ? 'listening' : 'idle');
    },
    onSpeakingChange: (speaking) => {
      setVoiceState(speaking ? 'speaking' : 'idle');
    },
    timeout: 60000, // 1 minute
  });

  useEffect(() => {
    if (messages.length === 0 && pet) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `Hi there! 👋 I'm ${pet.name}'s PetPal assistant. I'm here to help with ${pet.name}'s health and care. What can I help you with today?`,
        timestamp: new Date(),
      }]);
    }
  }, [pet]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim() || !pet) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setVoiceState('processing');

    setTimeout(() => {
      const response = getAIResponse(text, pet);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
      
      // Speak the response if not muted
      if (!voice.isMuted) {
        voice.speak(response);
      } else {
        setVoiceState('idle');
      }
    }, 1200);
  };

  const toggleListening = () => {
    voice.toggleListening();
  };

  if (!pet) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NoiseOverlay />

      {/* Voice Error Alert */}
      <VoiceAlert message={voice.error} onClose={voice.clearError} />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-primary text-primary-foreground"
      >
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate("/dashboard")} className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src={petpalLogo} alt="PetPal" className="w-8 h-8 rounded-full" />
          <div className="flex-1">
            <h1 className="font-display text-xl">{pet.name}'s Health Assistant</h1>
            <p className="text-label text-[9px] opacity-60">{petTypeEmoji[pet.type]} {pet.breed}</p>
          </div>
          <div className={`w-3 h-3 rounded-full ${voice.isListening ? "bg-destructive animate-pulse" : voice.isSpeaking ? "bg-primary animate-pulse" : "bg-moss"}`} />
        </div>
      </motion.header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto pb-40">
        <div className="container max-w-4xl mx-auto px-4 py-6 space-y-4">
          {/* Voice Visualizer */}
          {voiceState !== 'idle' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex justify-center py-4"
            >
              <VoiceVisualizer state={voiceState} />
            </motion.div>
          )}

          {/* Show live transcript while listening */}
          {voice.isListening && voice.transcript && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-end"
            >
              <div className="max-w-[80%] rounded-card p-5 bg-primary/20 text-foreground border-2 border-primary border-dashed">
                <p className="text-sm italic">{voice.transcript}</p>
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-5 h-5" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-card p-5 font-body text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-card-foreground shadow-forest"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-9 h-9 rounded-full bg-secondary text-foreground flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-card rounded-card p-5 shadow-forest">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Quick Replies */}
      {messages.length <= 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-28 left-0 right-0 z-30"
        >
          <div className="container max-w-4xl mx-auto px-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  onClick={() => sendMessage(reply)}
                  className="bg-card text-foreground rounded-pill px-4 py-2 text-xs font-body font-medium shadow-forest hover:bg-secondary transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <VoiceControls
              isListening={voice.isListening}
              isMuted={voice.isMuted}
              onToggleListening={toggleListening}
              onToggleMute={voice.toggleMute}
              disabled={!voice.isSupported}
            />
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage(input)}
              placeholder={voice.isListening ? "Listening..." : `Ask about ${pet.name}'s health...`}
              className="flex-1 bg-muted border border-border rounded-pill px-5 py-3 font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={voice.isListening}
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || voice.isListening}
              className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
