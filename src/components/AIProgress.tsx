import React from 'react';
import { Cpu } from 'lucide-react';

interface AIProgressProps {
  status: string;
  progress: number;
  fileName: string;
  visible: boolean;
}

export const AIProgress: React.FC<AIProgressProps> = ({ status, progress, fileName, visible }) => {
  if (!visible) return null;

  return (
    <div className="ai-progress-container">
      <div className="progress-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Cpu size={14} style={{ color: 'var(--color-primary)', animation: 'pulse 1.5s infinite alternate' }} />
          <span>{status || 'Downloading AI Models...'}</span>
        </span>
        <span style={{ fontWeight: 'bold' }}>{Math.round(progress)}%</span>
      </div>
      <div className="progress-bar-track">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="progress-sub">
        <span>Running client-side via WebAssembly</span>
        {fileName && (
          <span 
            title={fileName} 
            style={{ 
              opacity: 0.6, 
              textOverflow: 'ellipsis', 
              overflow: 'hidden', 
              whiteSpace: 'nowrap', 
              maxWidth: '120px' 
            }}
          >
            {fileName}
          </span>
        )}
      </div>
    </div>
  );
};
