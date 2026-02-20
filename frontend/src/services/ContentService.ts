import tipsData from '../data/tips.json';
import articlesData from '../data/articles.json';

export interface Tip {
  id: string;
  title: string;
  content: string;
  category: 'nutrition' | 'training' | 'health' | 'grooming';
  petTypes: string[];
  breeds?: string[];
  seasonal?: 'monsoon' | 'summer' | 'winter' | null;
  indiaSpecific: boolean;
  priority: number;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  petTypes: string[];
  tags: string[];
  readTime: number;
  publishedAt: string;
  bookmarked?: boolean;
}

export interface ArticleFilters {
  category?: string;
  petType?: string;
  tags?: string[];
  indiaSpecific?: boolean;
  userId?: string; // For bookmark status
}

class ContentService {
  private tips: Tip[] = tipsData as Tip[];
  private articles: Article[] = articlesData as Article[];
  private bookmarks: Map<string, Set<string>> = new Map(); // userId -> Set of articleIds
  private dbName = 'PetCareDB';
  private dbVersion = 2;

  constructor() {
    this.loadBookmarks();
  }

  /**
   * Get daily tip based on pet type and optional breed
   * Uses date-based rotation to ensure consistent tip per day
   */
  getDailyTip(petType: string, breed?: string): Tip {
    // Filter tips by pet type
    let filteredTips = this.tips.filter(tip => 
      tip.petTypes.includes(petType.toLowerCase())
    );

    // Prioritize breed-specific tips if breed is provided
    if (breed) {
      const breedSpecificTips = filteredTips.filter(tip => 
        tip.breeds && tip.breeds.some(b => 
          b.toLowerCase().includes(breed.toLowerCase())
        )
      );
      
      if (breedSpecificTips.length > 0) {
        filteredTips = breedSpecificTips;
      }
    }

    // Prioritize seasonal tips based on current month
    const currentMonth = new Date().getMonth();
    let season: 'monsoon' | 'summer' | 'winter' | null = null;
    
    if (currentMonth >= 5 && currentMonth <= 8) {
      season = 'monsoon'; // June to September
    } else if (currentMonth >= 2 && currentMonth <= 5) {
      season = 'summer'; // March to June
    } else {
      season = 'winter'; // October to February
    }

    const seasonalTips = filteredTips.filter(tip => tip.seasonal === season);
    if (seasonalTips.length > 0) {
      filteredTips = seasonalTips;
    }

    // Use date-based hash for consistent daily rotation
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    const index = dayOfYear % filteredTips.length;

    return filteredTips[index] || filteredTips[0];
  }

  /**
   * Get articles with optional filtering
   */
  getArticles(filters: ArticleFilters = {}): Article[] {
    let filtered = [...this.articles];

    // Filter by category
    if (filters.category) {
      filtered = filtered.filter(article => 
        article.category.toLowerCase() === filters.category!.toLowerCase()
      );
    }

    // Filter by pet type
    if (filters.petType) {
      filtered = filtered.filter(article => 
        article.petTypes.includes(filters.petType!.toLowerCase())
      );
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(article => 
        filters.tags!.some(tag => article.tags.includes(tag.toLowerCase()))
      );
    }

    // Filter by India-specific content
    if (filters.indiaSpecific !== undefined) {
      filtered = filtered.filter(article => 
        article.tags.includes('india') === filters.indiaSpecific
      );
    }

    // Add bookmark status
    const userId = filters.userId || 'current-user'; // Default to current-user if not specified
    filtered = filtered.map(article => ({
      ...article,
      bookmarked: this.isBookmarked(article.id, userId)
    }));

    // Sort by published date (newest first)
    filtered.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    return filtered;
  }

  /**
   * Get seasonal guide for specific season and pet type
   */
  getSeasonalGuide(season: 'monsoon' | 'summer' | 'winter', petType: string): Article | null {
    const seasonalArticles = this.articles.filter(article => 
      article.tags.includes(season) && 
      article.petTypes.includes(petType.toLowerCase())
    );

    return seasonalArticles[0] || null;
  }

