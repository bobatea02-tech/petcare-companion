import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Sparkles } from "lucide-react";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { VoiceVisualizer } from "@/components/voice";
import { api } from "@/lib/api";
import { Pet } from "@/lib/petData";
import { toast } from "sonner";

interface JojoVoiceButtonProps {
  pets: Pet[];
}

export const JojoVoiceButton = ({ pets }: JojoVoiceButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<string>("");

  const voice = useVoiceAssistant({
    onTranscript: async (text) => {
      setIsProcessing(true);
      await handleVoiceCommand(text);
      setIsProcessing(false);
    },
    onError: (error) => {
      console.error('Voice error:', error);
      toast.error("Voice recognition error. Please try again.");
    },
    onListeningChange: (listening) => {
      if (!listening && !isProcessing) {
        // Auto-close after response is spoken
        setTimeout(() => {
          setIsOpen(false);
          setResponse("");
        }, 2000);
      }
    },
    onSpeakingChange: (speaking) => {
      // Keep open while speaking
    },
    timeout: 60000,
  });

  const handleVoiceCommand = async (text: string) => {
    try {
      // Use first pet as default
      const pet = pets[0];
      if (!pet) {
        toast.error("Please add a pet first");
        return;
      }

      // Send to JoJo
      const result = await api.jojoChat(text, undefined, pet.name);
      
      if (result.data) {
        setResponse(result.data.response);
        
        // Automatically speak the response if not muted and speak_response is true
        const shouldSpeak = result.data.speak_response !== false; // Default to true
        if (!voice.isMuted && shouldSpeak) {
          voice.speak(result.data.response);
        }

        // Show action confirmation if action was taken
        if (result.data.action_taken) {
          toast.success("Action completed!", {
            description: result.data.response,
          });
        }
        
        // Show clarification prompt if needed
        if (result.data.needs_clarification) {
          toast.info("Need more info", {
            description: result.data.response,
            duration: 5000,
          });
          // Keep listening for follow-up
          setTimeout(() => {
            if (isOpen) {
              voice.startListening();
            }
          }, 3000);
        }
      }
    } catch (error) {
      console.error("Error processing voice command:", error);
      toast.error("Failed to process command");
    }
  };

  const toggleVoice = () => {
    if (isOpen) {
      voice.stopListening();
      setIsOpen(false);
      setResponse("");
    } else {
      setIsOpen(true);
      voice.startListening();
    }
  };

  return (
    <>
      {/* Floating JoJo Button */}
      <motion.button
        onClick={toggleVoice}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`fixed bottom-28 right-6 z-50 w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-colors ${
          isOpen
            ? "bg-destructive text-destructive-foreground"
            : "bg-primary text-primary-foreground"
        }`}
        title="Talk to JoJo"
        data-tour="voice-assistant"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="mic"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="relative"
            >
              <Sparkles className="w-6 h-6" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-primary-foreground/20"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Voice Interface Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-48 right-6 z-50 w-80 bg-card rounded-card shadow-2xl border-2 border-primary p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-display text-lg text-foreground">Talk to JoJo</h3>
            </div>

            {/* Voice Visualizer */}
            {voice.isListening && (
              <div className="mb-4">
                <VoiceVisualizer isListening={voice.isListening} />
              </div>
            )}

            {/* Status */}
            <div className="text-center mb-4">
              {voice.isListening && (
                <p className="text-sm text-primary animate-pulse">Listening...</p>
              )}
              {isProcessing && (
                <p className="text-sm text-accent animate-pulse">Processing...</p>
              )}
              {voice.isSpeaking && (
                <p className="text-sm text-sage animate-pulse">Speaking...</p>
              )}
              {!voice.isListening && !isProcessing && !voice.isSpeaking && (
                <p className="text-sm text-muted-foreground">Ready to listen</p>
              )}
            </div>

            {/* Response */}
            {response && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-muted rounded-card p-3 text-sm text-foreground"
              >
                {response}
              </motion.div>
            )}

            {/* Instructions */}
            <div className="mt-4 text-xs text-muted-foreground text-center">
              <p>Try saying:</p>
              <p className="mt-1">"I groomed Whiskers today"</p>
              <p>"Remind me to give medication"</p>
              <p>"Schedule a vet appointment"</p>
            </div>

            {/* Mute Toggle */}
            <div className="mt-4 flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={voice.toggleMute}
                className="flex items-center gap-2 px-3 py-1.5 rounded-pill bg-secondary/20 text-secondary-foreground text-xs"
              >
                {voice.isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                {voice.isMuted ? "Unmute" : "Mute"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
