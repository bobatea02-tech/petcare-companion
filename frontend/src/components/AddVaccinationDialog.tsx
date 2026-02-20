import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface AddVaccinationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petId: string;
  onSuccess: () => void;
}

export function AddVaccinationDialog({ open, onOpenChange, petId, onSuccess }: AddVaccinationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vaccine_name: "",
    vaccine_type: "",
    administered_date: new Date().toISOString().split("T")[0],
    expiration_date: "",
    veterinarian: "",
    clinic_name: "",
    batch_number: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vaccine_name.trim() || !formData.vaccine_type.trim()) {
      toast.error("Vaccine name and type are required");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/api/v1/pets/${petId}/vaccinations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          expiration_date: formData.expiration_date || null,
        }),
      });

      if (response.ok) {
        toast.success("Vaccination record added successfully");
        onSuccess();
        onOpenChange(false);
        setFormData({
          vaccine_name: "",
          vaccine_type: "",
          administered_date: new Date().toISOString().split("T")[0],
          expiration_date: "",
          veterinarian: "",
          clinic_name: "",
          batch_number: "",
          notes: "",
        });
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to add vaccination record");
      }
    } catch (error) {
      console.error("Error adding vaccination:", error);
      toast.error("Failed to add vaccination record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Vaccination Record</DialogTitle>
          <DialogDescription>Record a new vaccination for your pet</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vaccine_name">Vaccine Name *</Label>
              <Input
                id="vaccine_name"
                value={formData.vaccine_name}
                onChange={(e) => setFormData({ ...formData, vaccine_name: e.target.value })}
                placeholder="Rabies Vaccine"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vaccine_type">Vaccine Type *</Label>
              <Input
                id="vaccine_type"
                value={formData.vaccine_type}
                onChange={(e) => setFormData({ ...formData, vaccine_type: e.target.value })}
                placeholder="Rabies, DHPP, etc."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="administered_date">Administered Date *</Label>
              <Input
                id="administered_date"
                type="date"
                value={formData.administered_date}
                onChange={(e) => setFormData({ ...formData, administered_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiration_date">Expiration Date</Label>
              <Input
                id="expiration_date"
                type="date"
                value={formData.expiration_date}
                onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="veterinarian">Veterinarian</Label>
              <Input
                id="veterinarian"
                value={formData.veterinarian}
                onChange={(e) => setFormData({ ...formData, veterinarian: e.target.value })}
                placeholder="Dr. Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinic_name">Clinic Name</Label>
              <Input
                id="clinic_name"
                value={formData.clinic_name}
                onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                placeholder="Pet Care Clinic"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="batch_number">Batch Number</Label>
            <Input
              id="batch_number"
              value={formData.batch_number}
              onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
              placeholder="Vaccine batch number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about the vaccination..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Vaccination"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
