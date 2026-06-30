import React, { useState } from 'react';
import { Calendar, User, Newspaper, ChevronDown, ChevronUp } from 'lucide-react';
import { Article } from '../utils/feed';
import { Cluster } from '../utils/clustering';

interface ArticleCardProps {
  cluster: Cluster;
  onSelectArticle: (article: Article) => void;
  isGroupedMode: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  cluster,
  onSelectArticle,
  isGroupedMode
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { leadArticle, articles } = cluster;
  const hasRelated = articles.length > 1;

  // Format date to a friendly relative time
  const getRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch (e) {
      return 'Recent';
    }
  };

  if (!isGroupedMode) {
    return (
      <div className="cluster-card" onClick={() => onSelectArticle(leadArticle)}>
        <article className="article-card" style={{ borderBottom: 'none' }}>
          <div className="article-header">
            <span className="feed-badge">{leadArticle.feedTitle}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <Calendar size={12} />
              {getRelativeTime(leadArticle.pubDate)}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: 'auto' }}>
              <User size={12} />
              {leadArticle.creator}
            </span>
          </div>
          <h2 className="article-title">{leadArticle.title}</h2>
          <p className="article-snippet">{leadArticle.contentSnippet}</p>
        </article>
      </div>
    );
  }

  return (
    <div className="cluster-card">
      <article className="article-card" onClick={() => onSelectArticle(leadArticle)}>
        <div className="article-header">
          <span 
            className="feed-badge" 
            style={{ 
              background: 'var(--color-primary-light)', 
              border: '1px solid rgba(139, 92, 246, 0.2)', 
              color: 'var(--color-primary-hover)' 
            }}
          >
            {leadArticle.feedTitle}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <Calendar size={12} />
            {getRelativeTime(leadArticle.pubDate)}
          </span>
          
          {hasRelated && (
            <span 
              onClick={(e) => {
                e.stopPropagation(); // Avoid selecting the lead article
                setIsExpanded(!isExpanded);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                background: 'var(--color-secondary-light)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                color: 'var(--color-secondary)',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.7rem'
              }}
            >
              <Newspaper size={11} />
              {articles.length} sources
              {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </span>
          )}
          
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: 'auto' }}>
            <User size={12} />
            {leadArticle.creator}
          </span>
        </div>
        <h2 className="article-title">{leadArticle.title}</h2>
        <p className="article-snippet">{leadArticle.contentSnippet}</p>
      </article>

      {/* Render alternative articles when expanded */}
      {hasRelated && isExpanded && (
        <div className="cluster-sub-list">
          <div className="cluster-sub-header">
            <Newspaper size={12} />
            <span>Alternative Perspectives & Sources</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {articles.slice(1).map(article => (
              <div 
                key={article.id} 
                className="sub-article-item"
                onClick={() => onSelectArticle(article)}
              >
                <h3 className="sub-title">{article.title}</h3>
                <div className="sub-meta">
                  <span style={{ color: 'var(--color-secondary)', fontWeight: 600 }}>{article.feedTitle}</span>
                  <span>•</span>
                  <span>{getRelativeTime(article.pubDate)}</span>
                  <span>•</span>
                  <span>By {article.creator}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
