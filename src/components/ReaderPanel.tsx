import React, { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, BookOpen, Sparkles, GraduationCap, AlertTriangle, Key, ArrowRight, Check, CheckCircle2, HelpCircle } from 'lucide-react';
import { Article, fetchFullArticleText, FullArticle } from '../utils/feed';
import { AISummaryAndStudy, getAISettings, generateAISummaryAndStudy } from '../utils/ai';
import { getStoredAICache, saveStoredAICache } from '../utils/db';

interface ReaderPanelProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export const ReaderPanel: React.FC<ReaderPanelProps> = ({
  article,
  isOpen,
  onClose,
  onOpenSettings
}) => {
  const [fullArticle, setFullArticle] = useState<FullArticle | null>(null);
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'article' | 'summary' | 'study'>('article');

  // AI Generation States
  const [aiData, setAiData] = useState<AISummaryAndStudy | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Interactive Quiz State (maps questionIndex -> selectedOptionIndex)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    if (isOpen && article) {
      setFullArticle(null);
      setAiData(null);
      setAiError(null);
      setSelectedAnswers({});
      setActiveTab('article');
      setLoading(true);
      
      // Scroll reader body back to top
      if (bodyRef.current) {
        bodyRef.current.scrollTop = 0;
      }

      fetchFullArticleText(article.link)
        .then(data => {
          setFullArticle(data);
          setLoading(false);
          
          // Auto-summarize in background if enabled and key is configured
          const settings = getAISettings();
          if (settings.autoSummarize && settings.apiKey) {
            triggerAIFetch(article.title, data.textContent || data.excerpt || article.contentSnippet);
          }
        })
        .catch(err => {
          console.warn("Readability parsing error, falling back to RSS content:", err);
          const fallbackData = {
            title: article.title,
            content: article.content || `<p>${article.contentSnippet}</p>`,
            textContent: article.contentSnippet,
            excerpt: article.contentSnippet,
            byline: article.creator
          };
          setFullArticle(fallbackData);
          setLoading(false);
          
          const settings = getAISettings();
          if (settings.autoSummarize && settings.apiKey) {
            triggerAIFetch(article.title, fallbackData.textContent);
          }
        });
    }
  }, [isOpen, article]);

  // AI fetch trigger
  const triggerAIFetch = async (title: string, textContent: string) => {
    if (!article) return;
    setAiLoading(true);
    setAiError(null);

    try {
      // 1. Check local IndexedDB cache
      const cached = await getStoredAICache(article.link);
      if (cached) {
        setAiData(cached);
        setAiLoading(false);
        return;
      }

      // 2. Call API
      const settings = getAISettings();
      if (!settings.apiKey) {
        throw new Error('API Key is missing. Please add your key in the settings panel.');
      }

      const generated = await generateAISummaryAndStudy(title, textContent);
      setAiData(generated);

      // 3. Cache to database
      await saveStoredAICache(article.link, generated);
    } catch (err: any) {
      console.error("AI fetch failed:", err);
      setAiError(err.message || 'Failed to fetch AI generated details.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleTabChange = (tab: 'article' | 'summary' | 'study') => {
    setActiveTab(tab);
    if ((tab === 'summary' || tab === 'study') && !aiData && !aiLoading && !aiError && article) {
      const text = fullArticle?.textContent || fullArticle?.excerpt || article.contentSnippet || '';
      triggerAIFetch(article.title, text);
    }
  };

  const handleSelectAnswer = (qIdx: number, optIdx: number) => {
    // Prevent changing answer once selected
    if (selectedAnswers[qIdx] !== undefined) return;
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  if (!isOpen || !article) return null;

  const settings = getAISettings();
  const isApiKeyMissing = !settings.apiKey;

  return (
    <div className={`reader-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div 
        className="reader-drawer" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header containing feed title */}
        <div className="reader-header" style={{ paddingBottom: '0.75rem' }}>
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

        {/* Reader tabs */}
        <div className="reader-tabs" style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-surface)',
          padding: '0 2rem'
        }}>
          <button 
            className={`reader-tab ${activeTab === 'article' ? 'active' : ''}`}
            onClick={() => handleTabChange('article')}
          >
            <BookOpen size={14} />
            <span>Article</span>
          </button>
          <button 
            className={`reader-tab ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => handleTabChange('summary')}
          >
            <Sparkles size={14} />
            <span>AI Summary</span>
          </button>
          <button 
            className={`reader-tab ${activeTab === 'study' ? 'active' : ''}`}
            onClick={() => handleTabChange('study')}
          >
            <GraduationCap size={14} />
            <span>Study Assistant</span>
          </button>
        </div>

        {/* Reader body */}
        <div className="reader-body" ref={bodyRef}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="shimmer" style={{ height: '2.5rem', width: '90%' }}></div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="shimmer" style={{ height: '1rem', width: '20%' }}></div>
                <div className="shimmer" style={{ height: '1rem', width: '30%' }}></div>
              </div>
              <div className="shimmer" style={{ height: '1px', width: '100%', opacity: 0.2 }}></div>
              <div className="shimmer" style={{ height: '80px', width: '100%' }}></div>
              <div className="shimmer" style={{ height: '220px', width: '100%' }}></div>
            </div>
          ) : (
            <>
              {/* Tab 1: Full Article Content */}
              {activeTab === 'article' && (
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

              {/* Tab 2: AI Summarization Panel */}
              {activeTab === 'summary' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.2s ease' }}>
                  {aiLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div className="shimmer" style={{ height: '100px', borderRadius: '12px' }}></div>
                      <div className="shimmer" style={{ height: '150px', borderRadius: '12px' }}></div>
                    </div>
                  ) : isApiKeyMissing ? (
                    <div className="ai-config-notice glass" style={{
                      padding: '2rem',
                      borderRadius: '12px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1rem',
                      border: '1px dashed var(--border-hover)'
                    }}>
                      <Key size={36} style={{ color: 'var(--color-primary-hover)' }} />
                      <h3 style={{ margin: 0 }}>API Key Required</h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto', lineHeight: '1.5' }}>
                        To unlock automated article summarization, key takeaways, and quizzes, configure your API Key in the settings panel.
                      </p>
                      {onOpenSettings && (
                        <button onClick={onOpenSettings} className="btn btn-primary" style={{ gap: '0.4rem' }}>
                          <span>Configure Settings</span>
                          <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  ) : aiError ? (
                    <div className="ai-error-box" style={{
                      padding: '1.5rem',
                      borderRadius: '12px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#f87171',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem'
                    }}>
                      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ display: 'block', marginBottom: '0.25rem', color: '#ef4444' }}>Generation Failed</strong>
                        <span>{aiError}</span>
                        <button 
                          className="btn btn-secondary" 
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', marginTop: '0.75rem' }}
                          onClick={() => {
                            const text = fullArticle?.textContent || fullArticle?.excerpt || article.contentSnippet || '';
                            triggerAIFetch(article.title, text);
                          }}
                        >
                          Retry Generation
                        </button>
                      </div>
                    </div>
                  ) : aiData ? (
                    <>
                      {/* TL;DR Summary Card */}
                      <div className="ai-summary-box">
                        <div className="ai-summary-title">
                          <Sparkles size={14} />
                          <span>TL;DR Overview</span>
                        </div>
                        <p className="ai-summary-text">{aiData.summary.tldr}</p>
                      </div>

                      {/* Key Takeaways Section */}
                      <div style={{ marginTop: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <CheckCircle2 size={16} style={{ color: 'var(--color-primary-hover)' }} />
                          <span>Key Takeaways</span>
                        </h3>
                        <ul className="takeaways-list" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                          {aiData.summary.keyTakeaways.map((takeaway, idx) => (
                            <li key={idx} style={{
                              display: 'flex',
                              gap: '0.75rem',
                              fontSize: '0.95rem',
                              lineHeight: '1.5',
                              background: 'var(--bg-card)',
                              padding: '1rem 1.25rem',
                              borderRadius: '8px',
                              border: '1px solid var(--border-color)'
                            }}>
                              <span style={{ color: 'var(--color-primary-hover)', fontWeight: 'bold' }}>{idx + 1}.</span>
                              <span style={{ color: 'var(--text-primary)' }}>{takeaway}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : null}
                </div>
              )}

              {/* Tab 3: Interactive Study Assistant Panel */}
              {activeTab === 'study' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.2s ease' }}>
                  {aiLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div className="shimmer" style={{ height: '80px', borderRadius: '12px' }}></div>
                      <div className="shimmer" style={{ height: '160px', borderRadius: '12px' }}></div>
                      <div className="shimmer" style={{ height: '200px', borderRadius: '12px' }}></div>
                    </div>
                  ) : isApiKeyMissing ? (
                    <div className="ai-config-notice glass" style={{
                      padding: '2rem',
                      borderRadius: '12px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '1rem',
                      border: '1px dashed var(--border-hover)'
                    }}>
                      <Key size={36} style={{ color: 'var(--color-secondary)' }} />
                      <h3 style={{ margin: 0 }}>API Key Required</h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto', lineHeight: '1.5' }}>
                        To unlock Study Assistant features like Glossary definitions, ELI5 analogies, and self-assessment quizzes, paste your API Key in settings.
                      </p>
                      {onOpenSettings && (
                        <button onClick={onOpenSettings} className="btn btn-primary" style={{ gap: '0.4rem', background: 'var(--color-secondary)' }}>
                          <span>Configure Settings</span>
                          <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  ) : aiError ? (
                    <div className="ai-error-box" style={{
                      padding: '1.5rem',
                      borderRadius: '12px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#f87171',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem'
                    }}>
                      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong style={{ display: 'block', marginBottom: '0.25rem', color: '#ef4444' }}>Generation Failed</strong>
                        <span>{aiError}</span>
                        <button 
                          className="btn btn-secondary" 
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', marginTop: '0.75rem' }}
                          onClick={() => {
                            const text = fullArticle?.textContent || fullArticle?.excerpt || article.contentSnippet || '';
                            triggerAIFetch(article.title, text);
                          }}
                        >
                          Retry Generation
                        </button>
                      </div>
                    </div>
                  ) : aiData ? (
                    <>
                      {/* ELI5 section */}
                      <section className="study-section">
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-secondary)' }}>
                          <HelpCircle size={16} />
                          <span>Explain Like I'm 5 (ELI5)</span>
                        </h3>
                        <div style={{
                          padding: '1.25rem 1.5rem',
                          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                          border: '1px solid rgba(6, 182, 212, 0.15)',
                          borderRadius: '12px',
                          lineHeight: '1.6',
                          fontSize: '0.95rem',
                          color: '#e5e7eb'
                        }}>
                          {aiData.study.eli5}
                        </div>
                      </section>

                      {/* Glossary definitions */}
                      {aiData.study.glossary && aiData.study.glossary.length > 0 && (
                        <section className="study-section">
                          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fff' }}>
                            <BookOpen size={16} style={{ color: 'var(--color-secondary)' }} />
                            <span>Glossary & Jargon</span>
                          </h3>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                            {aiData.study.glossary.map((item, idx) => (
                              <div key={idx} style={{
                                padding: '1rem 1.25rem',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px'
                              }}>
                                <strong style={{ color: 'var(--color-secondary)', fontSize: '0.95rem', display: 'block', marginBottom: '0.35rem' }}>
                                  {item.term}
                                </strong>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                                  {item.definition}
                                </p>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Self-Assessment Quizzes */}
                      {aiData.study.quiz && aiData.study.quiz.length > 0 && (
                        <section className="study-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <GraduationCap size={18} style={{ color: 'var(--color-primary-hover)' }} />
                            <span>Self-Assessment Quiz</span>
                          </h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                            {aiData.study.quiz.map((q, qIdx) => {
                              const selectedOpt = selectedAnswers[qIdx];
                              const isAnswered = selectedOpt !== undefined;

                              return (
                                <div key={qIdx} style={{
                                  background: 'var(--bg-card)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '10px',
                                  padding: '1.25rem 1.5rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '1rem'
                                }}>
                                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', display: 'flex', gap: '0.5rem' }}>
                                    <span>Q{qIdx + 1}:</span>
                                    <span>{q.question}</span>
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {q.options.map((opt, optIdx) => {
                                      let optionClass = 'quiz-option';
                                      let prefixIcon = null;

                                      if (isAnswered) {
                                        if (optIdx === q.correctAnswerIndex) {
                                          optionClass += ' correct';
                                          prefixIcon = <Check size={14} style={{ color: '#10b981', marginRight: '4px' }} />;
                                        } else if (optIdx === selectedOpt) {
                                          optionClass += ' incorrect';
                                          prefixIcon = <X size={14} style={{ color: '#ef4444', marginRight: '4px' }} />;
                                        } else {
                                          optionClass += ' disabled';
                                        }
                                      }

                                      return (
                                        <button
                                          key={optIdx}
                                          className={optionClass}
                                          onClick={() => handleSelectAnswer(qIdx, optIdx)}
                                          disabled={isAnswered}
                                          style={{
                                            padding: '0.75rem 1rem',
                                            borderRadius: '6px',
                                            border: '1px solid var(--border-color)',
                                            background: 'var(--bg-base)',
                                            color: 'var(--text-primary)',
                                            fontSize: '0.85rem',
                                            textAlign: 'left',
                                            cursor: isAnswered ? 'default' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            transition: 'all 0.15s ease'
                                          }}
                                        >
                                          {prefixIcon}
                                          <span>{opt}</span>
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {isAnswered && (
                                    <div style={{
                                      fontSize: '0.8rem',
                                      lineHeight: '1.5',
                                      padding: '0.75rem 1rem',
                                      borderRadius: '6px',
                                      background: selectedOpt === q.correctAnswerIndex ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                                      border: `1px solid ${selectedOpt === q.correctAnswerIndex ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`,
                                      color: 'var(--text-secondary)',
                                      animation: 'fadeIn 0.25s ease'
                                    }}>
                                      <strong style={{ display: 'block', color: selectedOpt === q.correctAnswerIndex ? '#10b981' : '#ef4444', marginBottom: '0.2rem' }}>
                                        {selectedOpt === q.correctAnswerIndex ? 'Correct!' : 'Incorrect'}
                                      </strong>
                                      {q.explanation}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      )}
                    </>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
