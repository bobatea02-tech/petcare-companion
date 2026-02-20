import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MilestoneCard } from "./MilestoneCard";
import { milestoneDetector } from "@/services/MilestoneDetector";
import type { Milestone } from "@/types/features";

// Feature: additional-amazing-features
// Task: 5.5 Write unit tests for milestone sharing
// Requirements: 3.6

// Mock the toast hook
vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

// Mock window.open
const mockWindowOpen = vi.fn();
global.window.open = mockWindowOpen;

describe("MilestoneCard Unit Tests", () => {
  const mockMilestone: Milestone = {
    id: "milestone-1",
    petId: "pet-1",
    type: "first_vet_visit",
    title: "First Vet Visit",
    description: "Completed first veterinary checkup",
    achievedAt: new Date("2024-01-15"),
    badge: "🏥",
    shared: false,
  };

  const mockPetName = "Buddy";
  const mockPetPhoto = "https://example.com/buddy.jpg";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe("WhatsApp Share URL Generation", () => {
    it("should generate correct WhatsApp share URL with encoded text", async () => {
      const user = userEvent.setup();

      // Mock the generateShareableCard method
      vi.spyOn(milestoneDetector, "generateShareableCard").mockResolvedValue({
        imageUrl: mockPetPhoto,
        text: "🎉 Buddy achieved a milestone!\n\n🏥 First Vet Visit\nCompleted first veterinary checkup\n\nProudly tracking with PetPal! 🐾",
        hashtags: ["#PetMilestone", "#PetCare", "#petLove", "#PetParent"],
      });

      // Mock markAsShared
      vi.spyOn(milestoneDetector, "markAsShared").mockResolvedValue(undefined);

      render(
        <MilestoneCard
          milestone={mockMilestone}
          petName={mockPetName}
          petPhoto={mockPetPhoto}
        />
      );

      // Click WhatsApp share button
      const whatsappButton = screen.getByRole("button", { name: /whatsapp/i });
      await user.click(whatsappButton);

      // Wait for async operations
      await waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalled();
      });

      // Verify the URL structure
      const callArgs = mockWindowOpen.mock.calls[0];
      const url = callArgs[0] as string;

      expect(url).toContain("https://wa.me/?text=");
      expect(url).toContain(encodeURIComponent("🎉 Buddy achieved a milestone!"));
      expect(url).toContain(encodeURIComponent("First Vet Visit"));
    });

    it("should generate WhatsApp URL without photo when photo is not provided", async () => {
      const user = userEvent.setup();

      vi.spyOn(milestoneDetector, "generateShareableCard").mockResolvedValue({
        imageUrl: "/placeholder-pet.png",
        text: "🎉 Buddy achieved a milestone!",
        hashtags: ["#PetMilestone"],
      });

      vi.spyOn(milestoneDetector, "markAsShared").mockResolvedValue(undefined);

      render(
        <MilestoneCard
          milestone={mockMilestone}
          petName={mockPetName}
        />
      );

      const whatsappButton = screen.getByRole("button", { name: /whatsapp/i });
      await user.click(whatsappButton);

      await waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalled();
      });

      const url = mockWindowOpen.mock.calls[0][0] as string;
      expect(url).toContain("https://wa.me/?text=");
    });

    it("should mark milestone as shared on WhatsApp platform", async () => {
      const user = userEvent.setup();

      vi.spyOn(milestoneDetector, "generateShareableCard").mockResolvedValue({
        imageUrl: mockPetPhoto,
        text: "Test share text",
        hashtags: [],
      });

      const markAsSharedSpy = vi.spyOn(milestoneDetector, "markAsShared").mockResolvedValue(undefined);

      render(
        <MilestoneCard
          milestone={mockMilestone}
          petName={mockPetName}
          petPhoto={mockPetPhoto}
        />
      );

      const whatsappButton = screen.getByRole("button", { name: /whatsapp/i });
      await user.click(whatsappButton);

      await waitFor(() => {
        expect(markAsSharedSpy).toHaveBeenCalledWith(mockMilestone.id, "whatsapp");
      });
    });
  });

  describe("Facebook Share URL Generation", () => {
    it("should generate correct Facebook share URL with encoded text and image", async () => {
      const user = userEvent.setup();

      vi.spyOn(milestoneDetector, "generateShareableCard").mockResolvedValue({
        imageUrl: mockPetPhoto,
        text: "🎉 Buddy achieved a milestone!\n\n🏥 First Vet Visit\nCompleted first veterinary checkup\n\nProudly tracking with PetPal! 🐾",
        hashtags: ["#PetMilestone", "#PetCare"],
      });

      vi.spyOn(milestoneDetector, "markAsShared").mockResolvedValue(undefined);

      render(
        <MilestoneCard
          milestone={mockMilestone}
          petName={mockPetName}
          petPhoto={mockPetPhoto}
        />
      );

      const facebookButton = screen.getByRole("button", { name: /facebook/i });
      await user.click(facebookButton);

      await waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalled();
      });

      const url = mockWindowOpen.mock.calls[0][0] as string;

      expect(url).toContain("https://www.facebook.com/sharer/sharer.php");
      expect(url).toContain("u=");
      expect(url).toContain("quote=");
      expect(url).toContain(encodeURIComponent(mockPetPhoto));
      expect(url).toContain(encodeURIComponent("🎉 Buddy achieved a milestone!"));
    });

    it("should generate Facebook URL with placeholder when photo is not provided", async () => {
      const user = userEvent.setup();

      vi.spyOn(milestoneDetector, "generateShareableCard").mockResolvedValue({
        imageUrl: "/placeholder-pet.png",
        text: "Test milestone",
        hashtags: [],
      });

      vi.spyOn(milestoneDetector, "markAsShared").mockResolvedValue(undefined);

      render(
        <MilestoneCard
          milestone={mockMilestone}
          petName={mockPetName}
        />
      );

      const facebookButton = screen.getByRole("button", { name: /facebook/i });
      await user.click(facebookButton);

      await waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalled();
      });

      const url = mockWindowOpen.mock.calls[0][0] as string;
      expect(url).toContain("https://www.facebook.com/sharer/sharer.php");
    });

    it("should mark milestone as shared on Facebook platform", async () => {
      const user = userEvent.setup();

      vi.spyOn(milestoneDetector, "generateShareableCard").mockResolvedValue({
        imageUrl: mockPetPhoto,
        text: "Test share text",
        hashtags: [],
      });

      const markAsSharedSpy = vi.spyOn(milestoneDetector, "markAsShared").mockResolvedValue(undefined);

      render(
        <MilestoneCard
          milestone={mockMilestone}
          petName={mockPetName}
          petPhoto={mockPetPhoto}
        />
      );

      const facebookButton = screen.getByRole("button", { name: /facebook/i });
      await user.click(facebookButton);

      await waitFor(() => {
        expect(markAsSharedSpy).toHaveBeenCalledWith(mockMilestone.id, "facebook");
      });
    });

    it("should open Facebook share dialog in new window with correct dimensions", async () => {
      const user = userEvent.setup();

      vi.spyOn(milestoneDetector, "generateShareableCard").mockResolvedValue({
        imageUrl: mockPetPhoto,
        text: "Test",
        hashtags: [],
      });

      vi.spyOn(milestoneDetector, "markAsShared").mockResolvedValue(undefined);

      render(
        <MilestoneCard
          milestone={mockMilestone}
          petName={mockPetName}
          petPhoto={mockPetPhoto}
        />
      );

      const facebookButton = screen.getByRole("button", { name: /facebook/i });
      await user.click(facebookButton);

      await waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalledWith(
          expect.stringContaining("facebook.com"),
          "_blank",
          "width=600,height=400"
        );
      });
    });
  });

  describe("Shareable Card Image Generation", () => {
    it("should call generateShareableCard with correct milestone and pet data", async () => {
      const user = userEvent.setup();

      const generateCardSpy = vi.spyOn(milestoneDetector, "generateShareableCard").mockResolvedValue({
        imageUrl: mockPetPhoto,
        text: "Test text",
        hashtags: [],
      });

      vi.spyOn(milestoneDetector, "markAsShared").mockResolvedValue(undefined);

      render(
        <MilestoneCard
          milestone={mockMilestone}
          petName={mockPetName}
          petPhoto={mockPetPhoto}
        />
      );

      const whatsappButton = screen.getByRole("button", { name: /whatsapp/i });
      await user.click(whatsappButton);

      await waitFor(() => {
        expect(generateCardSpy).toHaveBeenCalledWith(
          mockMilestone,
          expect.objectContaining({
            id: mockMilestone.petId,
            name: mockPetName,
            species: "pet",
            photo: mockPetPhoto,
          })
        );
      });
    });

    it("should generate shareable card with pet photo included", async () => {
      const user = userEvent.setup();

      const generateCardSpy = vi.spyOn(milestoneDetector, "generateShareableCard").mockResolvedValue({
        imageUrl: mockPetPhoto,
        text: "Milestone achieved!",
        hashtags: ["#PetMilestone"],
      });

      vi.spyOn(milestoneDetector, "markAsShared").mockResolvedValue(undefined);

      render(
        <MilestoneCard
          milestone={mockMilestone}
          petName={mockPetName}
          petPhoto={mockPetPhoto}
        />
      );

      const whatsappButton = screen.getByRole("button", { name: /whatsapp/i });
      await user.click(whatsappButton);

      await waitFor(() => {
        expect(generateCardSpy).toHaveBeenCalled();
      });

      const callArgs = generateCardSpy.mock.calls[0];
      const petData = callArgs[1];
      expect(petData.photo).toBe(mockPetPhoto);
    });

    it("should generate shareable card with achievement details", async () => {
      const user = userEvent.setup();

      const generateCardSpy = vi.spyOn(milestoneDetector, "generateShareableCard").mockResolvedValue({
        imageUrl: mockPetPhoto,
        text: "🎉 Buddy achieved a milestone!\n\n🏥 First Vet Visit\nCompleted first veterinary checkup\n\nProudly tracking with PetPal! 🐾",
        hashtags: ["#PetMilestone"],
      });

      vi.spyOn(milestoneDetector, "markAsShared").mockResolvedValue(undefined);

      render(
        <MilestoneCard
          milestone={mockMilestone}
          petName={mockPetName}
          petPhoto={mockPetPhoto}
        />
      );

      const facebookButton = screen.getByRole("button", { name: /facebook/i });
      await user.click(facebookButton);

      await waitFor(() => {
        expect(generateCardSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "First Vet Visit",
            description: "Completed first veterinary checkup",
            badge: "🏥",
          }),
          expect.any(Object)
        );
      });
    });

    it("should handle shareable card generation with undefined photo", async () => {
      const user = userEvent.setup();

      const generateCardSpy = vi.spyOn(milestoneDetector, "generateShareableCard").mockResolvedValue({
        imageUrl: "/placeholder-pet.png",
        text: "Milestone achieved!",
        hashtags: [],
      });

      vi.spyOn(milestoneDetector, "markAsShared").mockResolvedValue(undefined);

      render(
        <MilestoneCard
          milestone={mockMilestone}
          petName={mockPetName}
        />
      );

      const whatsappButton = screen.getByRole("button", { name: /whatsapp/i });
      await user.click(whatsappButton);

      await waitFor(() => {
        expect(generateCardSpy).toHaveBeenCalled();
      });

      const callArgs = generateCardSpy.mock.calls[0];
      const petData = callArgs[1];
      expect(petData.photo).toBeUndefined();
    });
  });

  describe("Share Callback and Error Handling", () => {
    it("should call onShare callback when provided", async () => {
      const user = userEvent.setup();
      const onShareMock = vi.fn();

      vi.spyOn(milestoneDetector, "generateShareableCard").mockResolvedValue({
        imageUrl: mockPetPhoto,
        text: "Test",
        hashtags: [],
      });

      vi.spyOn(milestoneDetector, "markAsShared").mockResolvedValue(undefined);

      render(
        <MilestoneCard
          milestone={mockMilestone}
          petName={mockPetName}
          petPhoto={mockPetPhoto}
          onShare={onShareMock}
        />
      );

      const whatsappButton = screen.getByRole("button", { name: /whatsapp/i });
      await user.click(whatsappButton);

      await waitFor(() => {
        expect(onShareMock).toHaveBeenCalledWith("whatsapp");
      });
    });

    it("should disable share buttons while sharing is in progress", async () => {
      const user = userEvent.setup();

      // Create a promise that we can control
      let resolveShare: () => void;
      const sharePromise = new Promise<void>((resolve) => {
        resolveShare = resolve;
      });

      vi.spyOn(milestoneDetector, "generateShareableCard").mockReturnValue(
        sharePromise.then(() => ({
          imageUrl: mockPetPhoto,
          text: "Test",
          hashtags: [],
        }))
      );

      vi.spyOn(milestoneDetector, "markAsShared").mockResolvedValue(undefined);

      render(
        <MilestoneCard
          milestone={mockMilestone}
          petName={mockPetName}
          petPhoto={mockPetPhoto}
        />
      );

      const whatsappButton = screen.getByRole("button", { name: /whatsapp/i });
      const facebookButton = screen.getByRole("button", { name: /facebook/i });

      // Click the button
      await user.click(whatsappButton);

      // Buttons should be disabled while sharing
      expect(whatsappButton).toBeDisabled();
      expect(facebookButton).toBeDisabled();

      // Resolve the promise
      resolveShare!();

      // Wait for buttons to be enabled again
      await waitFor(() => {
        expect(whatsappButton).not.toBeDisabled();
        expect(facebookButton).not.toBeDisabled();
      });
    });

    it("should handle share errors gracefully", async () => {
      const user = userEvent.setup();

      vi.spyOn(milestoneDetector, "generateShareableCard").mockRejectedValue(
        new Error("Share failed")
      );

      render(
        <MilestoneCard
          milestone={mockMilestone}
          petName={mockPetName}
          petPhoto={mockPetPhoto}
        />
      );

      const whatsappButton = screen.getByRole("button", { name: /whatsapp/i });
      await user.click(whatsappButton);

      // Should not crash and buttons should be re-enabled
      await waitFor(() => {
        expect(whatsappButton).not.toBeDisabled();
      });
    });
  });

  describe("Milestone Display", () => {
    it("should display milestone title and description", () => {
      render(
        <MilestoneCard
          milestone={mockMilestone}
          petName={mockPetName}
          petPhoto={mockPetPhoto}
        />
      );

      expect(screen.getByText("First Vet Visit")).toBeInTheDocument();
      expect(screen.getByText("Completed first veterinary checkup")).toBeInTheDocument();
    });

    it("should display milestone badge", () => {
      render(
        <MilestoneCard
          milestone={mockMilestone}
          petName={mockPetName}
          petPhoto={mockPetPhoto}
        />
      );

      expect(screen.getByText("🏥")).toBeInTheDocument();
    });

    it("should display formatted date", () => {
      render(
        <MilestoneCard
          milestone={mockMilestone}
          petName={mockPetName}
          petPhoto={mockPetPhoto}
        />
      );

      // Date should be formatted in Indian locale
      const expectedDate = new Date("2024-01-15").toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      expect(screen.getByText(expectedDate)).toBeInTheDocument();
    });

    it("should show shared indicator when milestone is shared", () => {
      const sharedMilestone = { ...mockMilestone, shared: true };

      render(
        <MilestoneCard
          milestone={sharedMilestone}
          petName={mockPetName}
          petPhoto={mockPetPhoto}
        />
      );

      expect(screen.getByText("✓ Shared")).toBeInTheDocument();
    });

    it("should not show shared indicator when milestone is not shared", () => {
      render(
        <MilestoneCard
          milestone={mockMilestone}
          petName={mockPetName}
          petPhoto={mockPetPhoto}
        />
      );

      expect(screen.queryByText("✓ Shared")).not.toBeInTheDocument();
    });
  });
});
