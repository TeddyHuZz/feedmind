import React, { useState, useEffect } from 'react';
import { FeedSidebar } from './components/FeedSidebar';
import { ArticleCard } from './components/ArticleCard';
import { ReaderPanel } from './components/ReaderPanel';
import { ManageFeedsModal } from './components/ManageFeedsModal';
import { Article, FeedConfig, fetchFeedArticles, loadFeedsConfig, addCustomFeed, removeCustomFeed, resetDefaultFeeds } from './utils/feed';
import { clusterArticles } from './utils/clustering';
import { RefreshCw, Newspaper, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';

export const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [articles, setArticles] = useState<Article[]>([]);
  const [feedStatus, setFeedStatus] = useState<Record<string, 'loading' | 'success' | 'error'>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);

  // Dynamic feeds config
  const [feeds, setFeeds] = useState<FeedConfig[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Search & Sorting States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'readTime'>('newest');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when category, articles, search, or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, articles, searchQuery, sortBy]);

  // Disable background scrolling when modal or reader panel is open
  useEffect(() => {
    if (isSettingsOpen || isReaderOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSettingsOpen, isReaderOpen]);

  // Load feeds config from IndexedDB
  const loadFeeds = async () => {
    const config = await loadFeedsConfig();
    setFeeds(config);
    return config;
  };

  // Fetch articles from feeds list
  const fetchArticles = async (force = false, currentFeeds?: FeedConfig[]) => {
    if (force) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const feedsToFetch = currentFeeds || feeds;
    if (feedsToFetch.length === 0) {
      setArticles([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Try parsing from sessionStorage first (only if not forcing refresh)
    if (!force) {
      const cached = sessionStorage.getItem('feedmind_articles');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          // Make sure cached items match current active feeds URLs
          const feedUrls = new Set(feedsToFetch.map(f => f.url));
          const validCached = parsed.filter((art: Article) => feedUrls.has(art.link) || feedsToFetch.some(f => f.title === art.feedTitle));
          
          if (validCached.length > 0) {
            setArticles(validCached);
            
            const statusMap: Record<string, 'success'> = {};
            feedsToFetch.forEach(f => {
              statusMap[f.title] = 'success';
            });
            setFeedStatus(statusMap);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn("Failed to parse cached articles, fetching fresh:", e);
        }
      }
    }

    // Reset status and list
    const initialStatus: Record<string, 'loading'> = {};
    feedsToFetch.forEach(f => {
      initialStatus[f.title] = 'loading';
    });
    setFeedStatus(initialStatus);
    
    if (!force) {
      setArticles([]);
    }

    const loadedArticles: Article[] = [];
    const statusUpdates: Record<string, 'success' | 'error'> = {};
    
    // Fetch all active feeds in parallel
    await Promise.all(
      feedsToFetch.map(async (feed) => {
        try {
          const feedArts = await fetchFeedArticles(feed);
          loadedArticles.push(...feedArts);
          statusUpdates[feed.title] = 'success';
        } catch (err) {
          console.error(`Error loading feed ${feed.title}:`, err);
          statusUpdates[feed.title] = 'error';
        }
      })
    );

    // Sort final list by date descending once
    loadedArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    
    setArticles(loadedArticles);
    setFeedStatus(prev => ({ ...prev, ...statusUpdates }));

    // Save final list to sessionStorage
    sessionStorage.setItem('feedmind_articles', JSON.stringify(loadedArticles));
    setLoading(false);
    setRefreshing(false);
  };

  // Initial load and periodic refresh
  useEffect(() => {
    const init = async () => {
      const activeFeeds = await loadFeeds();
      await fetchArticles(false, activeFeeds);
    };
    init();

    // Auto-refresh feeds every 5 minutes
    const interval = setInterval(async () => {
      const activeFeeds = await loadFeedsConfig();
      await fetchArticles(true, activeFeeds);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Feed Actions
  const handleAddFeed = async (newFeed: FeedConfig) => {
    await addCustomFeed(newFeed);
    const updated = await loadFeeds();
    await fetchArticles(true, updated);
  };

  const handleDeleteFeed = async (url: string) => {
    await removeCustomFeed(url);
    const updated = await loadFeeds();
    await fetchArticles(true, updated);
  };

  const handleResetFeeds = async () => {
    const updated = await resetDefaultFeeds();
    setFeeds(updated);
    await fetchArticles(true, updated);
  };

  // Calculate read time minutes
  const getReadTimeMins = (art: Article) => {
    const text = (art.content || art.contentSnippet || '').replace(/<[^>]*>/g, '');
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    return Math.ceil(wordCount / 220);
  };

  // Filter, sort, and cluster articles using useMemo to optimize rendering performance
  const clusteredArticles = React.useMemo(() => {
    const filtered = articles.filter(art => {
      const matchesCategory = activeCategory === 'All' || art.category === activeCategory;
      const matchesSearch = searchQuery.trim() === '' || 
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.contentSnippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.feedTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.creator.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime();
      }
      if (sortBy === 'readTime') {
        return getReadTimeMins(b) - getReadTimeMins(a);
      }
      return 0;
    });

    return clusterArticles(sorted);
  }, [articles, activeCategory, searchQuery, sortBy]);

  const handleSelectArticle = (article: Article) => {
    setSelectedArticle(article);
    setIsReaderOpen(true);
  };

  const totalPages = Math.ceil(clusteredArticles.length / pageSize);
  const paginatedArticles = clusteredArticles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages.map((page, idx) => {
      if (page === '...') {
        return (
          <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
            &hellip;
          </span>
        );
      }
      return (
        <button
          key={`page-${page}`}
          className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
          onClick={() => setCurrentPage(Number(page))}
        >
          {page}
        </button>
      );
    });
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <FeedSidebar
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        feedStatus={feedStatus}
        feeds={feeds}
        onOpenManageFeeds={() => setIsSettingsOpen(true)}
      />

      {/* Main Dashboard Area */}
      <main className="main-content">
        <header className="top-bar">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {activeCategory} Articles
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {loading ? 'Syncing articles...' : `Showing ${clusteredArticles.length} stories from ${feeds.filter(f => activeCategory === 'All' || f.category === activeCategory).length} sources`}
            </span>
          </div>

          {/* Global Search Bar */}
          <div className="search-bar-container">
            <Search size={16} className="search-bar-icon" />
            <input
              type="text"
              placeholder="Search stories, feeds, authors..."
              className="search-bar-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="search-clear-btn" aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Sorting controls */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="readTime">Reading Time</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={() => fetchArticles(true)}
              className="btn btn-secondary"
              disabled={loading || refreshing}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem' }}
            >
              <RefreshCw 
                size={14} 
                style={{ 
                  animation: (loading || refreshing) ? 'spin-loader 1s linear infinite' : 'none' 
                }} 
              />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {/* Dashboard Feed Section */}
        <section className="dashboard-feed">
          {loading && articles.length === 0 ? (
            // Initial loading shimmer state
            <div className="article-grid">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="shimmer-card">
                  <div className="shimmer shimmer-meta"></div>
                  <div className="shimmer shimmer-title"></div>
                  <div className="shimmer shimmer-text"></div>
                  <div className="shimmer shimmer-text" style={{ width: '60%' }}></div>
                </div>
              ))}
            </div>
          ) : clusteredArticles.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6rem 2rem',
              color: 'var(--text-secondary)',
              gap: '1rem'
            }}>
              <Newspaper size={48} style={{ color: 'var(--bg-accent)', strokeWidth: 1.5 }} />
              <h3 style={{ color: '#fff' }}>No articles found</h3>
              <p style={{ fontSize: '0.85rem' }}>Failed to retrieve articles or search filter is empty.</p>
              <button className="btn btn-primary" onClick={() => fetchArticles(true)}>
                Try Syncing Feeds
              </button>
            </div>
          ) : (
            // Render articles
            <>
              <div className="article-grid">
                {paginatedArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onSelectArticle={handleSelectArticle}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination-container glass">
                  <div className="pagination-info">
                    Showing <strong>{Math.min((currentPage - 1) * pageSize + 1, clusteredArticles.length)}</strong>–<strong>{Math.min(currentPage * pageSize, clusteredArticles.length)}</strong> of <strong>{clusteredArticles.length}</strong> stories
                  </div>
                  
                  <div className="pagination-controls">
                    <button
                      className="pagination-btn"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      title="Previous Page"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {renderPageNumbers()}

                    <button
                      className="pagination-btn"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      title="Next Page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <div className="pagination-size">
                    <span>Show:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="page-size-select"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Settings Panel Modal */}
      <ManageFeedsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        feeds={feeds}
        onAddFeed={handleAddFeed}
        onDeleteFeed={handleDeleteFeed}
        onResetDefaults={handleResetFeeds}
      />

      {/* Article Reader Slide-over drawer */}
      <ReaderPanel
        article={selectedArticle}
        isOpen={isReaderOpen}
        onClose={() => {
          setIsReaderOpen(false);
          setSelectedArticle(null);
        }}
        onOpenSettings={() => {
          setIsReaderOpen(false);
          setSelectedArticle(null);
          setIsSettingsOpen(true);
        }}
      />
    </div>
  );
};
