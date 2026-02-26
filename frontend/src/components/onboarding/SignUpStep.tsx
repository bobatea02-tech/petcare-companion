import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Mail, Lock, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { api } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

// Form validation schema
const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

interface SignUpStepProps {
  onComplete: (userId: string, email: string) => void;
}

const FORM_STORAGE_KEY = 'signup_form_data';

export const SignUpStep = ({ onComplete }: SignUpStepProps) => {
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [showLoginLink, setShowLoginLink] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  // Load saved form data on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(FORM_STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        form.reset({
          email: parsed.email || "",
          password: "", // Never restore password for security
          name: parsed.name || "",
        });
      }
    } catch (error) {
      console.error('[SignUpStep] Failed to load saved form data:', error);
    }
  }, [form]);

  // Save form data to localStorage on change (except password)
  const saveFormData = (data: Partial<SignUpFormData>) => {
    try {
      const dataToSave = {
        email: data.email || form.getValues('email'),
        name: data.name || form.getValues('name'),
        // Never save password
      };
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('[SignUpStep] Failed to save form data:', error);
    }
  };

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    setAuthError(null);
    setIsNetworkError(false);

    // Save form data before submission
    saveFormData(data);

    try {
      const response = await api.register(data.email, data.password, data.name);
      
      if (response.error) {
        // Display specific authentication error messages
        if (response.error.includes('already exists') || response.error.includes('already registered')) {
          setAuthError("This email is already registered. Please sign in instead.");
          setShowLoginLink(true);
        } else if (response.error.includes('invalid email')) {
          setAuthError("Please enter a valid email address.");
          setShowLoginLink(false);
        } else if (response.error.includes('weak password')) {
          setAuthError("Password is too weak. Please use a stronger password.");
          setShowLoginLink(false);
        } else {
          setAuthError(response.error);
          setShowLoginLink(false);
        }
        setIsLoading(false);
        return;
      }

      if (response.data) {
        const userId = response.data.user_id || "mock-user-id";
        const token = response.data.access_token || "mock-token";
        
        // Use AuthContext to manage authentication state
        login(token, userId, data.email, data.name);
        
        // Clear saved form data on success
        localStorage.removeItem(FORM_STORAGE_KEY);
        
        // Track sign-up completion
        trackEvent('sign_up_complete', {
          authProvider: 'email',
          userId: userId,
        });
        
        // Complete step
        onComplete(userId, data.email);
      }
    } catch (error: any) {
      // Handle network errors
      if (error.message?.includes('network') || error.message?.includes('fetch') || !navigator.onLine) {
        setAuthError("Connection issue. Please check your internet and try again.");
        setIsNetworkError(true);
      } else {
        setAuthError("An unexpected error occurred. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    const formData = form.getValues();
    onSubmit(formData);
  };

  const handleGoogleSignIn = () => {
    // Placeholder for Google OAuth integration
    setAuthError("Google sign-in coming soon!");
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
          Join PetPal
        </h2>
        <p className="font-body text-muted-foreground">
          Create your account to get started
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Name Field */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-body text-foreground">Your Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Pet Parent Name"
                    className="rounded-[2.5rem] bg-olive border-accent font-body"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email Field */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-body text-foreground">Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      {...field}
                      type="email"
                      placeholder="hello@petpal.com"
                      className="rounded-[2.5rem] bg-olive border-accent font-body pl-12"
                      disabled={isLoading}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password Field */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-body text-foreground">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      {...field}
                      type="password"
                      placeholder="••••••••"
                      className="rounded-[2.5rem] bg-olive border-accent font-body pl-12"
                      disabled={isLoading}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Error Message */}
          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-[2.5rem]"
            >
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <p className="font-body text-sm text-destructive">{authError}</p>
                {showLoginLink && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/login')}
                    className="mt-2 rounded-[2.5rem] border-primary text-primary hover:bg-primary/10"
                  >
                    Go to Login Page
                  </Button>
                )}
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

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full rounded-[2.5rem] bg-primary text-primary-foreground font-body py-6 text-lg hover:opacity-90 transition-opacity"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-accent" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-body">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-[2.5rem] border-accent font-body py-6 text-lg"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </Button>
        </form>
      </Form>
    </motion.div>
  );
};