  /**
   * Bookmark an article
   */
  async bookmarkArticle(articleId: string, userId: string): Promise<void> {
    if (!this.bookmarks.has(userId)) {
      this.bookmarks.set(userId, new Set());
    }
    this.bookmarks.get(userId)!.add(articleId);
    
    try {
      await this.saveBookmark(articleId, userId);
    } catch (error) {
      // If save fails, remove from Set to maintain consistency
      this.bookmarks.get(userId)?.delete(articleId);
      throw error;
    }
  }

  /**
   * Remove bookmark from an article
   */
  async unbookmarkArticle(articleId: string, userId: string): Promise<void> {
    this.bookmarks.get(userId)?.delete(articleId);
    
    try {
      await this.removeBookmark(articleId, userId);
    } catch (error) {
      // If removal fails, add back to Set to maintain consistency
      if (!this.bookmarks.has(userId)) {
        this.bookmarks.set(userId, new Set());
      }
      this.bookmarks.get(userId)!.add(articleId);
      throw error;
    }
  }

  /**
   * Get all bookmarked articles for a user
   */
  getBookmarkedArticles(userId: string): Article[] {
    const userBookmarks = this.bookmarks.get(userId) || new Set();
    return this.articles
      .filter(article => userBookmarks.has(article.id))
      .map(article => ({
        ...article,
        bookmarked: true
      }));
  }

  /**
   * Check if an article is bookmarked by a user
   */
  private isBookmarked(articleId: string, userId: string): boolean {
    return this.bookmarks.get(userId)?.has(articleId) || false;
  }

  /**
   * Search content by query string
   */
  searchContent(query: string): (Tip | Article)[] {
    const lowerQuery = query.toLowerCase();
    const results: (Tip | Article)[] = [];

    // Search tips
    const matchingTips = this.tips.filter(tip => 
      tip.title.toLowerCase().includes(lowerQuery) ||
      tip.content.toLowerCase().includes(lowerQuery) ||
      tip.category.toLowerCase().includes(lowerQuery)
    );
    results.push(...matchingTips);

    // Search articles
    const matchingArticles = this.articles.filter(article => 
      article.title.toLowerCase().includes(lowerQuery) ||
      article.summary.toLowerCase().includes(lowerQuery) ||
      article.content.toLowerCase().includes(lowerQuery) ||
      article.tags.some(tag => tag.includes(lowerQuery))
    ).map(article => ({
      ...article,
      bookmarked: this.isBookmarked(article.id, 'current-user') // TODO: Get actual userId from context
    }));
    results.push(...matchingArticles);

    return results;
  }

  // IndexedDB operations for bookmarks
  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create bookmarks store if it doesn't exist
        if (!db.objectStoreNames.contains('bookmarks')) {
          const bookmarkStore = db.createObjectStore('bookmarks', { keyPath: 'id' });
          bookmarkStore.createIndex('userId', 'userId', { unique: false });
          bookmarkStore.createIndex('articleId', 'articleId', { unique: false });
        }
      };
    });
  }

  private async saveBookmark(articleId: string, userId: string): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['bookmarks'], 'readwrite');
      const store = transaction.objectStore('bookmarks');
      
      const bookmark = {
        id: `${userId}-${articleId}`,
        userId,
        articleId,
        createdAt: new Date().toISOString()
      };

      store.put(bookmark);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Error saving bookmark:', error);
    }
  }

  private async removeBookmark(articleId: string, userId: string): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['bookmarks'], 'readwrite');
      const store = transaction.objectStore('bookmarks');
      
      store.delete(`${userId}-${articleId}`);

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  }

  private async loadBookmarks(): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['bookmarks'], 'readonly');
      const store = transaction.objectStore('bookmarks');
      const request = store.getAll();

      request.onsuccess = () => {
        const bookmarks = request.result;
        this.bookmarks.clear();
        bookmarks.forEach((b: any) => {
          if (!this.bookmarks.has(b.userId)) {
            this.bookmarks.set(b.userId, new Set());
          }
          this.bookmarks.get(b.userId)!.add(b.articleId);
        });
      };
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  }

  /**
   * Clear all bookmarks (for testing purposes)
   */
  clearBookmarks(): void {
    this.bookmarks.clear();
  }
}

export default new ContentService();
