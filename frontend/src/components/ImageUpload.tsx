import { useRef } from "react";
import { Camera } from "lucide-react";
import { motion } from "framer-motion";

interface ImageUploadProps {
  currentImage?: string;
  onImageSelect: (base64: string) => void;
  size?: "sm" | "lg";
}

export const ImageUpload = ({ currentImage, onImageSelect, size = "sm" }: ImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      onImageSelect(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const sizeClasses = size === "lg" ? "w-28 h-28" : "w-20 h-20";

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => inputRef.current?.click()}
        className={`${sizeClasses} rounded-full overflow-hidden border-2 border-dashed border-accent hover:border-primary transition-colors relative group cursor-pointer bg-muted`}
      >
        {currentImage ? (
          <img src={currentImage} alt="Pet" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="w-5 h-5 text-background" />
        </div>
      </motion.button>
      <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
        {currentImage ? "Change Photo" : "Add Photo"}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
