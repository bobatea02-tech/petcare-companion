import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface AddWeightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petId: string;
  onSuccess: () => void;
}

export function AddWeightDialog({ open, onOpenChange, petId, onSuccess }: AddWeightDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    weight: "",
    date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const weightValue = parseFloat(formData.weight);
    if (isNaN(weightValue) || weightValue <= 0) {
      toast.error("Please enter a valid weight");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Add weight record using new API
      const response = await fetch(`http://localhost:8000/api/v1/pets/${petId}/weight`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          weight: weightValue,
          weight_unit: "lbs",
          measurement_date: formData.date,
          source: "Manual Entry",
        }),
      });

      if (response.ok) {
        toast.success("Weight recorded successfully");
        onSuccess();
        onOpenChange(false);
        setFormData({
          weight: "",
          date: new Date().toISOString().split("T")[0],
        });
      } else {
        const error = await response.json();
        toast.error(error.detail || "Failed to record weight");
      }
    } catch (error) {
      console.error("Error recording weight:", error);
      toast.error("Failed to record weight");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Weight Entry</DialogTitle>
          <DialogDescription>Record your pet's current weight</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (lbs) *</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              placeholder="Enter weight in pounds"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Weight"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
