import React from 'react';
import { X, Shield, FileText } from 'lucide-react';

interface PolicyModalProps {
  type: 'terms' | 'privacy';
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ type, onClose }) => {
  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '1.5rem',
        animation: 'fadeIn 0.25s ease'
      }}
    >
      <div 
        className="modal-container glass" 
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '650px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {type === 'privacy' ? (
              <Shield size={20} style={{ color: 'var(--color-primary)' }} />
            ) : (
              <FileText size={20} style={{ color: 'var(--color-primary)' }} />
            )}
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#fff' }}>
              {type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s ease, color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-accent)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div 
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            fontSize: '0.875rem',
            lineHeight: '1.6',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}
        >
          {type === 'privacy' ? (
            <>
              <p style={{ marginTop: 0 }}><strong>Last Updated: June 30, 2026</strong></p>
              
              <p>Welcome to FeedMind! We respect your privacy and are committed to protecting it. FeedMind is built with a <strong>local-first architecture</strong>, meaning that your privacy is preserved by design.</p>
              
              <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, margin: '0.5rem 0 0 0' }}>1. Information We Do Not Collect</h4>
              <p>Because FeedMind runs entirely client-side in your web browser:</p>
              <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                <li>We do not collect or store personal data, names, email addresses, or credentials.</li>
                <li>Your subscribed RSS feeds, bookmarked articles, and read/unread flags are stored locally in your browser's IndexedDB.</li>
                <li>Your AI API Keys and provider configurations are saved in your local storage. We never transmit them to our servers or third parties (except direct payload calls to the AI providers you configure).</li>
              </ul>

              <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, margin: '0.5rem 0 0 0' }}>2. Data Transmissions (Third-Party APIs)</h4>
              <p>To deliver RSS updates and AI summaries, the app communicates with the following external servers:</p>
              <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                <li><strong>Feed Fetching:</strong> Requests to retrieve feed files are routed through a Vercel proxy backend endpoint. No usage logs or identifiers are linked or stored.</li>
                <li><strong>AI Summarization:</strong> If you input API keys to enable AI features, requests to summarize content are sent directly to the AI provider endpoint (e.g. Google Gemini or your custom OpenAI endpoint). They are governed by the respective providers' privacy agreements.</li>
              </ul>

              <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, margin: '0.5rem 0 0 0' }}>3. Browser Caches</h4>
              <p>This web application uses standard storage (IndexedDB, LocalStorage) and Service Workers to cache assets. You can clear this data at any time by clearing your browser cookies and site data for FeedMind.</p>
            </>
          ) : (
            <>
              <p style={{ marginTop: 0 }}><strong>Last Updated: June 30, 2026</strong></p>
              
              <p>Please read these Terms of Service carefully before using the FeedMind RSS Reader web application.</p>
              
              <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, margin: '0.5rem 0 0 0' }}>1. Acceptance of Terms</h4>
              <p>By accessing or using FeedMind, you agree to be bound by these Terms of Service. If you do not agree, you must cease using the application immediately.</p>

              <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, margin: '0.5rem 0 0 0' }}>2. License and Open Source</h4>
              <p>FeedMind is provided as free, open-source software. You are permitted to use, modify, and redistribute the application under the terms of its open-source license. The software is run locally on your device.</p>

              <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, margin: '0.5rem 0 0 0' }}>3. Content Disclaimer</h4>
              <p>FeedMind is an RSS feed aggregator. We do not edit, review, or control the feeds, articles, or research papers you choose to subscribe to. You are solely responsible for compliance with any copyrights, terms, or conditions specified by external publishers of the RSS feeds.</p>

              <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, margin: '0.5rem 0 0 0' }}>4. Disclaimer of Warranties</h4>
              <p>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY.</p>

              <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, margin: '0.5rem 0 0 0' }}>5. Updates to Terms</h4>
              <p>We reserves the right to modify these terms at any time. Continued use of FeedMind after updates constitutes acceptance of the modified Terms of Service.</p>
            </>
          )}
        </div>

        {/* Footer */}
        <div 
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(255, 255, 255, 0.01)'
          }}
        >
          <button 
            className="btn btn-primary"
            onClick={onClose}
            style={{ padding: '0.4rem 1.25rem', fontSize: '0.85rem' }}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
