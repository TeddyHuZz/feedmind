import React, { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, BookOpen } from 'lucide-react';
import { Article, fetchFullArticleText, FullArticle } from '../utils/feed';

interface ReaderPanelProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReaderPanel: React.FC<ReaderPanelProps> = ({
  article,
  isOpen,
  onClose
}) => {
  const [fullArticle, setFullArticle] = useState<FullArticle | null>(null);
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && article) {
      setFullArticle(null);
      setLoading(true);
      
      // Scroll reader body back to top
      if (bodyRef.current) {
        bodyRef.current.scrollTop = 0;
      }

      fetchFullArticleText(article.link)
        .then(data => {
          setFullArticle(data);
          setLoading(false);
        })
        .catch(err => {
          console.warn("Readability parsing error, falling back to RSS content:", err);
          // Fallback to RSS snippet and content
          setFullArticle({
            title: article.title,
            content: article.content || `<p>${article.contentSnippet}</p>`,
            textContent: article.contentSnippet,
            excerpt: article.contentSnippet,
            byline: article.creator
          });
          setLoading(false);
        });
    }
  }, [isOpen, article]);

  if (!isOpen || !article) return null;

  return (
    <div className={`reader-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div 
        className="reader-drawer" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="reader-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={20} style={{ color: 'var(--color-primary)' }} />
            <h3 
              title={article.feedTitle}
              style={{ 
                textOverflow: 'ellipsis', 
                overflow: 'hidden', 
                whiteSpace: 'nowrap', 
                maxWidth: '280px', 
                fontSize: '1rem',
                color: '#fff'
              }}
            >
              {article.feedTitle}
            </h3>
          </div>
          <button 
            className="reader-close" 
            onClick={onClose} 
            aria-label="Close reader"
          >
            <X size={20} />
          </button>
        </div>

        <div className="reader-body" ref={bodyRef}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="shimmer" style={{ height: '2.5rem', width: '90%' }}></div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="shimmer" style={{ height: '1rem', width: '20%' }}></div>
                <div className="shimmer" style={{ height: '1rem', width: '30%' }}></div>
              </div>
              <div 
                className="shimmer" 
                style={{ height: '1px', width: '100%', opacity: 0.2 }}
              ></div>
              <div className="shimmer" style={{ height: '80px', width: '100%' }}></div>
              <div className="shimmer" style={{ height: '220px', width: '100%' }}></div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h1 style={{ 
                  fontFamily: 'var(--font-sans)', 
                  fontSize: '1.75rem', 
                  lineHeight: '1.3',
                  fontWeight: '700'
                }}>
                  {article.title}
                </h1>
                
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '1rem', 
                  alignItems: 'center', 
                  fontSize: '0.8rem', 
                  color: 'var(--text-secondary)' 
                }}>
                  <span>By <strong style={{ color: '#fff' }}>{fullArticle?.byline || article.creator}</strong></span>
                  <span>•</span>
                  <span>{new Date(article.pubDate).toLocaleString()}</span>
                  <a 
                    href={article.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn btn-secondary"
                    style={{ 
                      marginLeft: 'auto', 
                      padding: '0.35rem 0.75rem', 
                      fontSize: '0.75rem', 
                      borderRadius: '6px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.25rem' 
                    }}
                  >
                    <ExternalLink size={12} />
                    Original Source
                  </a>
                </div>
              </div>

              <div 
                className="reader-content" 
                dangerouslySetInnerHTML={{ __html: fullArticle?.content || '' }} 
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
