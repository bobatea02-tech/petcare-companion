import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface AddHealthRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petId: string;
  onSuccess: () => void;
}

export function AddHealthRecordDialog({ open, onOpenChange, petId, onSuccess }: AddHealthRecordDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    record_date: new Date().toISOString().split("T")[0],
    record_type: "checkup",
    description: "",
    veterinarian: "",
    clinic_name: "",
    diagnosis: "",
    treatment_plan: "",
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
      const response = await fetch("http://localhost:8000/api/v1/health-records/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pet_id: petId,
          ...formData,
        }),
      });

      if (response.ok) {
        toast.success("Health record added successfully");
        onSuccess();
        onOpenChange(false);
        setFormData({
          record_date: new Date().toISOString().split("T")[0],
          record_type: "checkup",
          description: "",
          veterinarian: "",
          clinic_name: "",
          diagnosis: "",
          treatment_plan: "",
        });
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to add health record");
      }
    } catch (error) {
      console.error("Error adding health record:", error);
      toast.error("Failed to add health record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Health Record</DialogTitle>
          <DialogDescription>Record a new health event for your pet</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="record_date">Date</Label>
              <Input
                id="record_date"
                type="date"
                value={formData.record_date}
                onChange={(e) => setFormData({ ...formData, record_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="record_type">Type</Label>
              <Select
                value={formData.record_type}
                onValueChange={(value) => setFormData({ ...formData, record_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkup">Checkup</SelectItem>
                  <SelectItem value="symptom_log">Symptom Log</SelectItem>
                  <SelectItem value="vaccination">Vaccination</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="diagnostic">Diagnostic</SelectItem>
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
              placeholder="Describe the health event..."
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
