import { useState } from "react";
import { Pet, petTypeEmoji } from "@/lib/petData";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

interface EditPetDialogProps {
  pet: Pet;
  onUpdate: (pet: Pet) => void;
}

export const EditPetDialog = ({ pet, onUpdate }: EditPetDialogProps) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: pet.name,
    type: pet.type,
    breed: pet.breed,
    gender: pet.gender,
    age: String(pet.age),
    ageUnit: pet.ageUnit,
    weight: String(pet.weight),
    allergies: pet.allergies.join(", "),
    behavior: pet.behavior,
    notes: pet.notes,
    vaccinated: pet.vaccinated,
    avatar: pet.avatar,
  });

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setForm({
        name: pet.name,
        type: pet.type,
        breed: pet.breed,
        gender: pet.gender,
        age: String(pet.age),
        ageUnit: pet.ageUnit,
        weight: String(pet.weight),
        allergies: pet.allergies.join(", "),
        behavior: pet.behavior,
        notes: pet.notes,
        vaccinated: pet.vaccinated,
        avatar: pet.avatar,
      });
    }
    setOpen(isOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedPet: Pet = {
      ...pet,
      name: form.name,
      type: form.type as Pet["type"],
      breed: form.breed,
      gender: form.gender as Pet["gender"],
      age: Number(form.age),
      ageUnit: form.ageUnit as Pet["ageUnit"],
      weight: Number(form.weight),
      allergies: form.allergies ? form.allergies.split(",").map(a => a.trim()) : [],
      behavior: form.behavior,
      notes: form.notes,
      vaccinated: form.vaccinated,
      avatar: form.avatar || pet.avatar,
    };
    onUpdate(updatedPet);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <button className="w-10 h-10 rounded-full bg-card/80 backdrop-blur text-foreground flex items-center justify-center hover:scale-110 hover:bg-card transition-all duration-300 shadow-forest">
          <Pencil className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="rounded-card bg-cream border-accent max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl text-foreground">Edit {pet.name}</DialogTitle>
        </DialogHeader>
         <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="flex justify-center">
            <ImageUpload currentImage={form.avatar || pet.avatar} onImageSelect={(img) => setForm(f => ({ ...f, avatar: img }))} size="lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-label text-muted-foreground">Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="rounded-pill bg-olive border-accent mt-1" />
            </div>
            <div>
              <Label className="text-label text-muted-foreground">Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as Pet["type"] }))}>
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
              <Input value={form.breed} onChange={e => setForm(f => ({ ...f, breed: e.target.value }))} required className="rounded-pill bg-olive border-accent mt-1" />
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
          <div className="flex items-center justify-between py-2">
            <Label className="text-label text-muted-foreground">Vaccinated</Label>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, vaccinated: !f.vaccinated }))}
              className={`w-14 h-8 rounded-pill transition-colors duration-300 relative flex-shrink-0 ${form.vaccinated ? "bg-primary" : "bg-input"}`}
            >
              <span className={`absolute top-1 w-6 h-6 rounded-full bg-background shadow-md transition-transform duration-300 ${form.vaccinated ? "translate-x-7" : "translate-x-1"}`} />
            </button>
          </div>
          <div>
            <Label className="text-label text-muted-foreground">Notes</Label>
            <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any extra info..." className="rounded-pill bg-olive border-accent mt-1" />
          </div>
          <Button type="submit" className="w-full rounded-pill font-body text-label tracking-[0.2em] py-6">
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
