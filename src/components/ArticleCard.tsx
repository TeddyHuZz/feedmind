import React from 'react';
import { Calendar, User } from 'lucide-react';
import { Article } from '../utils/feed';

interface ArticleCardProps {
  article: Article;
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

      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch (e) {
      return 'Recent';
    }
  };

  return (
    <div className="cluster-card" onClick={() => onSelectArticle(article)}>
      <article className="article-card" style={{ borderBottom: 'none' }}>
        <div className="article-header">
          <span className="feed-badge">{article.feedTitle}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <Calendar size={12} />
            {getRelativeTime(article.pubDate)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: 'auto' }}>
            <User size={12} />
            {article.creator}
          </span>
        </div>
        <h2 className="article-title">{article.title}</h2>
        <p className="article-snippet">{article.contentSnippet}</p>
      </article>
    </div>
  );
};
