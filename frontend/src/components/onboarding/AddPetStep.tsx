import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Dog, Cat, Bird, Fish, Upload, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { PET_TYPES } from "@/lib/design-system";
import { trackEvent } from "@/lib/analytics";

// Form validation schema
const addPetSchema = z.object({
  name: z.string().min(1, "Pet name is required").max(50, "Name must be less than 50 characters"),
  type: z.enum(PET_TYPES, { required_error: "Please select a pet type" }),
  breed: z.string().min(1, "Breed is required").max(100, "Breed must be less than 100 characters"),
  age: z.coerce.number().min(0, "Age must be 0 or greater").max(50, "Age must be less than 50"),
  photo: z.instanceof(File).optional().nullable(),
});

type AddPetFormData = z.infer<typeof addPetSchema>;

interface AddPetStepProps {
  onComplete: (petId: string) => void;
}

const petTypeIcons = {
  dog: Dog,
  cat: Cat,
  bird: Bird,
  fish: Fish,
};

const petTypeLabels = {
  dog: "Dog",
  cat: "Cat",
  bird: "Bird",
  fish: "Fish",
};

const FORM_STORAGE_KEY = 'add_pet_form_data';
const PHOTO_STORAGE_KEY = 'add_pet_photo_preview';

export const AddPetStep = ({ onComplete }: AddPetStepProps) => {
  const [petError, setPetError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [photoUploadFailed, setPhotoUploadFailed] = useState(false);

  const form = useForm<AddPetFormData>({
    resolver: zodResolver(addPetSchema),
    defaultValues: {
      name: "",
      type: undefined,
      breed: "",
      age: 0,
      photo: null,
    },
  });

  // Load saved form data on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(FORM_STORAGE_KEY);
      const savedPhoto = localStorage.getItem(PHOTO_STORAGE_KEY);
      
      if (savedData) {
        const parsed = JSON.parse(savedData);
        form.reset({
          name: parsed.name || "",
          type: parsed.type || undefined,
          breed: parsed.breed || "",
          age: parsed.age || 0,
          photo: null, // File objects can't be serialized
        });
      }
      
      if (savedPhoto) {
        setPhotoPreview(savedPhoto);
      }
    } catch (error) {
      console.error('[AddPetStep] Failed to load saved form data:', error);
    }
  }, [form]);

  // Save form data to localStorage on change
  const saveFormData = (data: Partial<AddPetFormData>) => {
    try {
      const dataToSave = {
        name: data.name || form.getValues('name'),
        type: data.type || form.getValues('type'),
        breed: data.breed || form.getValues('breed'),
        age: data.age || form.getValues('age'),
        // File objects can't be serialized, but we save the preview separately
      };
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('[AddPetStep] Failed to save form data:', error);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setPetError("Photo size must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setPetError("Please upload an image file");
        return;
      }

      form.setValue("photo", file);
      setPetError(null);
      setPhotoUploadFailed(false);

      // Create preview and save to localStorage
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = reader.result as string;
        setPhotoPreview(preview);
        try {
          localStorage.setItem(PHOTO_STORAGE_KEY, preview);
        } catch (error) {
          console.error('[AddPetStep] Failed to save photo preview:', error);
        }
      };
      reader.onerror = () => {
        setPetError("Failed to read photo file");
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: AddPetFormData) => {
    setIsLoading(true);
    setPetError(null);
    setIsNetworkError(false);
    setPhotoUploadFailed(false);

    // Save form data before submission
    saveFormData(data);

    try {
      // Convert age to birth_date
      const today = new Date();
      const birthYear = today.getFullYear() - data.age;
      const birthDate = new Date(birthYear, today.getMonth(), today.getDate());
      const birthDateString = birthDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      // Create pet data object
      const petData = {
        name: data.name,
        species: data.type,
        breed: data.breed,
        birth_date: birthDateString, // Send birth_date instead of age
      };

      const response = await api.createPet(petData);

      if (response.error) {
        console.error('[AddPetStep] API Error:', response.error);
        setPetError(response.error);
        setIsLoading(false);
        return;
      }

      if (response.data) {
        // Try to upload photo if provided
        if (data.photo) {
          try {
            // Photo upload logic would go here
            // For now, we'll just log it
            console.log('[AddPetStep] Photo upload would happen here');
          } catch (photoError) {
            console.error('[AddPetStep] Photo upload failed:', photoError);
            setPhotoUploadFailed(true);
            // Continue anyway - pet creation succeeded
          }
        }
        
        // Clear saved form data on success
        localStorage.removeItem(FORM_STORAGE_KEY);
        localStorage.removeItem(PHOTO_STORAGE_KEY);
        
        // Track pet added event
        trackEvent('pet_added', {
          petType: data.type,
          petName: data.name,
          hasPhoto: !!data.photo,
          photoUploadSuccess: !photoUploadFailed,
          userId: localStorage.getItem("user_id"),
        });
        
        // Complete step
        onComplete(response.data.id || "mock-pet-id");
      }
    } catch (error: any) {
      // Handle network errors
      if (error.message?.includes('network') || error.message?.includes('fetch') || !navigator.onLine) {
        setPetError("Connection issue. Please check your internet and try again.");
        setIsNetworkError(true);
      } else {
        setPetError("An unexpected error occurred. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    const formData = form.getValues();
    onSubmit(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="font-display text-4xl text-foreground mb-2">
          Add Your First Pet
        </h2>
        <p className="font-body text-muted-foreground">
          Tell us about your furry (or feathery) friend!
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Pet Type Selector */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-body text-foreground">Pet Type</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="grid grid-cols-2 gap-4"
                  >
                    {PET_TYPES.map((type) => {
                      const Icon = petTypeIcons[type];
                      return (
                        <div key={type}>
                          <RadioGroupItem
                            value={type}
                            id={type}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={type}
                            className="flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-accent bg-olive p-6 hover:bg-sage cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-sage transition-all"
                          >
                            <Icon className="h-12 w-12 mb-2 text-primary" />
                            <span className="font-body text-foreground">
                              {petTypeLabels[type]}
                            </span>
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Pet Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-body text-foreground">Pet Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Buddy"
                    className="rounded-[2.5rem] bg-olive border-accent font-body"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Breed */}
          <FormField
            control={form.control}
            name="breed"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-body text-foreground">Breed</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Golden Retriever"
                    className="rounded-[2.5rem] bg-olive border-accent font-body"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Age */}
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-body text-foreground">Age (years)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="3"
                    className="rounded-[2.5rem] bg-olive border-accent font-body"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Photo Upload */}
          <FormField
            control={form.control}
            name="photo"
            render={() => (
              <FormItem>
                <FormLabel className="font-body text-foreground">
                  Photo (Optional)
                </FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="photo-upload"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-accent border-dashed rounded-[2.5rem] cursor-pointer bg-olive hover:bg-sage transition-colors"
                      >
                        {photoPreview ? (
                          <img
                            src={photoPreview}
                            alt="Pet preview"
                            className="h-full w-full object-cover rounded-[2.5rem]"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground font-body">
                              Click to upload photo
                            </p>
                            <p className="text-xs text-muted-foreground font-body">
                              PNG, JPG up to 5MB
                            </p>
                          </div>
                        )}
                        <input
                          id="photo-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          disabled={isLoading}
                        />
                      </label>
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Error Message */}
          {petError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-[2.5rem]"
            >
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <p className="font-body text-sm text-destructive">{petError}</p>
                {isNetworkError && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="mt-2 rounded-[2.5rem] border-destructive text-destructive hover:bg-destructive/10"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Retry
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* Photo Upload Warning */}
          {photoUploadFailed && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-[2.5rem]"
            >
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <p className="font-body text-sm text-yellow-600">
                Pet added successfully, but photo upload failed. You can add a photo later.
              </p>
            </motion.div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full rounded-[2.5rem] bg-primary text-primary-foreground font-body py-6 text-lg hover:opacity-90 transition-opacity"
            disabled={isLoading}
          >
            {isLoading ? "Adding Pet..." : "Add Pet"}
          </Button>
        </form>
      </Form>
    </motion.div>
  );
};
