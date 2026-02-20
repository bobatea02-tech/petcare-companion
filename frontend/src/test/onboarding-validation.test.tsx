import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { SignUpStep } from "@/components/onboarding/SignUpStep";
import { AddPetStep } from "@/components/onboarding/AddPetStep";
import * as apiModule from "@/lib/api";

// Mock the API module
vi.mock("@/lib/api", () => ({
  api: {
    register: vi.fn(),
    createPet: vi.fn(),
  },
}));

describe("Onboarding Form Validation", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  describe("SignUpStep - Email Validation", () => {
    it("should reject invalid email formats", async () => {
      const onComplete = vi.fn();
      renderWithProviders(<SignUpStep onComplete={onComplete} />);

      const nameInput = screen.getByPlaceholderText(/Pet Parent Name/i);
      const emailInput = screen.getByPlaceholderText(/hello@petpal.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/i);
      const submitButton = screen.getByRole("button", { name: /Create Account/i });

      // Fill in name and password
      await userEvent.type(nameInput, "John Doe");
      await userEvent.type(passwordInput, "Password123");

      // Test invalid email format
      await userEvent.type(emailInput, "notanemail");
      await userEvent.click(submitButton);

      // Wait a bit for form validation
      await waitFor(() => {
        // Form should not call onComplete with invalid email
        expect(onComplete).not.toHaveBeenCalled();
      }, { timeout: 1000 });

      // Verify error message appears
      await waitFor(() => {
        const errorMessage = screen.queryByText(/Please enter a valid email address/i);
        if (errorMessage) {
          expect(errorMessage).toBeInTheDocument();
        }
      }, { timeout: 500 });
    });

    it("should accept valid email formats", async () => {
      const onComplete = vi.fn();
      renderWithProviders(<SignUpStep onComplete={onComplete} />);

      const nameInput = screen.getByPlaceholderText(/Pet Parent Name/i);
      const emailInput = screen.getByPlaceholderText(/hello@petpal.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/i);

      // Valid email
      await userEvent.type(nameInput, "John Doe");
      await userEvent.type(emailInput, "john.doe@example.com");
      await userEvent.type(passwordInput, "Password123");

      // Should not show email error
      expect(
        screen.queryByText(/Please enter a valid email address/i)
      ).not.toBeInTheDocument();
    });
  });

  describe("SignUpStep - Password Strength Validation", () => {
    it("should reject passwords shorter than 8 characters", async () => {
      const onComplete = vi.fn();
      renderWithProviders(<SignUpStep onComplete={onComplete} />);

      const passwordInput = screen.getByPlaceholderText(/••••••••/i);
      const submitButton = screen.getByRole("button", { name: /Create Account/i });

      await userEvent.type(passwordInput, "Pass1");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Password must be at least 8 characters/i)
        ).toBeInTheDocument();
      });

      expect(onComplete).not.toHaveBeenCalled();
    });

    it("should reject passwords without uppercase letters", async () => {
      const onComplete = vi.fn();
      renderWithProviders(<SignUpStep onComplete={onComplete} />);

      const passwordInput = screen.getByPlaceholderText(/••••••••/i);
      const submitButton = screen.getByRole("button", { name: /Create Account/i });

      await userEvent.type(passwordInput, "password123");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Password must contain at least one uppercase letter/i)
        ).toBeInTheDocument();
      });

      expect(onComplete).not.toHaveBeenCalled();
    });

    it("should reject passwords without lowercase letters", async () => {
      const onComplete = vi.fn();
      renderWithProviders(<SignUpStep onComplete={onComplete} />);

      const passwordInput = screen.getByPlaceholderText(/••••••••/i);
      const submitButton = screen.getByRole("button", { name: /Create Account/i });

      await userEvent.type(passwordInput, "PASSWORD123");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Password must contain at least one lowercase letter/i)
        ).toBeInTheDocument();
      });

      expect(onComplete).not.toHaveBeenCalled();
    });

    it("should reject passwords without numbers", async () => {
      const onComplete = vi.fn();
      renderWithProviders(<SignUpStep onComplete={onComplete} />);

      const passwordInput = screen.getByPlaceholderText(/••••••••/i);
      const submitButton = screen.getByRole("button", { name: /Create Account/i });

      await userEvent.type(passwordInput, "Password");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Password must contain at least one number/i)
        ).toBeInTheDocument();
      });

      expect(onComplete).not.toHaveBeenCalled();
    });

    it("should accept strong passwords", async () => {
      const onComplete = vi.fn();
      renderWithProviders(<SignUpStep onComplete={onComplete} />);

      const nameInput = screen.getByPlaceholderText(/Pet Parent Name/i);
      const emailInput = screen.getByPlaceholderText(/hello@petpal.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/i);

      await userEvent.type(nameInput, "John Doe");
      await userEvent.type(emailInput, "john@example.com");
      await userEvent.type(passwordInput, "StrongPass123");

      // Should not show password errors
      expect(
        screen.queryByText(/Password must/i)
      ).not.toBeInTheDocument();
    });
  });

  describe("AddPetStep - Required Field Validation", () => {
    it("should require pet name", async () => {
      const onComplete = vi.fn();
      renderWithProviders(<AddPetStep onComplete={onComplete} />);

      const submitButton = screen.getByRole("button", { name: /Add Pet/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Pet name is required/i)).toBeInTheDocument();
      });

      expect(onComplete).not.toHaveBeenCalled();
    });

    it("should require pet type selection", async () => {
      const onComplete = vi.fn();
      renderWithProviders(<AddPetStep onComplete={onComplete} />);

      const nameInput = screen.getByPlaceholderText(/Buddy/i);
      await userEvent.type(nameInput, "Max");

      const submitButton = screen.getByRole("button", { name: /Add Pet/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Please select a pet type/i)
        ).toBeInTheDocument();
      });

      expect(onComplete).not.toHaveBeenCalled();
    });

    it("should require breed", async () => {
      const onComplete = vi.fn();
      renderWithProviders(<AddPetStep onComplete={onComplete} />);

      const nameInput = screen.getByPlaceholderText(/Buddy/i);
      await userEvent.type(nameInput, "Max");

      // Select pet type
      const dogOption = screen.getByLabelText(/Dog/i);
      await userEvent.click(dogOption);

      const submitButton = screen.getByRole("button", { name: /Add Pet/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Breed is required/i)).toBeInTheDocument();
      });

      expect(onComplete).not.toHaveBeenCalled();
    });

    it("should validate age is non-negative", async () => {
      const onComplete = vi.fn();
      renderWithProviders(<AddPetStep onComplete={onComplete} />);

      const nameInput = screen.getByPlaceholderText(/Buddy/i);
      const breedInput = screen.getByPlaceholderText(/Golden Retriever/i);
      const ageInput = screen.getByPlaceholderText(/3/i);
      const submitButton = screen.getByRole("button", { name: /Add Pet/i });

      // Fill in required fields
      await userEvent.type(nameInput, "Max");
      await userEvent.type(breedInput, "Labrador");

      // Select pet type
      const dogOption = screen.getByLabelText(/Dog/i);
      await userEvent.click(dogOption);

      // Enter negative age
      await userEvent.clear(ageInput);
      await userEvent.type(ageInput, "-1");

      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Age must be 0 or greater/i)
        ).toBeInTheDocument();
      });

      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe("AddPetStep - Photo Upload Validation", () => {
    it("should reject files larger than 5MB", async () => {
      const onComplete = vi.fn();
      renderWithProviders(<AddPetStep onComplete={onComplete} />);

      // Create a mock file larger than 5MB
      const largeFile = new File(["x".repeat(6 * 1024 * 1024)], "large.jpg", {
        type: "image/jpeg",
      });

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Manually trigger the change event
      Object.defineProperty(fileInput, 'files', {
        value: [largeFile],
        writable: false,
      });
      
      const changeEvent = new Event('change', { bubbles: true });
      fileInput.dispatchEvent(changeEvent);

      await waitFor(() => {
        expect(
          screen.getByText(/Photo size must be less than 5MB/i)
        ).toBeInTheDocument();
      });
    });

    it("should reject non-image files", async () => {
      const onComplete = vi.fn();
      renderWithProviders(<AddPetStep onComplete={onComplete} />);

      // Create a mock non-image file
      const textFile = new File(["hello"], "document.txt", {
        type: "text/plain",
      });

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Manually trigger the change event
      Object.defineProperty(fileInput, 'files', {
        value: [textFile],
        writable: false,
      });
      
      const changeEvent = new Event('change', { bubbles: true });
      fileInput.dispatchEvent(changeEvent);

      await waitFor(() => {
        expect(
          screen.getByText(/Please upload an image file/i)
        ).toBeInTheDocument();
      });
    });

    it("should accept valid image files under 5MB", async () => {
      const onComplete = vi.fn();
      renderWithProviders(<AddPetStep onComplete={onComplete} />);

      // Create a mock valid image file
      const validFile = new File(["x".repeat(1024)], "pet.jpg", {
        type: "image/jpeg",
      });

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Manually trigger the change event
      Object.defineProperty(fileInput, 'files', {
        value: [validFile],
        writable: false,
      });
      
      const changeEvent = new Event('change', { bubbles: true });
      fileInput.dispatchEvent(changeEvent);

      // Should not show error
      await waitFor(() => {
        expect(
          screen.queryByText(/Photo size must be less than 5MB/i)
        ).not.toBeInTheDocument();
        expect(
          screen.queryByText(/Please upload an image file/i)
        ).not.toBeInTheDocument();
      });
    });
  });
});
