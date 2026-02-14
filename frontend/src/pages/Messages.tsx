import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { NoiseOverlay } from "@/components/NoiseOverlay";
import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import petpalLogo from "@/assets/petpal-logo.png";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: number;
}

const botResponses = [
  "That's great to hear about your pet! 🐾",
  "Have you tried adjusting their diet? Sometimes that helps.",
  "I'd recommend scheduling a vet visit for that.",
  "Sounds like your furry friend is doing well! 😊",
  "Regular exercise is key for a happy pet!",
  "Make sure they're getting enough water throughout the day.",
  "That's totally normal behavior for their breed!",
  "You're such a caring pet parent! Your pet is lucky to have you. ❤️",
];

const Messages = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem("petpal_user") || "Pet Parent";
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("petpal_messages");
    return saved
      ? JSON.parse(saved)
      : [
          { id: "1", text: "Hey there! 👋 Welcome to PetPal Chat. Ask me anything about pet care!", sender: "bot", timestamp: Date.now() - 60000 },
        ];
  });
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem("petpal_messages", JSON.stringify(messages));
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), text: input, sender: "user", timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponses[Math.floor(Math.random() * botResponses.length)],
        sender: "bot",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 800 + Math.random() * 1200);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background flex flex-col">
      <NoiseOverlay />
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.1 }} onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            <img src={petpalLogo} alt="PetPal" className="w-8 h-8 rounded-full" />
            <div>
              <span className="font-display text-xl text-foreground">PetPal Chat</span>
              <p className="text-[10px] text-muted-foreground font-body">Demo · Bot responses</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 container max-w-2xl mx-auto px-4 py-4 overflow-y-auto pb-36 space-y-3">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-card px-5 py-3 text-sm font-body ${
                msg.sender === "user"
                  ? "bg-primary text-cream rounded-br-lg"
                  : "bg-card text-foreground shadow-forest rounded-bl-lg"
              }`}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </main>

      <div className="fixed bottom-20 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="rounded-pill flex-1"
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={sendMessage}
            className="w-10 h-10 rounded-full bg-primary text-cream flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
      <BottomNav />
    </motion.div>
  );
};

export default Messages;
