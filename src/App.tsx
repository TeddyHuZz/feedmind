import React, { useState, useEffect } from 'react';
import { FeedSidebar } from './components/FeedSidebar';
import { ArticleCard } from './components/ArticleCard';
import { ReaderPanel } from './components/ReaderPanel';
import { FEEDS, Article, fetchFeedArticles } from './utils/feed';
import { RefreshCw, Newspaper, ChevronLeft, ChevronRight } from 'lucide-react';

export const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [articles, setArticles] = useState<Article[]>([]);
  const [feedStatus, setFeedStatus] = useState<Record<string, 'loading' | 'success' | 'error'>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when category or articles change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, articles]);

  // Load feeds incrementally
  const fetchArticles = async (force = false) => {
    if (force) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    // Try parsing from sessionStorage first
    if (!force) {
      const cached = sessionStorage.getItem('feedmind_articles');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setArticles(parsed);
          
          const statusMap: Record<string, 'success'> = {};
          FEEDS.forEach(f => {
            statusMap[f.title] = 'success';
          });
          setFeedStatus(statusMap);
          setLoading(false);
          return;
        } catch (e) {
          console.warn("Failed to parse cached articles, fetching fresh:", e);
        }
      }
    }

    // Reset status and list
    const initialStatus: Record<string, 'loading'> = {};
    FEEDS.forEach(f => {
      initialStatus[f.title] = 'loading';
    });
    setFeedStatus(initialStatus);
    
    if (force) {
      // Keep existing list on refresh
    } else {
      setArticles([]);
    }

    const loadedArticles: Article[] = [];
    
    // Fetch all feeds in parallel, append items, and update status
    await Promise.all(
      FEEDS.map(async (feed) => {
        try {
          const feedArts = await fetchFeedArticles(feed);
          loadedArticles.push(...feedArts);
          
          // Re-sort current articles by date descending
          loadedArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
          
          // Set state incrementally to make UI responsive
          setArticles([...loadedArticles]);
          setFeedStatus(prev => ({ ...prev, [feed.title]: 'success' }));
        } catch (err) {
          console.error(`Error loading feed ${feed.title}:`, err);
          setFeedStatus(prev => ({ ...prev, [feed.title]: 'error' }));
        }
      })
    );

    // Save final list to sessionStorage
    sessionStorage.setItem('feedmind_articles', JSON.stringify(loadedArticles));
    setLoading(false);
    setRefreshing(false);
  };

  // Initial load and periodic refresh
  useEffect(() => {
    fetchArticles();

    // Auto-refresh feeds every 5 minutes
    const interval = setInterval(() => {
      fetchArticles(true);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Filter articles based on active category
  const filteredArticles = activeCategory === 'All'
    ? articles
    : articles.filter(art => art.category === activeCategory);

  const handleSelectArticle = (article: Article) => {
    setSelectedArticle(article);
    setIsReaderOpen(true);
  };

  const totalPages = Math.ceil(filteredArticles.length / pageSize);
  const paginatedArticles = filteredArticles.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
        feeds={FEEDS}
        onOpenManageFeeds={() => {}}
      />

      {/* Main Dashboard Area */}
      <main className="main-content">
        <header className="top-bar">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {activeCategory} Articles
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {loading ? 'Syncing articles...' : `Showing ${filteredArticles.length} articles from ${FEEDS.filter(f => activeCategory === 'All' || f.category === activeCategory).length} sources`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
          ) : filteredArticles.length === 0 ? (
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
              <p style={{ fontSize: '0.85rem' }}>Failed to retrieve articles or category is empty.</p>
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
                    Showing <strong>{Math.min((currentPage - 1) * pageSize + 1, filteredArticles.length)}</strong>–<strong>{Math.min(currentPage * pageSize, filteredArticles.length)}</strong> of <strong>{filteredArticles.length}</strong> articles
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

      {/* Article Reader Slide-over drawer */}
      <ReaderPanel
        article={selectedArticle}
        isOpen={isReaderOpen}
        onClose={() => {
          setIsReaderOpen(false);
          setSelectedArticle(null);
        }}
      />
    </div>
  );
};
