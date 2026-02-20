import { useState } from "react";
import { Pet, petTypeEmoji } from "@/lib/petData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

interface AddPetDialogProps {
  onAdd: (pet: Pet) => void;
}

// Breed lists by pet type
const breedsByType: Record<string, string[]> = {
  dog: [
    "Golden Retriever",
    "Labrador Retriever",
    "German Shepherd",
    "Bulldog",
    "Beagle",
    "Poodle",
    "Rottweiler",
    "Yorkshire Terrier",
    "Boxer",
    "Dachshund",
    "Siberian Husky",
    "Great Dane",
    "Doberman Pinscher",
    "Shih Tzu",
    "Boston Terrier",
    "Pomeranian",
    "Chihuahua",
    "Pug",
    "Cocker Spaniel",
    "Mixed Breed"
  ],
  cat: [
    "Persian",
    "Maine Coon",
    "Siamese",
    "Ragdoll",
    "British Shorthair",
    "Abyssinian",
    "Birman",
    "Oriental Shorthair",
    "Sphynx",
    "Devon Rex",
    "American Shorthair",
    "Scottish Fold",
    "Exotic Shorthair",
    "Bengal",
    "Russian Blue",
    "Norwegian Forest Cat",
    "Domestic Shorthair",
    "Domestic Longhair",
    "Mixed Breed"
  ],
  bird: [
    "Parakeet",
    "Cockatiel",
    "Lovebird",
    "Canary",
    "Finch",
    "Parrot",
    "Macaw",
    "Cockatoo",
    "Conure",
    "African Grey",
    "Budgerigar",
    "Other"
  ],
  rabbit: [
    "Holland Lop",
    "Netherland Dwarf",
    "Mini Rex",
    "Lionhead",
    "Flemish Giant",
    "English Angora",
    "Dutch",
    "Californian",
    "New Zealand",
    "Mixed Breed"
  ],
  other: [
    "Hamster",
    "Guinea Pig",
    "Ferret",
    "Chinchilla",
    "Hedgehog",
    "Turtle",
    "Fish",
    "Reptile",
    "Other"
  ]
};

export const AddPetDialog = ({ onAdd }: AddPetDialogProps) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "dog" as Pet["type"],
    breed: "",
    gender: "male" as Pet["gender"],
    age: "",
    ageUnit: "years" as Pet["ageUnit"],
    weight: "",
    allergies: "",
    behavior: "",
    notes: "",
    avatar: "",
    vaccinated: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pet: Pet = {
      id: Date.now().toString(),
      name: form.name,
      type: form.type,
      breed: form.breed,
      gender: form.gender,
      age: Number(form.age),
      ageUnit: form.ageUnit,
      weight: Number(form.weight),
      allergies: form.allergies ? form.allergies.split(",").map(a => a.trim()) : [],
      behavior: form.behavior,
      avatar: form.avatar,
      vaccinated: form.vaccinated,
      lastVetVisit: "",
      nextVetVisit: "",
      healthScore: 75,
      notes: form.notes,
      healthLogs: [],
      medications: [],
      feedingSchedule: [],
      vetAppointments: [],
    };
    onAdd(pet);
    setOpen(false);
    setForm({ name: "", type: "dog", breed: "", gender: "male", age: "", ageUnit: "years", weight: "", allergies: "", behavior: "", notes: "", avatar: "", vaccinated: false });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex flex-col items-center justify-center w-24 h-24 rounded-card border-2 border-dashed border-accent hover:border-primary transition-all duration-500 cursor-pointer group">
          <Plus className="w-8 h-8 text-accent group-hover:text-primary transition-colors" />
          <span className="text-label text-[9px] mt-1 text-muted-foreground">Add Pet</span>
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-card bg-cream border-accent max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl text-foreground">Add New Pet</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="flex justify-center">
            <ImageUpload currentImage={form.avatar} onImageSelect={(img) => setForm(f => ({ ...f, avatar: img }))} size="lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-label text-muted-foreground">Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="rounded-pill bg-olive border-accent mt-1" />
            </div>
            <div>
              <Label className="text-label text-muted-foreground">Type</Label>
              <Select 
                value={form.type} 
                onValueChange={v => setForm(f => ({ ...f, type: v as Pet["type"], breed: "" }))}
              >
                <SelectTrigger className="rounded-pill bg-olive border-accent mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-card bg-cream">
                  {Object.entries(petTypeEmoji).map(([type, emoji]) => (
                    <SelectItem key={type} value={type}>{emoji} {type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-label text-muted-foreground">Breed</Label>
              <Select 
                value={form.breed} 
                onValueChange={v => setForm(f => ({ ...f, breed: v }))}
              >
                <SelectTrigger className="rounded-pill bg-olive border-accent mt-1">
                  <SelectValue placeholder="Select breed" />
                </SelectTrigger>
                <SelectContent className="rounded-card bg-cream max-h-60">
                  {breedsByType[form.type]?.map((breed) => (
                    <SelectItem key={breed} value={breed}>{breed}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-label text-muted-foreground">Gender</Label>
              <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v as Pet["gender"] }))}>
                <SelectTrigger className="rounded-pill bg-olive border-accent mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-card bg-cream">
                  <SelectItem value="male">♂ Male</SelectItem>
                  <SelectItem value="female">♀ Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-label text-muted-foreground">Age</Label>
              <div className="flex gap-2 mt-1">
                <Input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} required className="rounded-pill bg-olive border-accent flex-1" />
                <Select value={form.ageUnit} onValueChange={v => setForm(f => ({ ...f, ageUnit: v as Pet["ageUnit"] }))}>
                  <SelectTrigger className="rounded-pill bg-olive border-accent w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-card bg-cream">
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="years">Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-label text-muted-foreground">Weight (kg)</Label>
              <Input type="number" step="0.1" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} className="rounded-pill bg-olive border-accent mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-label text-muted-foreground">Allergies (comma separated)</Label>
            <Input value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} placeholder="e.g. Chicken, Pollen" className="rounded-pill bg-olive border-accent mt-1" />
          </div>
          <div>
            <Label className="text-label text-muted-foreground">Behavior</Label>
            <Input value={form.behavior} onChange={e => setForm(f => ({ ...f, behavior: e.target.value }))} placeholder="e.g. Playful, calm, energetic" className="rounded-pill bg-olive border-accent mt-1" />
          </div>
          <div className="flex items-center justify-between py-2 px-1">
            <Label className="text-label text-foreground font-semibold">Vaccinated</Label>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, vaccinated: !f.vaccinated }))}
              className={`w-14 h-8 rounded-pill transition-colors duration-300 relative flex-shrink-0 ${form.vaccinated ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`absolute top-1 w-6 h-6 rounded-full bg-card shadow-md transition-transform duration-300 ${form.vaccinated ? "translate-x-7" : "translate-x-1"}`} />
            </button>
          </div>
          <div>
            <Label className="text-label text-muted-foreground">Notes</Label>
            <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any extra info..." className="rounded-pill bg-olive border-accent mt-1" />
          </div>
          <Button type="submit" className="w-full rounded-pill font-body text-label tracking-[0.2em] py-6 bg-primary text-primary-foreground hover:bg-primary/90">
            ADD PET
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
