import React from 'react';
import { Calendar, User, Layers, BookOpen, Star } from 'lucide-react';
import { Article } from '../utils/feed';
import { ClusteredArticle } from '../utils/clustering';

interface ArticleCardProps {
  article: ClusteredArticle;
  onSelectArticle: (article: Article) => void;
  isRead: boolean;
  isBookmarked: boolean;
  onToggleBookmark: (article: Article) => void;
  readArticleIds: Set<string>;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onSelectArticle,
  isRead,
  isBookmarked,
  onToggleBookmark,
  readArticleIds
}) => {
  // Format creator to handle multiple authors beautifully
  const formatCreator = (creator: string) => {
    if (!creator) return 'Unknown';
    const parts = creator.split(/, |; | and /);
    if (parts.length > 1) {
      return `${parts[0].trim()} et al.`;
    }
    return creator;
  };

  // Format date to a friendly relative time
  const getRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch (e) {
      return 'Recent';
    }
  };

  // Calculate dynamic reading time based on word count
  const getReadTime = (content: string) => {
    try {
      const text = content.replace(/<[^>]*>/g, ''); // Strip HTML tags
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      const wpm = 220; // Average words per minute
      const minutes = Math.max(1, Math.ceil(wordCount / wpm));
      return `${minutes} min read`;
    } catch {
      return '1 min read';
    }
  };

  return (
    <div className="cluster-card">
      <article className={`article-card ${isRead ? 'read' : ''}`} onClick={() => onSelectArticle(article)}>
        <div className="article-header">
          <span className="feed-badge">{article.feedTitle}</span>
          
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <Calendar size={12} />
            {getRelativeTime(article.pubDate)}
          </span>

          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <BookOpen size={12} />
            {getReadTime(article.content || article.contentSnippet)}
          </span>

          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: 'auto', minWidth: 0 }}>
            <span 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.2rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100px',
                flexShrink: 1
              }}
              title={article.creator}
            >
              <User size={12} style={{ flexShrink: 0 }} />
              <span>{formatCreator(article.creator)}</span>
            </span>
            <button 
              className={`bookmark-btn ${isBookmarked ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(article);
              }}
              title={isBookmarked ? "Remove bookmark" : "Bookmark story"}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                padding: '2px', 
                display: 'flex', 
                alignItems: 'center', 
                color: isBookmarked ? '#F59E0B' : 'var(--text-secondary)',
                transition: 'transform 0.15s ease, color 0.15s ease'
              }}
            >
              <Star size={14} fill={isBookmarked ? '#F59E0B' : 'none'} />
            </button>
          </span>
        </div>
        <h2 className="article-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {!isRead && (
            <span 
              className="unread-dot" 
              title="Unread" 
              style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: 'var(--color-primary)', 
                display: 'inline-block',
                flexShrink: 0
              }}
            />
          )}
          <span>{article.title}</span>
        </h2>
        <p className="article-snippet">{article.contentSnippet}</p>
      </article>

      {/* Cluster related sub-articles coverage */}
      {article.subArticles && article.subArticles.length > 0 && (
        <div className="cluster-sub-list">
          <div className="cluster-sub-header">
            <Layers size={12} />
            <span>Related Coverage ({article.subArticles.length})</span>
          </div>
          {article.subArticles.map((sub) => {
            const isSubRead = readArticleIds.has(sub.id);
            return (
              <div 
                key={sub.id} 
                className={`sub-article-item ${isSubRead ? 'read' : ''}`} 
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectArticle(sub);
                }}
              >
                <h4 className="sub-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {!isSubRead && (
                    <span 
                      className="unread-dot-sub" 
                      style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        background: 'var(--color-primary)', 
                        display: 'inline-block',
                        flexShrink: 0
                      }}
                    />
                  )}
                  <span>{sub.title}</span>
                </h4>
                <div className="sub-meta">
                  <span>{sub.feedTitle}</span>
                  <span>•</span>
                  <span>{getRelativeTime(sub.pubDate)}</span>
                  <span>•</span>
                  <span>{getReadTime(sub.content || sub.contentSnippet)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
