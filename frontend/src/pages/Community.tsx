import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NoiseOverlay } from "@/components/NoiseOverlay";
import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Send, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import petpalLogo from "@/assets/petpal-logo.png";

interface Post {
  id: string;
  author: string;
  content: string;
  petName?: string;
  timestamp: number;
  likes: number;
  liked: boolean;
  comments: { author: string; text: string; timestamp: number }[];
}

const demoPosts: Post[] = [
  {
    id: "demo1",
    author: "Sarah K.",
    content: "Buddy just learned to shake hands! 🐾 So proud of my golden boy!",
    petName: "Buddy",
    timestamp: Date.now() - 3600000,
    likes: 12,
    liked: false,
    comments: [{ author: "Mike T.", text: "That's amazing! How long did it take?", timestamp: Date.now() - 1800000 }],
  },
  {
    id: "demo2",
    author: "James L.",
    content: "Anyone know good hypoallergenic cat food brands? Whiskers has been having some tummy issues.",
    petName: "Whiskers",
    timestamp: Date.now() - 7200000,
    likes: 5,
    liked: false,
    comments: [],
  },
  {
    id: "demo3",
    author: "Emily R.",
    content: "Morning walk with Luna 🌅 Nothing beats fresh air with your best friend!",
    petName: "Luna",
    timestamp: Date.now() - 14400000,
    likes: 24,
    liked: false,
    comments: [
      { author: "Anna P.", text: "Where do you usually walk? Looking for dog-friendly trails!", timestamp: Date.now() - 10800000 },
    ],
  },
];

const Community = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem("petpal_user") || "Pet Parent";
  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem("petpal_community");
    return saved ? JSON.parse(saved) : demoPosts;
  });
  const [newPost, setNewPost] = useState("");

  useEffect(() => {
    localStorage.setItem("petpal_community", JSON.stringify(posts));
  }, [posts]);

  const handlePost = () => {
    if (!newPost.trim()) return;
    const post: Post = {
      id: Date.now().toString(),
      author: userName,
      content: newPost,
      timestamp: Date.now(),
      likes: 0,
      liked: false,
      comments: [],
    };
    setPosts([post, ...posts]);
    setNewPost("");
  };

  const toggleLike = (postId: string) => {
    setPosts(posts.map((p) =>
      p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
  };

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-background pb-24">
      <NoiseOverlay />
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            <img src={petpalLogo} alt="PetPal" className="w-8 h-8 rounded-full" />
            <span className="font-display text-2xl text-foreground">Community</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Create Post */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-card p-5 shadow-forest space-y-3"
        >
          <Input
            placeholder="Share something about your pet..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePost()}
            className="rounded-pill bg-muted border-accent"
          />
          <div className="flex justify-end">
            <Button onClick={handlePost} size="sm" className="rounded-pill gap-2">
              <Send className="w-3 h-3" /> Post
            </Button>
          </div>
        </motion.div>

        {/* Feed */}
        <AnimatePresence>
          {posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-card p-6 shadow-forest space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-display text-lg text-primary">
                    {post.author[0]}
                  </div>
                  <div>
                    <p className="font-body font-semibold text-foreground text-sm">{post.author}</p>
                    <p className="text-[10px] text-muted-foreground font-body">{timeAgo(post.timestamp)}</p>
                  </div>
                </div>
                {post.petName && (
                  <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-pill bg-secondary text-secondary-foreground">
                    🐾 {post.petName}
                  </span>
                )}
              </div>
              <p className="font-body text-foreground text-sm leading-relaxed">{post.content}</p>
              <div className="flex items-center gap-4 pt-2 border-t border-border">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center gap-1.5 text-sm font-body ${post.liked ? "text-destructive" : "text-muted-foreground"}`}
                >
                  <Heart className={`w-4 h-4 ${post.liked ? "fill-destructive" : ""}`} />
                  {post.likes}
                </motion.button>
                <span className="flex items-center gap-1.5 text-sm font-body text-muted-foreground">
                  <MessageCircle className="w-4 h-4" />
                  {post.comments.length}
                </span>
              </div>
              {post.comments.length > 0 && (
                <div className="space-y-2 pl-4 border-l-2 border-accent/20">
                  {post.comments.map((c, ci) => (
                    <div key={ci} className="text-sm font-body">
                      <span className="font-semibold text-foreground">{c.author}</span>{" "}
                      <span className="text-muted-foreground">{c.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </main>
      <BottomNav />
    </motion.div>
  );
};

export default Community;
