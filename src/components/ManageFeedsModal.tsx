import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, RotateCcw, Rss, Cpu } from 'lucide-react';
import { FeedConfig } from '../utils/feed';
import { getAISettings, saveAISettings } from '../utils/ai';

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
  const [activeTab, setActiveTab] = useState<'feeds' | 'ai'>('feeds');
  
  // Feed Form States
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('AI & Research');
  const [customCategory, setCustomCategory] = useState('');
  const [error, setError] = useState('');

  // AI Settings States
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai'>('gemini');
  const [aiKey, setAiKey] = useState('');
  const [aiUrl, setAiUrl] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [autoSummarize, setAutoSummarize] = useState(true);
  const [enableAI, setEnableAI] = useState(true);

  // Load AI Settings on Mount/Open
  useEffect(() => {
    if (isOpen) {
      const settings = getAISettings();
      setAiProvider(settings.provider);
      setAiKey(settings.apiKey);
      setAiUrl(settings.baseUrl);
      setAiModel(settings.model);
      setAutoSummarize(settings.autoSummarize);
      setEnableAI(settings.enableAI);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmitFeed = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !url.trim()) {
      setError('Please fill out all fields.');
      return;
    }

    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL (starting with http:// or https://).');
      return;
    }

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

    setTitle('');
    setUrl('');
    setCustomCategory('');
    if (category === 'custom') {
      setCategory('AI & Research');
    }
  };

  const handleAIProviderChange = (provider: 'gemini' | 'openai') => {
    setAiProvider(provider);
    saveAISettings({ provider });
    
    // Clear URL/Model placeholders if the user wants default values
    const settings = getAISettings();
    setAiUrl(settings.baseUrl);
    setAiModel(settings.model);
  };

  const existingCategories = Array.from(new Set(feeds.map(f => f.category)));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card glass" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {activeTab === 'feeds' ? (
              <Rss size={18} style={{ color: 'var(--color-primary)' }} />
            ) : (
              <Cpu size={18} style={{ color: 'var(--color-secondary)' }} />
            )}
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
              {activeTab === 'feeds' ? 'Manage Feed Sources' : 'AI & Study Settings'}
            </h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </header>

        {/* Modal Navigation Tabs */}
        <div className="modal-tabs">
          <button 
            className={`modal-tab ${activeTab === 'feeds' ? 'active' : ''}`}
            onClick={() => setActiveTab('feeds')}
          >
            Feed Sources
          </button>
          <button 
            className={`modal-tab ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            AI Settings
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'feeds' ? (
            <>
              {/* Add Feed Section */}
              <section className="modal-section">
                <h4 className="section-title">Add Feed Source</h4>
                <form onSubmit={handleSubmitFeed} className="feed-form">
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
                    <div className="form-group">
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
            </>
          ) : (
            /* AI Settings Section */
            <section className="modal-section">
              <form onSubmit={(e) => e.preventDefault()} className="feed-form">
                <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <input
                    type="checkbox"
                    id="enableAI"
                    style={{ width: 'auto', cursor: 'pointer' }}
                    checked={enableAI}
                    onChange={(e) => {
                      setEnableAI(e.target.checked);
                      saveAISettings({ enableAI: e.target.checked });
                    }}
                  />
                  <label htmlFor="enableAI" className="form-label" style={{ margin: 0, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                    Enable AI Features & Summaries
                  </label>
                </div>

                {enableAI && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.2s ease' }}>
                    <h4 className="section-title" style={{ marginTop: 0 }}>Configure API Provider</h4>
                    <div className="form-group">
                      <label className="form-label">AI Provider</label>
                      <select
                        className="form-select"
                        value={aiProvider}
                        onChange={(e) => handleAIProviderChange(e.target.value as 'gemini' | 'openai')}
                      >
                        <option value="gemini">Gemini API (Recommended)</option>
                        <option value="openai">OpenAI-Compatible (DeepSeek, Groq, Ollama, OpenRouter)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">API Key</label>
                      <input
                        type="password"
                        className="form-input"
                        placeholder={aiProvider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                        value={aiKey}
                        onChange={(e) => {
                          setAiKey(e.target.value);
                          saveAISettings({ apiKey: e.target.value });
                        }}
                      />
                      <span className="form-help-text" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                        Your key is stored securely in your browser's localStorage and is never shared.
                      </span>
                      {aiProvider === 'openai' && aiKey.startsWith('gsk_') && (
                        <span className="form-help-text" style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.35rem', display: 'block', fontWeight: 500 }}>
                          💡 Groq key detected! Defaulting URL to GroqCloud and model to llama-3.3-70b-versatile if left empty.
                        </span>
                      )}
                      {aiProvider === 'openai' && aiKey.startsWith('sk-or-v1-') && (
                        <span className="form-help-text" style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.35rem', display: 'block', fontWeight: 500 }}>
                          💡 OpenRouter key detected! Defaulting URL to OpenRouter and model to google/gemini-2.5-flash if left empty.
                        </span>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Custom Base URL (Optional)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder={aiProvider === 'gemini' ? 'https://generativelanguage.googleapis.com' : 'https://api.openai.com/v1'}
                        value={aiUrl}
                        onChange={(e) => {
                          setAiUrl(e.target.value);
                          saveAISettings({ baseUrl: e.target.value });
                        }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Model Name (Optional)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder={aiProvider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini'}
                        value={aiModel}
                        onChange={(e) => {
                          setAiModel(e.target.value);
                          saveAISettings({ model: e.target.value });
                        }}
                      />
                    </div>

                    <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <input
                        type="checkbox"
                        id="autoSummarize"
                        style={{ width: 'auto', cursor: 'pointer' }}
                        checked={autoSummarize}
                        onChange={(e) => {
                          setAutoSummarize(e.target.checked);
                          saveAISettings({ autoSummarize: e.target.checked });
                        }}
                      />
                      <label htmlFor="autoSummarize" className="form-label" style={{ margin: 0, cursor: 'pointer', fontSize: '0.85rem' }}>
                        Auto-generate summaries when opening articles
                      </label>
                    </div>
                  </div>
                )}
              </form>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
