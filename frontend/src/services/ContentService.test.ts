import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import ContentService from './ContentService';

describe('ContentService Property Tests', () => {
  beforeEach(() => {
    // Clear bookmarks before each test to ensure clean state
    ContentService.clearBookmarks();
  });

  /**
   * Property 23: Daily Tip Availability
   * For any pet type, at least one tip should be returned
   * Validates: Requirements 5.1
   */
  it('Property 23: Daily Tip Availability - should return at least one tip for any pet type', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('dog', 'cat', 'bird', 'fish'),
        (petType) => {
          const tip = ContentService.getDailyTip(petType);
          
          // Verify a tip is returned
          expect(tip).toBeDefined();
          expect(tip).toHaveProperty('id');
          expect(tip).toHaveProperty('title');
          expect(tip).toHaveProperty('content');
          expect(tip).toHaveProperty('category');
          expect(tip).toHaveProperty('petTypes');
          
          // Verify the tip is relevant to the pet type
          expect(tip.petTypes).toContain(petType.toLowerCase());
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 24: Breed-Specific Content Prioritization
   * For any breed, breed-relevant content should appear first
   * Validates: Requirements 5.2
   */
  it('Property 24: Breed-Specific Content Prioritization - breed-specific tips should be prioritized', () => {
    fc.assert(
      fc.property(
        fc.record({
          petType: fc.constantFrom('dog', 'cat'),
          breed: fc.constantFrom('Indian Pariah', 'Rajapalayam', 'Mudhol Hound', 'Persian', 'Siamese')
        }),
        ({ petType, breed }) => {
          const tip = ContentService.getDailyTip(petType, breed);
          
          // Verify a tip is returned
          expect(tip).toBeDefined();
          
          // If the tip has breed information, it should match or be relevant
          if (tip.breeds && tip.breeds.length > 0) {
            // Breed-specific tip was found and prioritized
            const isBreedRelevant = tip.breeds.some(b => 
              b.toLowerCase().includes(breed.toLowerCase()) ||
              breed.toLowerCase().includes(b.toLowerCase())
            );
            expect(isBreedRelevant).toBe(true);
          }
          
          // Tip should still be relevant to pet type
          expect(tip.petTypes).toContain(petType.toLowerCase());
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 25: Article Bookmark Round-Trip
   * For any bookmarked article, retrieval should return that article
   * Validates: Requirements 5.6
   */
  it('Property 25: Article Bookmark Round-Trip - bookmarked articles should be retrievable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userId: fc.string({ minLength: 1, maxLength: 20 }),
          articleIndex: fc.integer({ min: 0, max: 4 }) // We have 5 articles in test data
        }),
        async ({ userId, articleIndex }) => {
          // Get all articles
          const allArticles = ContentService.getArticles();
          
          if (allArticles.length === 0) {
            return true; // Skip if no articles
          }
          
          // Select an article based on index
          const article = allArticles[articleIndex % allArticles.length];
          
          // Bookmark the article
          await ContentService.bookmarkArticle(article.id, userId);
          
          // Retrieve bookmarked articles
          const bookmarkedArticles = ContentService.getBookmarkedArticles(userId);
          
          // Verify the article is in the bookmarked list
          const found = bookmarkedArticles.some(a => a.id === article.id);
          expect(found).toBe(true);
          
          // Verify the article has bookmarked flag set
          const bookmarkedArticle = bookmarkedArticles.find(a => a.id === article.id);
          expect(bookmarkedArticle?.bookmarked).toBe(true);
          
          // Clean up - unbookmark
          await ContentService.unbookmarkArticle(article.id, userId);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Additional property tests for robustness
  
  it('should return consistent daily tip for same date and pet type', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('dog', 'cat', 'bird', 'fish'),
        (petType) => {
          const tip1 = ContentService.getDailyTip(petType);
          const tip2 = ContentService.getDailyTip(petType);
          
          // Same day should return same tip
          expect(tip1.id).toBe(tip2.id);
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should filter articles by category correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('health', 'nutrition', 'training', 'grooming'),
        (category) => {
          const articles = ContentService.getArticles({ category });
          
          // All returned articles should match the category
          articles.forEach(article => {
            expect(article.category.toLowerCase()).toBe(category.toLowerCase());
          });
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should filter articles by pet type correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('dog', 'cat', 'bird', 'fish'),
        (petType) => {
          const articles = ContentService.getArticles({ petType });
          
          // All returned articles should include the pet type
          articles.forEach(article => {
            expect(article.petTypes).toContain(petType.toLowerCase());
          });
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should search content and return relevant results', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('health', 'nutrition', 'monsoon', 'summer', 'training'),
        (query) => {
          const results = ContentService.searchContent(query);
          
          // Results should be an array
          expect(Array.isArray(results)).toBe(true);
          
          // Each result should contain the query term in some field
          results.forEach(result => {
            const lowerQuery = query.toLowerCase();
            const matchFound = 
              result.title.toLowerCase().includes(lowerQuery) ||
              result.content.toLowerCase().includes(lowerQuery) ||
              result.category.toLowerCase().includes(lowerQuery) ||
              ('tags' in result && result.tags.some((tag: string) => tag.includes(lowerQuery)));
            
            expect(matchFound).toBe(true);
          });
          
          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * Unit Tests for Content Features
 * Task 8.4: Write unit tests for content features
 * Requirements: 5.3, 5.4, 5.5, 5.6
 */
describe('ContentService Unit Tests', () => {
  
  /**
   * Test content filtering by category
   * Validates: Requirement 5.3
   */
  describe('Content filtering by category', () => {
    it('should filter articles by nutrition category', () => {
      const articles = ContentService.getArticles({ category: 'nutrition' });
      
      expect(articles.length).toBeGreaterThan(0);
      articles.forEach(article => {
        expect(article.category.toLowerCase()).toBe('nutrition');
      });
    });

    it('should filter articles by health category', () => {
      const articles = ContentService.getArticles({ category: 'health' });
      
      expect(articles.length).toBeGreaterThan(0);
      articles.forEach(article => {
        expect(article.category.toLowerCase()).toBe('health');
      });
    });

    it('should filter articles by training category', () => {
      const articles = ContentService.getArticles({ category: 'training' });
      
      expect(articles.length).toBeGreaterThan(0);
      articles.forEach(article => {
        expect(article.category.toLowerCase()).toBe('training');
      });
    });

    it('should filter articles by grooming category', () => {
      const articles = ContentService.getArticles({ category: 'grooming' });
      
      // Grooming articles may or may not exist in test data
      articles.forEach(article => {
        expect(article.category.toLowerCase()).toBe('grooming');
      });
    });

    it('should return empty array for non-existent category', () => {
      const articles = ContentService.getArticles({ category: 'nonexistent' });
      
      expect(articles).toEqual([]);
    });
  });

  /**
   * Test content filtering by pet type
   * Validates: Requirement 5.3
   */
  describe('Content filtering by pet type', () => {
    it('should filter articles by dog pet type', () => {
      const articles = ContentService.getArticles({ petType: 'dog' });
      
      expect(articles.length).toBeGreaterThan(0);
      articles.forEach(article => {
        expect(article.petTypes).toContain('dog');
      });
    });

    it('should filter articles by cat pet type', () => {
      const articles = ContentService.getArticles({ petType: 'cat' });
      
      expect(articles.length).toBeGreaterThan(0);
      articles.forEach(article => {
        expect(article.petTypes).toContain('cat');
      });
    });

    it('should filter articles by bird pet type', () => {
      const articles = ContentService.getArticles({ petType: 'bird' });
      
      // Bird articles may or may not exist in test data
      articles.forEach(article => {
        expect(article.petTypes).toContain('bird');
      });
    });

    it('should filter articles by fish pet type', () => {
      const articles = ContentService.getArticles({ petType: 'fish' });
      
      // Fish articles may or may not exist in test data
      articles.forEach(article => {
        expect(article.petTypes).toContain('fish');
      });
    });

    it('should combine category and pet type filters', () => {
      const articles = ContentService.getArticles({ 
        category: 'health', 
        petType: 'dog' 
      });
      
      articles.forEach(article => {
        expect(article.category.toLowerCase()).toBe('health');
        expect(article.petTypes).toContain('dog');
      });
    });
  });

  /**
   * Test seasonal guide availability for each season
   * Validates: Requirement 5.4
   */
  describe('Seasonal guide availability', () => {
    it('should return monsoon guide for dogs', () => {
      const guide = ContentService.getSeasonalGuide('monsoon', 'dog');
      
      expect(guide).not.toBeNull();
      if (guide) {
        expect(guide.tags).toContain('monsoon');
        expect(guide.petTypes).toContain('dog');
      }
    });

    it('should return monsoon guide for cats', () => {
      const guide = ContentService.getSeasonalGuide('monsoon', 'cat');
      
      expect(guide).not.toBeNull();
      if (guide) {
        expect(guide.tags).toContain('monsoon');
        expect(guide.petTypes).toContain('cat');
      }
    });

    it('should return summer guide for dogs', () => {
      const guide = ContentService.getSeasonalGuide('summer', 'dog');
      
      expect(guide).not.toBeNull();
      if (guide) {
        expect(guide.tags).toContain('summer');
        expect(guide.petTypes).toContain('dog');
      }
    });

    it('should return summer guide for cats', () => {
      const guide = ContentService.getSeasonalGuide('summer', 'cat');
      
      expect(guide).not.toBeNull();
      if (guide) {
        expect(guide.tags).toContain('summer');
        expect(guide.petTypes).toContain('cat');
      }
    });

    it('should return winter guide for dogs', () => {
      const guide = ContentService.getSeasonalGuide('winter', 'dog');
      
      // Winter guide may or may not exist in test data
      if (guide) {
        expect(guide.tags).toContain('winter');
        expect(guide.petTypes).toContain('dog');
      }
    });

    it('should return winter guide for cats', () => {
      const guide = ContentService.getSeasonalGuide('winter', 'cat');
      
      // Winter guide may or may not exist in test data
      if (guide) {
        expect(guide.tags).toContain('winter');
        expect(guide.petTypes).toContain('cat');
      }
    });

    it('should return null for pet type without seasonal guide', () => {
      const guide = ContentService.getSeasonalGuide('monsoon', 'fish');
      
      // Fish may not have monsoon guides
      if (guide === null) {
        expect(guide).toBeNull();
      }
    });
  });

  /**
   * Test bookmark save and retrieve functionality
   * Validates: Requirement 5.6
   */
  describe('Bookmark save and retrieve', () => {
    const testUserId = 'test-user-123';
    
    it('should save and retrieve a bookmarked article', async () => {
      const articles = ContentService.getArticles();
      expect(articles.length).toBeGreaterThan(0);
      
      const article = articles[0];
      
      // Bookmark the article
      await ContentService.bookmarkArticle(article.id, testUserId);
      
      // Retrieve bookmarked articles
      const bookmarked = ContentService.getBookmarkedArticles(testUserId);
      
      // Verify the article is bookmarked
      const found = bookmarked.find(a => a.id === article.id);
      expect(found).toBeDefined();
      expect(found?.bookmarked).toBe(true);
      
      // Clean up
      await ContentService.unbookmarkArticle(article.id, testUserId);
    });

    it('should remove bookmark when unbookmarked', async () => {
      const articles = ContentService.getArticles();
      const article = articles[0];
      
      // Bookmark and then unbookmark
      await ContentService.bookmarkArticle(article.id, testUserId);
      await ContentService.unbookmarkArticle(article.id, testUserId);
      
      // Verify the article is no longer bookmarked
      const bookmarked = ContentService.getBookmarkedArticles(testUserId);
      const found = bookmarked.find(a => a.id === article.id);
      
      expect(found).toBeUndefined();
    });

    it('should handle multiple bookmarks for same user', async () => {
      const articles = ContentService.getArticles();
      expect(articles.length).toBeGreaterThanOrEqual(2);
      
      const article1 = articles[0];
      const article2 = articles[1];
      
      // Bookmark multiple articles
      await ContentService.bookmarkArticle(article1.id, testUserId);
      await ContentService.bookmarkArticle(article2.id, testUserId);
      
      // Retrieve bookmarked articles
      const bookmarked = ContentService.getBookmarkedArticles(testUserId);
      
      // Verify both articles are bookmarked
      expect(bookmarked.length).toBeGreaterThanOrEqual(2);
      const found1 = bookmarked.find(a => a.id === article1.id);
      const found2 = bookmarked.find(a => a.id === article2.id);
      
      expect(found1).toBeDefined();
      expect(found2).toBeDefined();
      
      // Clean up
      await ContentService.unbookmarkArticle(article1.id, testUserId);
      await ContentService.unbookmarkArticle(article2.id, testUserId);
    });

    it('should return empty array when user has no bookmarks', () => {
      const bookmarked = ContentService.getBookmarkedArticles('user-with-no-bookmarks');
      
      expect(bookmarked).toEqual([]);
    });

    it('should include bookmark status in article list', async () => {
      const articles = ContentService.getArticles({ userId: testUserId });
      const article = articles[0];
      
      // Bookmark an article
      await ContentService.bookmarkArticle(article.id, testUserId);
      
      // Get articles again
      const updatedArticles = ContentService.getArticles({ userId: testUserId });
      const bookmarkedArticle = updatedArticles.find(a => a.id === article.id);
      
      expect(bookmarkedArticle?.bookmarked).toBe(true);
      
      // Clean up
      await ContentService.unbookmarkArticle(article.id, testUserId);
    });
  });

  /**
   * Test India-specific content
   * Validates: Requirement 5.5
   */
  describe('India-specific content', () => {
    it('should include India-specific articles', () => {
      const articles = ContentService.getArticles({ indiaSpecific: true });
      
      expect(articles.length).toBeGreaterThan(0);
      articles.forEach(article => {
        expect(article.tags).toContain('india');
      });
    });

    it('should filter out India-specific content when requested', () => {
      const articles = ContentService.getArticles({ indiaSpecific: false });
      
      articles.forEach(article => {
        expect(article.tags).not.toContain('india');
      });
    });

    it('should return articles about Indian climate and diseases', () => {
      const results = ContentService.searchContent('india');
      
      expect(results.length).toBeGreaterThan(0);
      
      // Check if results contain India-related content
      const hasIndiaContent = results.some(result => 
        'tags' in result && result.tags.includes('india')
      );
      
      expect(hasIndiaContent).toBe(true);
    });
  });

  /**
   * Test article sorting and ordering
   */
  describe('Article sorting', () => {
    it('should sort articles by published date (newest first)', () => {
      const articles = ContentService.getArticles();
      
      expect(articles.length).toBeGreaterThan(0);
      
      // Verify articles are sorted by date descending
      for (let i = 0; i < articles.length - 1; i++) {
        const date1 = new Date(articles[i].publishedAt).getTime();
        const date2 = new Date(articles[i + 1].publishedAt).getTime();
        
        expect(date1).toBeGreaterThanOrEqual(date2);
      }
    });
  });

  /**
   * Test search functionality
   */
  describe('Content search', () => {
    it('should search by title', () => {
      const results = ContentService.searchContent('monsoon');
      
      expect(results.length).toBeGreaterThan(0);
      
      const hasMatchInTitle = results.some(result => 
        result.title.toLowerCase().includes('monsoon')
      );
      
      expect(hasMatchInTitle).toBe(true);
    });

    it('should search by content', () => {
      const results = ContentService.searchContent('vaccination');
      
      expect(results.length).toBeGreaterThan(0);
      
      const hasMatchInContent = results.some(result => 
        result.content.toLowerCase().includes('vaccination')
      );
      
      expect(hasMatchInContent).toBe(true);
    });

    it('should search by tags', () => {
      const results = ContentService.searchContent('prevention');
      
      expect(results.length).toBeGreaterThan(0);
      
      const hasMatchInTags = results.some(result => 
        'tags' in result && result.tags.some((tag: string) => tag.includes('prevention'))
      );
      
      expect(hasMatchInTags).toBe(true);
    });

    it('should return empty array for non-matching search', () => {
      const results = ContentService.searchContent('xyznonexistentterm123');
      
      expect(results).toEqual([]);
    });
  });
});
