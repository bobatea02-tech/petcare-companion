import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface AddMedicalHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petId: string;
  onSuccess: () => void;
}

export function AddMedicalHistoryDialog({ open, onOpenChange, petId, onSuccess }: AddMedicalHistoryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split("T")[0],
    entry_type: "checkup",
    description: "",
    veterinarian: "",
    clinic_name: "",
    diagnosis: "",
    treatment_plan: "",
    follow_up_required: false,
    follow_up_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      toast.error("Description is required");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/api/v1/pets/${petId}/medical-history`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          follow_up_date: formData.follow_up_date || null,
        }),
      });

      if (response.ok) {
        toast.success("Medical history entry added successfully");
        onSuccess();
        onOpenChange(false);
        setFormData({
          entry_date: new Date().toISOString().split("T")[0],
          entry_type: "checkup",
          description: "",
          veterinarian: "",
          clinic_name: "",
          diagnosis: "",
          treatment_plan: "",
          follow_up_required: false,
          follow_up_date: "",
        });
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to add medical history entry");
      }
    } catch (error) {
      console.error("Error adding medical history:", error);
      toast.error("Failed to add medical history entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Medical History Entry</DialogTitle>
          <DialogDescription>Record a medical event or visit</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entry_date">Date *</Label>
              <Input
                id="entry_date"
                type="date"
                value={formData.entry_date}
                onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry_type">Type *</Label>
              <Select
                value={formData.entry_type}
                onValueChange={(value) => setFormData({ ...formData, entry_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkup">Checkup</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="vaccination">Vaccination</SelectItem>
                  <SelectItem value="dental">Dental</SelectItem>
                  <SelectItem value="diagnostic">Diagnostic</SelectItem>
                  <SelectItem value="treatment">Treatment</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the medical event..."
              required
              rows={3}
            />
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
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Textarea
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              placeholder="Medical diagnosis if applicable..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="treatment_plan">Treatment Plan</Label>
            <Textarea
              id="treatment_plan"
              value={formData.treatment_plan}
              onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
              placeholder="Recommended treatment..."
              rows={2}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="follow_up_required"
                checked={formData.follow_up_required}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, follow_up_required: checked as boolean })
                }
              />
              <Label htmlFor="follow_up_required" className="cursor-pointer">
                Follow-up required
              </Label>
            </div>

            {formData.follow_up_required && (
              <div className="space-y-2">
                <Label htmlFor="follow_up_date">Follow-up Date</Label>
                <Input
                  id="follow_up_date"
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
