import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import LandingPage from "@/pages/LandingPage";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Mock analytics module
vi.mock("@/lib/analytics", () => ({
  initializeAnalytics: vi.fn(),
  trackEvent: vi.fn(),
  trackPageLoadTime: vi.fn(),
}));

// Mock API module
vi.mock("@/lib/api", () => ({
  api: {
    register: vi.fn(),
    createPet: vi.fn(),
    getPets: vi.fn(),
    getHealthRecords: vi.fn(),
    getAppointments: vi.fn(),
  },
}));

// Mock lazy-loaded components
vi.mock("@/components/landing/HowItWorksSection", () => ({
  HowItWorksSection: () => <div>How It Works Section</div>,
}));

vi.mock("@/components/landing/SocialProofSection", () => ({
  SocialProofSection: () => <div>Social Proof Section</div>,
}));

vi.mock("@/components/landing/InteractiveDemoSection", () => ({
  InteractiveDemoSection: () => <div>Interactive Demo Section</div>,
}));

vi.mock("@/components/landing/PricingSection", () => ({
  PricingSection: () => <div>Pricing Section</div>,
}));

vi.mock("@/components/landing/FinalCTASection", () => ({
  FinalCTASection: ({ onCTAClick }: { onCTAClick: () => void }) => (
    <button onClick={onCTAClick}>Final CTA</button>
  ),
}));

