import React from 'react';
import { Sparkles, Code, Globe, Layers, CheckCircle2, AlertCircle, RefreshCw, Settings, BookOpen } from 'lucide-react';
import { FeedConfig } from '../utils/feed';

interface FeedSidebarProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  feedStatus: Record<string, 'loading' | 'success' | 'error'>;
  feeds: FeedConfig[];
  onOpenManageFeeds: () => void;
}

export const FeedSidebar: React.FC<FeedSidebarProps> = ({
  activeCategory,
  onSelectCategory,
  feedStatus,
  feeds,
  onOpenManageFeeds
}) => {
  const standardCategoryMap: Record<string, React.ReactNode> = {
    'All': <Layers size={18} />,
    'AI & Research': <Sparkles size={18} />,
    'Dev & Design': <Code size={18} />,
    'Tech & Science': <Globe size={18} />
  };

  const dynamicCategoryNames = Array.from(new Set(feeds.map(f => f.category)));

  const categories = [
    { name: 'All', icon: <Layers size={18} /> },
    ...dynamicCategoryNames.map(name => ({
      name,
      icon: standardCategoryMap[name] || <BookOpen size={18} />
    }))
  ];

  return (
    <aside className="sidebar">
      {/* Self-contained spin animation stylesheet */}
      <style>{`
        @keyframes spin-loader {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="sidebar-brand">
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '1.1rem'
        }}>F</div>
        <span className="sidebar-title">FeedMind</span>
      </div>

      <ul className="sidebar-menu">
        {categories.map(cat => (
          <li
            key={cat.name}
            className={`menu-item ${activeCategory === cat.name ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat.name)}
          >
            {cat.icon}
            <span>{cat.name}</span>
          </li>
        ))}
      </ul>

      <div className="feed-status-list">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '0.6rem',
          paddingRight: '4px'
        }}>
          <h3 className="feed-status-title" style={{ margin: 0 }}>Feed Sources</h3>
          <button
            onClick={onOpenManageFeeds}
            className="sidebar-settings-btn"
            title="Manage Feed Sources"
          >
            <Settings size={14} />
          </button>
        </div>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.4rem', 
          overflowY: 'auto', 
          maxHeight: '220px', 
          paddingRight: '4px' 
        }}>
          {feeds.map(feed => {
            const status = feedStatus[feed.title] || 'loading';
            return (
              <div key={feed.url} className="feed-status-item">
                <span 
                  title={feed.title}
                  style={{ 
                    textOverflow: 'ellipsis', 
                    overflow: 'hidden', 
                    whiteSpace: 'nowrap', 
                    maxWidth: '170px' 
                  }}
                >
                  {feed.title}
                </span>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {status === 'loading' && (
                    <RefreshCw 
                      size={12} 
                      style={{ 
                        animation: 'spin-loader 1.5s linear infinite', 
                        color: 'var(--color-secondary)' 
                      }} 
                    />
                  )}
                  {status === 'success' && (
                    <CheckCircle2 size={12} style={{ color: '#10b981' }} />
                  )}
                  {status === 'error' && (
                    <AlertCircle size={12} style={{ color: '#ef4444' }} />
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
