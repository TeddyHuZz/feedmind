import React, { useState } from 'react';
import { X, Plus, Trash2, RotateCcw, Rss } from 'lucide-react';
import { FeedConfig } from '../utils/feed';

interface ManageFeedsModalProps {
  isOpen: boolean;
  onClose: () => void;
  feeds: FeedConfig[];
  onAddFeed: (feed: FeedConfig) => void;
  onDeleteFeed: (url: string) => void;
  onResetDefaults: () => void;
}

export const ManageFeedsModal: React.FC<ManageFeedsModalProps> = ({
  isOpen,
  onClose,
  feeds,
  onAddFeed,
  onDeleteFeed,
  onResetDefaults
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('AI & Research');
  const [customCategory, setCustomCategory] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !url.trim()) {
      setError('Please fill out all fields.');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL (starting with http:// or https://).');
      return;
    }

    // Check if feed URL already exists
    if (feeds.some(f => f.url.toLowerCase() === url.toLowerCase())) {
      setError('This feed URL is already added.');
      return;
    }

    const finalCategory = category === 'custom' ? customCategory.trim() : category;
    if (category === 'custom' && !customCategory.trim()) {
      setError('Please specify a custom category name.');
      return;
    }

    onAddFeed({
      title: title.trim(),
      url: url.trim(),
      category: finalCategory
    });

    // Reset Form
    setTitle('');
    setUrl('');
    setCustomCategory('');
    if (category === 'custom') {
      setCategory('AI & Research');
    }
  };

  // Get unique existing categories for the dropdown selector
  const existingCategories = Array.from(new Set(feeds.map(f => f.category)));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card glass" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Rss size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Manage Feed Sources</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </header>

        <div className="modal-body">
          {/* Add Feed Section */}
          <section className="modal-section">
            <h4 className="section-title">Add Feed Source</h4>
            <form onSubmit={handleSubmit} className="feed-form">
              <div className="form-group">
                <label className="form-label">Feed Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. OpenAI Research Blog"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">RSS Feed URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/feed.xml"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {existingCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="custom">+ Add Custom Category...</option>
                </select>
              </div>

              {category === 'custom' && (
                <div className="form-group" style={{ animation: 'pulse 0.2s ease' }}>
                  <label className="form-label">Custom Category Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Business & Finance"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    required
                  />
                </div>
              )}

              {error && <div className="form-error">{error}</div>}

              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%', gap: '0.4rem', display: 'flex', justifyContent: 'center' }}>
                <Plus size={16} />
                <span>Add Source</span>
              </button>
            </form>
          </section>

          {/* Active Feeds List */}
          <section className="modal-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 className="section-title" style={{ margin: 0 }}>Active Sources ({feeds.length})</h4>
              <button 
                onClick={onResetDefaults}
                className="btn btn-secondary" 
                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                title="Reset to original default feeds"
              >
                <RotateCcw size={12} />
                <span>Restore Defaults</span>
              </button>
            </div>

            <div className="feeds-list-container">
              {feeds.length === 0 ? (
                <div className="empty-feeds-msg">No feeds active. Please add an RSS feed above.</div>
              ) : (
                feeds.map(feed => (
                  <div key={feed.url} className="feed-list-item">
                    <div className="feed-item-info">
                      <div className="feed-item-title" title={feed.title}>{feed.title}</div>
                      <div className="feed-item-url" title={feed.url}>{feed.url}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className="feed-item-category-badge">{feed.category}</span>
                      <button
                        onClick={() => onDeleteFeed(feed.url)}
                        className="feed-delete-btn"
                        title="Delete Source"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
