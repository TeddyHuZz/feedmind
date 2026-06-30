import React from 'react';
import { Calendar, User, Layers, BookOpen } from 'lucide-react';
import { Article } from '../utils/feed';
import { ClusteredArticle } from '../utils/clustering';

interface ArticleCardProps {
  article: ClusteredArticle;
  onSelectArticle: (article: Article) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onSelectArticle
}) => {
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
      <article className="article-card" onClick={() => onSelectArticle(article)}>
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

          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: 'auto' }}>
            <User size={12} />
            {article.creator}
          </span>
        </div>
        <h2 className="article-title">{article.title}</h2>
        <p className="article-snippet">{article.contentSnippet}</p>
      </article>

      {/* Cluster related sub-articles coverage */}
      {article.subArticles && article.subArticles.length > 0 && (
        <div className="cluster-sub-list">
          <div className="cluster-sub-header">
            <Layers size={12} />
            <span>Related Coverage ({article.subArticles.length})</span>
          </div>
          {article.subArticles.map((sub) => (
            <div 
              key={sub.id} 
              className="sub-article-item" 
              onClick={(e) => {
                e.stopPropagation();
                onSelectArticle(sub);
              }}
            >
              <h4 className="sub-title">{sub.title}</h4>
              <div className="sub-meta">
                <span>{sub.feedTitle}</span>
                <span>•</span>
                <span>{getRelativeTime(sub.pubDate)}</span>
                <span>•</span>
                <span>{getReadTime(sub.content || sub.contentSnippet)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
