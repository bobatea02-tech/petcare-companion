/**
 * Article List Component
 * Displays a filterable list of pet care articles with bookmark functionality
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ContentService, { Article, ArticleFilters } from '@/services/ContentService';
import { Bookmark, BookmarkCheck, Clock, Search, Tag, BookOpen } from 'lucide-react';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/LoadingStates';

interface ArticleListProps {
  userId: string;
  initialFilters?: ArticleFilters;
}

export const ArticleList: React.FC<ArticleListProps> = ({ userId, initialFilters = {} }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filters, setFilters] = useState<ArticleFilters>(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadArticles();
  }, [filters]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const filteredArticles = ContentService.getArticles(filters);
      setArticles(filteredArticles);
    } catch (err) {
      console.error('Error loading articles:', err);
      setError('Failed to load articles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      if (searchQuery.trim()) {
        const results = ContentService.searchContent(searchQuery);
        const articleResults = results.filter(
          (item): item is Article => 'summary' in item
        );
        setArticles(articleResults);
      } else {
        await loadArticles();
      }
    } catch (err) {
      console.error('Error searching articles:', err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async (article: Article) => {
    try {
      if (article.bookmarked) {
        await ContentService.unbookmarkArticle(article.id, userId);
      } else {
        await ContentService.bookmarkArticle(article.id, userId);
      }
      await loadArticles();
    } catch (err) {
      console.error('Error bookmarking article:', err);
      // Silently fail for bookmark operations
    }
  };

  const handleFilterChange = (key: keyof ArticleFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
    }));
  };

  // Show loading state
  if (loading && articles.length === 0) {
    return <LoadingSpinner message="Loading articles..." />;
  }

  // Show error state
  if (error) {
    return (
      <ErrorState
        title="Failed to Load Articles"
        message={error}
        onRetry={loadArticles}
      />
    );
  }

  return (
    <div className="space-y-4 p-4" role="region" aria-label="Pet Care Articles">
      {/* Search and Filters */}
      <Card className="bg-cream-50 border-sage-200">
        <CardHeader>
          <CardTitle className="font-anton text-forest-800">Pet Care Articles</CardTitle>
          <CardDescription className="font-inter text-sage-600">
            Browse curated articles and guides
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 font-inter"
            />
            <Button
              onClick={handleSearch}
              className="bg-forest-600 hover:bg-forest-700 text-white"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={filters.category || 'all'}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="px-3 py-2 rounded-md border border-sage-200 bg-white font-inter text-sm"
            >
              <option value="all">All Categories</option>
              <option value="health">Health</option>
              <option value="nutrition">Nutrition</option>
              <option value="training">Training</option>
              <option value="grooming">Grooming</option>
            </select>

            <select
              value={filters.petType || 'all'}
              onChange={(e) => handleFilterChange('petType', e.target.value)}
              className="px-3 py-2 rounded-md border border-sage-200 bg-white font-inter text-sm"
            >
              <option value="all">All Pets</option>
              <option value="dog">Dogs</option>
              <option value="cat">Cats</option>
              <option value="bird">Birds</option>
              <option value="fish">Fish</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Article List */}
      <div className="space-y-3">
        {articles.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-12 h-12" />}
            title="No Articles Found"
            description="Try adjusting your filters or search query to find articles."
            action={{
              label: "Clear Filters",
              onClick: () => {
                setFilters({});
                setSearchQuery('');
              }
            }}
          />
        ) : (
          articles.map((article) => (
            <Card
              key={article.id}
              className="bg-white border-sage-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedArticle(article)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="font-inter font-semibold text-forest-800 text-base">
                      {article.title}
                    </CardTitle>
                    <CardDescription className="font-inter text-sage-600 text-sm mt-1">
                      {article.summary}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookmark(article);
                    }}
                    className="ml-2"
                  >
                    {article.bookmarked ? (
                      <BookmarkCheck className="w-5 h-5 text-forest-600" />
                    ) : (
                      <Bookmark className="w-5 h-5 text-sage-400" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 text-xs font-inter text-sage-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{article.readTime} min read</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Tag className="w-3 h-3" />
                    <span className="capitalize">{article.category}</span>
                  </div>
                  {article.tags.includes('india') && (
                    <span className="px-2 py-0.5 rounded-full bg-forest-100 text-forest-700">
                      🇮🇳 India
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedArticle(null)}
        >
          <Card
            className="bg-white max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="font-anton text-forest-800 text-xl">
                  {selectedArticle.title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBookmark(selectedArticle)}
                >
                  {selectedArticle.bookmarked ? (
                    <BookmarkCheck className="w-5 h-5 text-forest-600" />
                  ) : (
                    <Bookmark className="w-5 h-5 text-sage-400" />
                  )}
                </Button>
              </div>
              <CardDescription className="font-inter text-sage-600">
                {selectedArticle.summary}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4 text-sm font-inter text-sage-600">
                <span className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{selectedArticle.readTime} min read</span>
                </span>
                <span className="capitalize">{selectedArticle.category}</span>
              </div>
              <div className="prose prose-sm max-w-none">
                <div
                  className="font-inter text-forest-700 leading-relaxed whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-4 border-t border-sage-100">
                {selectedArticle.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-full text-xs font-inter bg-sage-100 text-sage-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Button
                onClick={() => setSelectedArticle(null)}
                className="w-full bg-forest-600 hover:bg-forest-700 text-white"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
