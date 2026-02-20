import { describe, it, expect, beforeEach } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Unit tests for SEO meta tags presence
 * Feature: outstanding-landing-page
 * Task: 9.2 Write unit tests for meta tags presence
 * Requirements: 10.1, 10.2, 10.3
 */

describe("Meta Tags Presence", () => {
  let indexHtmlContent: string;

  beforeEach(() => {
    // Read the actual index.html file
    const indexHtmlPath = path.resolve(__dirname, "../../index.html");
    indexHtmlContent = fs.readFileSync(indexHtmlPath, "utf-8");
    
    // Parse and inject meta tags into the test document
    const parser = new DOMParser();
    const doc = parser.parseFromString(indexHtmlContent, "text/html");
    
    // Copy meta tags from parsed document to test document
    const metaTags = doc.querySelectorAll("meta");
    metaTags.forEach((tag) => {
      const clonedTag = tag.cloneNode(true) as HTMLMetaElement;
      document.head.appendChild(clonedTag);
    });
    
    // Copy title tag
    const titleTag = doc.querySelector("title");
    if (titleTag) {
      const existingTitle = document.querySelector("title");
      if (existingTitle) {
        existingTitle.textContent = titleTag.textContent;
      } else {
        const clonedTitle = titleTag.cloneNode(true) as HTMLTitleElement;
        document.head.appendChild(clonedTitle);
      }
    }
    
    // Copy script tags (for JSON-LD)
    const scriptTags = doc.querySelectorAll('script[type="application/ld+json"]');
    scriptTags.forEach((tag) => {
      const clonedTag = tag.cloneNode(true) as HTMLScriptElement;
      document.head.appendChild(clonedTag);
    });
  });

  describe("Title Tag", () => {
    it("should have a title tag with SEO-optimized content", () => {
      const title = document.querySelector("title");
      expect(title).toBeTruthy();
      
      if (title) {
        const titleText = title.textContent || "";
        expect(titleText).toContain("PetCare");
        expect(titleText).toContain("India");
        expect(titleText).toContain("Pet Care App");
      }
    });
  });

  describe("Meta Description", () => {
    it("should have a meta description tag", () => {
      const metaDescription = document.querySelector('meta[name="description"]');
      expect(metaDescription).toBeTruthy();
    });

    it("should have meaningful description content", () => {
      const metaDescription = document.querySelector('meta[name="description"]') as HTMLMetaElement;
      expect(metaDescription).toBeTruthy();
      
      if (metaDescription) {
        const content = metaDescription.getAttribute("content") || "";
        expect(content.length).toBeGreaterThan(50);
        expect(content).toContain("pet");
      }
    });
  });

  describe("Meta Keywords", () => {
    it("should have a meta keywords tag", () => {
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      expect(metaKeywords).toBeTruthy();
    });

    it("should have relevant keywords", () => {
      const metaKeywords = document.querySelector('meta[name="keywords"]') as HTMLMetaElement;
      expect(metaKeywords).toBeTruthy();
      
      if (metaKeywords) {
        const content = metaKeywords.getAttribute("content") || "";
        expect(content).toContain("pet care");
      }
    });
  });

  describe("Open Graph Tags", () => {
    it("should have og:title tag", () => {
      const ogTitle = document.querySelector('meta[property="og:title"]');
      expect(ogTitle).toBeTruthy();
    });

    it("should have og:description tag", () => {
      const ogDescription = document.querySelector('meta[property="og:description"]');
      expect(ogDescription).toBeTruthy();
    });

    it("should have og:type tag", () => {
      const ogType = document.querySelector('meta[property="og:type"]');
      expect(ogType).toBeTruthy();
      
      if (ogType) {
        const content = ogType.getAttribute("content");
        expect(content).toBe("website");
      }
    });

    it("should have og:image tag", () => {
      const ogImage = document.querySelector('meta[property="og:image"]');
      expect(ogImage).toBeTruthy();
    });

    it("should have og:url tag", () => {
      const ogUrl = document.querySelector('meta[property="og:url"]');
      expect(ogUrl).toBeTruthy();
    });

    it("should have og:site_name tag", () => {
      const ogSiteName = document.querySelector('meta[property="og:site_name"]');
      expect(ogSiteName).toBeTruthy();
    });
  });

  describe("Twitter Card Tags", () => {
    it("should have twitter:card tag", () => {
      const twitterCard = document.querySelector('meta[name="twitter:card"]');
      expect(twitterCard).toBeTruthy();
    });

    it("should have twitter:title tag", () => {
      const twitterTitle = document.querySelector('meta[name="twitter:title"]');
      expect(twitterTitle).toBeTruthy();
    });

    it("should have twitter:description tag", () => {
      const twitterDescription = document.querySelector('meta[name="twitter:description"]');
      expect(twitterDescription).toBeTruthy();
    });

    it("should have twitter:image tag", () => {
      const twitterImage = document.querySelector('meta[name="twitter:image"]');
      expect(twitterImage).toBeTruthy();
    });
  });

  describe("Structured Data (JSON-LD)", () => {
    it("should have a JSON-LD script tag", () => {
      const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
      expect(jsonLdScript).toBeTruthy();
    });

    it("should have valid JSON-LD content with SoftwareApplication schema", () => {
      const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
      expect(jsonLdScript).toBeTruthy();
      
      if (jsonLdScript) {
        const content = jsonLdScript.textContent || "";
        expect(content.length).toBeGreaterThan(0);
        
        // Parse and validate JSON structure
        const jsonData = JSON.parse(content);
        expect(jsonData["@context"]).toBe("https://schema.org");
        expect(jsonData["@type"]).toBe("SoftwareApplication");
        expect(jsonData.name).toBeTruthy();
        expect(jsonData.applicationCategory).toBeTruthy();
      }
    });

    it("should have offers information in structured data", () => {
      const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
      expect(jsonLdScript).toBeTruthy();
      
      if (jsonLdScript) {
        const content = jsonLdScript.textContent || "";
        const jsonData = JSON.parse(content);
        
        expect(jsonData.offers).toBeTruthy();
        expect(jsonData.offers["@type"]).toBe("Offer");
        expect(jsonData.offers.price).toBeDefined();
        expect(jsonData.offers.priceCurrency).toBeDefined();
      }
    });

    it("should have feature list in structured data", () => {
      const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
      expect(jsonLdScript).toBeTruthy();
      
      if (jsonLdScript) {
        const content = jsonLdScript.textContent || "";
        const jsonData = JSON.parse(content);
        
        expect(jsonData.featureList).toBeTruthy();
        expect(Array.isArray(jsonData.featureList)).toBe(true);
        expect(jsonData.featureList.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Viewport and Charset", () => {
    it("should have charset meta tag", () => {
      const charset = document.querySelector('meta[charset]');
      expect(charset).toBeTruthy();
    });

    it("should have viewport meta tag", () => {
      const viewport = document.querySelector('meta[name="viewport"]');
      expect(viewport).toBeTruthy();
    });

    it("should have mobile-friendly viewport settings", () => {
      const viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
      expect(viewport).toBeTruthy();
      
      if (viewport) {
        const content = viewport.getAttribute("content") || "";
        expect(content).toContain("width=device-width");
        expect(content).toContain("initial-scale=1");
      }
    });
  });
});
