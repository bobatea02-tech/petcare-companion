import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NoiseOverlay } from "@/components/NoiseOverlay";
import { useNavigate, useParams } from "react-router-dom";
import { Pet, defaultPets, petTypeEmoji } from "@/lib/petData";
import { ArrowLeft, Send, Bot, User, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import petpalLogo from "@/assets/petpal-logo.png";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { VoiceVisualizer, VoiceControls, VoiceAlert } from "@/components/voice";
import { VoiceDebugPanel } from "@/components/VoiceDebugPanel";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

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

const VoiceAssistant = () => {
  const navigate = useNavigate();
  const { petId } = useParams<{ petId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [voiceState, setVoiceState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [questionsRemaining, setQuestionsRemaining] = useState<number>(5);
  const [lastResponse, setLastResponse] = useState<any>(null); // For debug panel
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
        content: `Hi there! 👋 I'm JoJo, ${pet.name}'s AI pet care assistant. I'm here to help with ${pet.name}'s health and care. What can I help you with today?`,
        timestamp: new Date(),
      }]);
    }
  }, [pet]);

  // Load quota on mount
  useEffect(() => {
    const loadQuota = async () => {
      try {
        const response = await api.getJojoQuota();
        if (response.data) {
          setQuestionsRemaining(response.data.questions_remaining);
        }
      } catch (error) {
        console.error("Failed to load quota:", error);
      }
    };
    loadQuota();
  }, []);

  const clearConversation = async () => {
    if (!conversationId) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `Hi there! 👋 I'm JoJo, ${pet.name}'s AI pet care assistant. I'm here to help with ${pet.name}'s health and care. What can I help you with today?`,
        timestamp: new Date(),
      }]);
      return;
    }

    try {
      await api.clearJojoConversation(conversationId);
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `Hi there! 👋 I'm JoJo, ${pet.name}'s AI pet care assistant. I'm here to help with ${pet.name}'s health and care. What can I help you with today?`,
        timestamp: new Date(),
      }]);
      setConversationId(null);
      toast({
        title: "Conversation Cleared",
        description: "Your chat history with JoJo has been cleared.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear conversation.",
        variant: "destructive",
      });
    }
  };

  const handleJojoAction = (actionType: string, actionDetails: any) => {
    try {
      if (actionType === "grooming_complete") {
        // Mark grooming task as complete in localStorage
        const tasks = JSON.parse(localStorage.getItem(`grooming_tasks_${actionDetails.pet_id}`) || "[]");
        const today = new Date().toISOString().split('T')[0];
        
        // Find and mark today's task as complete
        const updatedTasks = tasks.map((task: any) => {
          const taskDate = new Date(task.scheduledDate).toISOString().split('T')[0];
          if (task.taskType === actionDetails.grooming_type && taskDate === today && !task.completed) {
            return {
              ...task,
              completed: true,
              completedDate: new Date().toISOString()
            };
          }
          return task;
        });
        
        localStorage.setItem(`grooming_tasks_${actionDetails.pet_id}`, JSON.stringify(updatedTasks));
        
        // Mark as done in today's reminders
        const completed = JSON.parse(localStorage.getItem("completed_reminders") || "[]");
        completed.push({
          id: `grooming-${actionDetails.grooming_type}-${Date.now()}`,
          type: "grooming",
          completedAt: new Date().toISOString(),
          date: today
        });
        localStorage.setItem("completed_reminders", JSON.stringify(completed));
      }
      
      if (actionType === "medication_taken") {
        // Mark medication as taken in today's reminders
        const today = new Date().toISOString().split('T')[0];
        const completed = JSON.parse(localStorage.getItem("completed_reminders") || "[]");
        completed.push({
          id: `medication-${Date.now()}`,
          type: "medication",
          completedAt: new Date().toISOString(),
          date: today
        });
        localStorage.setItem("completed_reminders", JSON.stringify(completed));
      }
      
      if (actionType === "reminder_created" || actionType === "appointment_request") {
        // Add custom event to calendar
        const customEvents = JSON.parse(localStorage.getItem(`custom_events_${actionDetails.pet_id}`) || "[]");
        customEvents.push({
          id: Date.now().toString(),
          petId: actionDetails.pet_id,
          title: actionDetails.reminder_text || "Appointment",
          description: actionDetails.reminder_text || "",
          date: actionDetails.reminder_date || actionDetails.requested_date || new Date().toISOString().split('T')[0],
          type: "custom"
        });
        localStorage.setItem(`custom_events_${actionDetails.pet_id}`, JSON.stringify(customEvents));
      }
    } catch (error) {
      console.error("Error handling JoJo action:", error);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
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

    try {
      // Call JoJo API
      const response = await api.jojoChat(text, conversationId || undefined, pet.name);

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        setIsTyping(false);
        setVoiceState('idle');
        return;
      }

      if (response.data) {
        // Store for debug panel
        setLastResponse(response.data);
        
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.data.response,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, assistantMsg]);
        setConversationId(response.data.conversation_id);
        setQuestionsRemaining(response.data.questions_remaining);
        setIsTyping(false);

        // Handle actions taken by JoJo
        if (response.data.action_taken && response.data.action_details) {
          handleJojoAction(response.data.action_type, response.data.action_details);
        }

        // Show quota warning if low
        if (response.data.questions_remaining <= 1) {
          toast({
            title: "Question Limit",
            description: `You have ${response.data.questions_remaining} question${response.data.questions_remaining === 1 ? "" : "s"} remaining this hour.`,
          });
        }
        
        // Automatically speak the response if not muted and speak_response is true
        const shouldSpeak = response.data.speak_response !== false; // Default to true
        console.log('Voice Response Debug:', {
          speak_response: response.data.speak_response,
          needs_clarification: response.data.needs_clarification,
          isMuted: voice.isMuted,
          shouldSpeak,
          response: response.data.response
        });
        
        if (!voice.isMuted && shouldSpeak) {
          console.log('Speaking response:', response.data.response);
          voice.speak(response.data.response);
        } else {
          console.log('Not speaking - muted:', voice.isMuted, 'shouldSpeak:', shouldSpeak);
          setVoiceState('idle');
        }
        
        // Show special indicator for clarification questions
        if (response.data.needs_clarification) {
          console.log('Clarification needed - showing toast');
          toast({
            title: "Need More Info",
            description: "JoJo needs clarification. Please respond to the question.",
            duration: 5000,
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setIsTyping(false);
      setVoiceState('idle');
    }
  };

  const toggleListening = () => {
    voice.toggleListening();
  };

  if (!pet) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NoiseOverlay />

      {/* Debug Panel (Development Only) */}
      <VoiceDebugPanel lastResponse={lastResponse} />

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
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center"
          >
            <Sparkles className="w-6 h-6" />
          </motion.div>
          <div className="flex-1">
            <h1 className="font-display text-xl">JoJo - {pet.name}'s Assistant</h1>
            <p className="text-label text-[9px] opacity-60">{petTypeEmoji[pet.type]} {pet.breed}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {questionsRemaining} left
          </Badge>
          {messages.length > 1 && (
            <button
              onClick={clearConversation}
              className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary-foreground/20 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
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
