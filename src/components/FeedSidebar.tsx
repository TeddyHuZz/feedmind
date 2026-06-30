import React from 'react';
import { Sparkles, Code, Compass, Layers, CheckCircle2, AlertCircle, RefreshCw, Settings, BookOpen, GraduationCap, Laptop, Star, X } from 'lucide-react';
import { FeedConfig } from '../utils/feed';

export const FeedMindLogo: React.FC<{ className?: string; size?: number }> = ({ className, size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ borderRadius: 8, flexShrink: 0 }}
  >
    <defs>
      <linearGradient id="brand-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop stopColor="var(--color-primary)" />
        <stop offset="0.5" stopColor="#A78BFA" />
        <stop offset="1" stopColor="var(--color-secondary)" />
      </linearGradient>
    </defs>
    
    {/* Base squircle gradient shape */}
    <rect width="32" height="32" rx="8" fill="url(#brand-gradient)" />
    
    {/* Interconnected neural/RSS waves nodes */}
    <circle cx="12" cy="12" r="2.2" fill="white" />
    <circle cx="12" cy="20" r="1.8" fill="white" />
    <circle cx="20" cy="12" r="2.2" fill="white" />
    <circle cx="20" cy="20" r="1.8" fill="white" />
    <circle cx="16" cy="9" r="1.5" fill="white" fillOpacity="0.8" />
    
    {/* Connections */}
    <path d="M12 12L16 9L20 12" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.8" />
    <path d="M12 12V20" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M20 12V20" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M12 16H20" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 20C14 21.5 18 21.5 20 20" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

interface FeedSidebarProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  feedStatus: Record<string, 'loading' | 'success' | 'error'>;
  feeds: FeedConfig[];
  onOpenManageFeeds: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const FeedSidebar: React.FC<FeedSidebarProps> = ({
  activeCategory,
  onSelectCategory,
  feedStatus,
  feeds,
  onOpenManageFeeds,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const standardCategoryMap: Record<string, React.ReactNode> = {
    'All': <Layers size={18} />,
    'Bookmarks': <Star size={18} />,
    'Artificial Intelligence': <Sparkles size={18} />,
    'Software Engineering': <Code size={18} />,
    'Design & Frontend': <Laptop size={18} />,
    'Tech News & Startups': <Compass size={18} />,
    'Science & Research': <GraduationCap size={18} />
  };

  const dynamicCategoryNames = Array.from(new Set(feeds.map(f => f.category)));

  const categories = [
    { name: 'All', icon: <Layers size={18} /> },
    { name: 'Bookmarks', icon: <Star size={18} /> },
    ...dynamicCategoryNames.map(name => ({
      name,
      icon: standardCategoryMap[name] || <BookOpen size={18} />
    }))
  ];

  return (
    <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
      {/* Self-contained spin animation stylesheet */}
      <style>{`
        @keyframes spin-loader {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="sidebar-brand">
        <FeedMindLogo />
        <h1 className="sidebar-title">FeedMind</h1>
        {onCloseMobile && (
          <button 
            className="sidebar-close-btn" 
            onClick={onCloseMobile}
            aria-label="Close sidebar menu"
          >
            <X size={18} />
          </button>
        )}
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