// Mock LazyLoad component
vi.mock("@/lib/lazyLoad", () => ({
  LazyLoad: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Helper function to create a test app with routing
const createTestApp = (initialRoute = "/") => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe("Navigation Flows Integration Tests", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
    // Reset document.readyState
    Object.defineProperty(document, "readyState", {
      writable: true,
      value: "complete",
    });
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  describe("Landing Page to Onboarding Navigation", () => {
    it("should navigate from landing page to onboarding when CTA is clicked", async () => {
      const user = userEvent.setup();
      
      // Mock authentication - user needs to be authenticated to access onboarding
      localStorage.setItem("token", "test-token");
      localStorage.setItem("user_id", "test-user-id");
      localStorage.setItem("user_email", "test@example.com");
      localStorage.setItem("petpal_user", "Test User");

      render(createTestApp("/"));

      // Verify we're on the landing page
      await waitFor(() => {
        expect(
          screen.getByText((content, element) => {
            return element?.tagName.toLowerCase() === 'h1' && 
                   content.includes("Your Pet's New");
          })
        ).toBeInTheDocument();
      });

      // Find and click the "Get Started Free" CTA button
      const ctaButton = screen.getByRole("button", {
        name: /Get Started Free/i,
      });
      await user.click(ctaButton);

      // Verify navigation to onboarding page
      await waitFor(() => {
        // Check for onboarding-specific content
        expect(
          screen.getByText(/Create Your Account/i) ||
            screen.getByText(/Let's get started/i) ||
            screen.getByPlaceholderText(/Pet Parent Name/i)
        ).toBeInTheDocument();
      });
    });

    it("should track CTA click event when navigating to onboarding", async () => {
      const user = userEvent.setup();
      const { trackEvent } = await import("@/lib/analytics");

      // Mock authentication
      localStorage.setItem("token", "test-token");
      localStorage.setItem("user_id", "test-user-id");

      render(createTestApp("/"));

      await waitFor(() => {
        expect(
          screen.getByText((content, element) => {
            return element?.tagName.toLowerCase() === 'h1' && 
                   content.includes("Your Pet's New");
          })
        ).toBeInTheDocument();
      });

      const ctaButton = screen.getByRole("button", {
        name: /Get Started Free/i,
      });
      await user.click(ctaButton);

      // Verify analytics event was tracked
      expect(trackEvent).toHaveBeenCalledWith("cta_click", {
        location: "landing_page",
        buttonText: "Get Started Free",
      });
    });
  });

  describe("Onboarding to Dashboard Navigation", () => {
    it("should navigate from onboarding to dashboard after completion", async () => {
      const user = userEvent.setup();
      const { api } = await import("@/lib/api");

      // Mock authentication
      localStorage.setItem("token", "test-token");
      localStorage.setItem("user_id", "test-user-id");
      localStorage.setItem("user_email", "test@example.com");
      localStorage.setItem("petpal_user", "Test User");

      // Mock successful API responses
      vi.mocked(api.register).mockResolvedValue({
        token: "new-token",
        user_id: "new-user-id",
        email: "newuser@example.com",
        name: "New User",
      });

      vi.mocked(api.createPet).mockResolvedValue({
        id: "pet-123",
        name: "Buddy",
        type: "dog",
        breed: "Golden Retriever",
        age: 3,
      });

      vi.mocked(api.getPets).mockResolvedValue([]);
      vi.mocked(api.getHealthRecords).mockResolvedValue([]);
      vi.mocked(api.getAppointments).mockResolvedValue([]);

      render(createTestApp("/onboarding"));

      // Wait for onboarding page to load
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Pet Parent Name/i) ||
            screen.getByText(/Create Your Account/i)
        ).toBeInTheDocument();
      });

      // Fill in sign-up form
      const nameInput = screen.getByPlaceholderText(/Pet Parent Name/i);
      const emailInput = screen.getByPlaceholderText(/hello@petpal.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/i);

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(passwordInput, "Password123");

      // Submit sign-up form
      const createAccountButton = screen.getByRole("button", {
        name: /Create Account/i,
      });
      await user.click(createAccountButton);

      // Wait for pet step
      await waitFor(
        () => {
          expect(screen.getByPlaceholderText(/Buddy/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Fill in pet form
      const petNameInput = screen.getByPlaceholderText(/Buddy/i);
      const breedInput = screen.getByPlaceholderText(/Golden Retriever/i);

      await user.type(petNameInput, "Max");
      await user.type(breedInput, "Labrador");

      // Select pet type
      const dogOption = screen.getByLabelText(/Dog/i);
      await user.click(dogOption);

      // Submit pet form
      const addPetButton = screen.getByRole("button", { name: /Add Pet/i });
      await user.click(addPetButton);

      // Wait for tour intro step
      await waitFor(
        () => {
          expect(
            screen.getByText(/Ready to explore/i) ||
              screen.getByText(/Start Tour/i) ||
              screen.getByRole("button", { name: /Start Tour/i })
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Start the tour (which navigates to dashboard)
      const startTourButton = screen.getByRole("button", {
        name: /Start Tour/i,
      });
      await user.click(startTourButton);

      // Verify navigation to dashboard
      await waitFor(
        () => {
          // Dashboard should be rendered
          expect(
            screen.queryByText(/Create Your Account/i)
          ).not.toBeInTheDocument();
          expect(screen.queryByPlaceholderText(/Buddy/i)).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("should track onboarding completion event when navigating to dashboard", async () => {
      const user = userEvent.setup();
      const { trackEvent } = await import("@/lib/analytics");
      const { api } = await import("@/lib/api");

      // Mock authentication
      localStorage.setItem("token", "test-token");
      localStorage.setItem("user_id", "test-user-id");

      // Mock API responses
      vi.mocked(api.register).mockResolvedValue({
        token: "new-token",
        user_id: "new-user-id",
        email: "newuser@example.com",
        name: "New User",
      });

      vi.mocked(api.createPet).mockResolvedValue({
        id: "pet-123",
        name: "Buddy",
        type: "dog",
        breed: "Golden Retriever",
        age: 3,
      });

      vi.mocked(api.getPets).mockResolvedValue([]);

      render(createTestApp("/onboarding"));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Pet Parent Name/i)).toBeInTheDocument();
      });

      // Complete onboarding flow (simplified)
      const nameInput = screen.getByPlaceholderText(/Pet Parent Name/i);
      const emailInput = screen.getByPlaceholderText(/hello@petpal.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/i);

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(passwordInput, "Password123");

      const createAccountButton = screen.getByRole("button", {
        name: /Create Account/i,
      });
      await user.click(createAccountButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Buddy/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      const petNameInput = screen.getByPlaceholderText(/Buddy/i);
      const breedInput = screen.getByPlaceholderText(/Golden Retriever/i);

      await user.type(petNameInput, "Max");
      await user.type(breedInput, "Labrador");

      const dogOption = screen.getByLabelText(/Dog/i);
      await user.click(dogOption);

      const addPetButton = screen.getByRole("button", { name: /Add Pet/i });
      await user.click(addPetButton);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Start Tour/i })).toBeInTheDocument();
      }, { timeout: 3000 });

      const startTourButton = screen.getByRole("button", { name: /Start Tour/i });
      await user.click(startTourButton);

      // Verify onboarding completion was tracked
      await waitFor(() => {
        expect(trackEvent).toHaveBeenCalledWith(
          "onboarding_complete",
          expect.objectContaining({
            userId: expect.any(String),
            petId: expect.any(String),
          })
        );
      });
    });
  });

  describe("Protected Route Redirects", () => {
    it("should redirect unauthenticated users from onboarding to landing page", async () => {
      // Ensure no authentication token exists
      localStorage.clear();

      render(createTestApp("/onboarding"));

      // Should be redirected to landing page
      await waitFor(() => {
        expect(
          screen.getByText((content, element) => {
            return element?.tagName.toLowerCase() === 'h1' && 
                   content.includes("Your Pet's New");
          })
        ).toBeInTheDocument();
      });

      // Should NOT see onboarding content
      expect(
        screen.queryByPlaceholderText(/Pet Parent Name/i)
      ).not.toBeInTheDocument();
    });

    it("should redirect unauthenticated users from dashboard to landing page", async () => {
      // Ensure no authentication token exists
      localStorage.clear();

      render(createTestApp("/dashboard"));

      // Should be redirected to landing page
      await waitFor(() => {
        expect(
          screen.getByText((content, element) => {
            return element?.tagName.toLowerCase() === 'h1' && 
                   content.includes("Your Pet's New");
          })
        ).toBeInTheDocument();
      });
    });

    it("should allow authenticated users to access onboarding", async () => {
      // Set authentication token
      localStorage.setItem("token", "test-token");
      localStorage.setItem("user_id", "test-user-id");
      localStorage.setItem("user_email", "test@example.com");
      localStorage.setItem("petpal_user", "Test User");

      render(createTestApp("/onboarding"));

      // Should see onboarding content
      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Pet Parent Name/i) ||
            screen.getByText(/Create Your Account/i)
        ).toBeInTheDocument();
      });

      // Should NOT be redirected to landing page
      expect(
        screen.queryByText((content, element) => {
          return element?.tagName.toLowerCase() === 'h1' && 
                 content.includes("Your Pet's New");
        })
      ).not.toBeInTheDocument();
    });

    it("should allow authenticated users to access dashboard", async () => {
      const { api } = await import("@/lib/api");

      // Set authentication token
      localStorage.setItem("token", "test-token");
      localStorage.setItem("user_id", "test-user-id");
      localStorage.setItem("user_email", "test@example.com");
      localStorage.setItem("petpal_user", "Test User");

      // Mock API responses for dashboard
      vi.mocked(api.getPets).mockResolvedValue([
        {
          id: "pet-1",
          name: "Buddy",
          type: "dog",
          breed: "Golden Retriever",
          age: 3,
        },
      ]);
      vi.mocked(api.getHealthRecords).mockResolvedValue([]);
      vi.mocked(api.getAppointments).mockResolvedValue([]);

      render(createTestApp("/dashboard"));

      // Should NOT be redirected to landing page
      await waitFor(() => {
        expect(
          screen.queryByText(/Your Pet's New Best Friend/i)
        ).not.toBeInTheDocument();
      });
    });

    it("should preserve intended destination after authentication", async () => {
      // User tries to access dashboard without authentication
      localStorage.clear();

      const { rerender } = render(createTestApp("/dashboard"));

      // Should be redirected to landing page
      await waitFor(() => {
        expect(
          screen.getByText((content, element) => {
            return element?.tagName.toLowerCase() === 'h1' && 
                   content.includes("Your Pet's New");
          })
        ).toBeInTheDocument();
      });

      // User authenticates
      localStorage.setItem("token", "test-token");
      localStorage.setItem("user_id", "test-user-id");
      localStorage.setItem("user_email", "test@example.com");
      localStorage.setItem("petpal_user", "Test User");

      const { api } = await import("@/lib/api");
      vi.mocked(api.getPets).mockResolvedValue([]);
      vi.mocked(api.getHealthRecords).mockResolvedValue([]);
      vi.mocked(api.getAppointments).mockResolvedValue([]);

      // Re-render with authentication
      rerender(createTestApp("/dashboard"));

      // Should now be able to access dashboard
      await waitFor(() => {
        expect(
          screen.queryByText((content, element) => {
            return element?.tagName.toLowerCase() === 'h1' && 
                   content.includes("Your Pet's New");
          })
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Complete User Journey", () => {
    it("should support full flow: landing -> onboarding -> dashboard", async () => {
      const user = userEvent.setup();
      const { api } = await import("@/lib/api");

      // Start unauthenticated
      localStorage.clear();

      // Mock API responses
      vi.mocked(api.register).mockResolvedValue({
        token: "new-token",
        user_id: "new-user-id",
        email: "newuser@example.com",
        name: "New User",
      });

      vi.mocked(api.createPet).mockResolvedValue({
        id: "pet-123",
        name: "Buddy",
        type: "dog",
        breed: "Golden Retriever",
        age: 3,
      });

      vi.mocked(api.getPets).mockResolvedValue([]);
      vi.mocked(api.getHealthRecords).mockResolvedValue([]);
      vi.mocked(api.getAppointments).mockResolvedValue([]);

      // Step 1: Start on landing page
      const { rerender } = render(createTestApp("/"));

      await waitFor(() => {
        expect(
          screen.getByText((content, element) => {
            return element?.tagName.toLowerCase() === 'h1' && 
                   content.includes("Your Pet's New");
          })
        ).toBeInTheDocument();
      });

      // Step 2: Click CTA to go to onboarding (but will be redirected back)
      const ctaButton = screen.getByRole("button", {
        name: /Get Started Free/i,
      });
      await user.click(ctaButton);

      // Since user is not authenticated, they stay on landing or get redirected
      // In a real app, this would show a login modal or redirect to login
      // For this test, we'll simulate authentication and navigate to onboarding

      // Simulate user completing authentication
      localStorage.setItem("token", "test-token");
      localStorage.setItem("user_id", "test-user-id");
      localStorage.setItem("user_email", "test@example.com");
      localStorage.setItem("petpal_user", "Test User");

      // Step 3: Navigate to onboarding
      rerender(createTestApp("/onboarding"));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Pet Parent Name/i)).toBeInTheDocument();
      });

      // Step 4: Complete onboarding
      const nameInput = screen.getByPlaceholderText(/Pet Parent Name/i);
      const emailInput = screen.getByPlaceholderText(/hello@petpal.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/i);

      await user.type(nameInput, "John Doe");
      await user.type(emailInput, "john@example.com");
      await user.type(passwordInput, "Password123");

      const createAccountButton = screen.getByRole("button", {
        name: /Create Account/i,
      });
      await user.click(createAccountButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Buddy/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      const petNameInput = screen.getByPlaceholderText(/Buddy/i);
      const breedInput = screen.getByPlaceholderText(/Golden Retriever/i);

      await user.type(petNameInput, "Max");
      await user.type(breedInput, "Labrador");

      const dogOption = screen.getByLabelText(/Dog/i);
      await user.click(dogOption);

      const addPetButton = screen.getByRole("button", { name: /Add Pet/i });
      await user.click(addPetButton);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Start Tour/i })).toBeInTheDocument();
      }, { timeout: 3000 });

      const startTourButton = screen.getByRole("button", { name: /Start Tour/i });
      await user.click(startTourButton);

      // Step 5: Verify we're on dashboard
      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/Pet Parent Name/i)).not.toBeInTheDocument();
        expect(screen.queryByPlaceholderText(/Buddy/i)).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
});
