import { AlertTriangle, Clock, HardDrive } from 'lucide-react';
import { ResponseData } from '../../types';

interface ResponseStatusBarProps {
  response: ResponseData | null;
  error: string | null;
  isLoading: boolean;
}

export function ResponseStatusBar({ response, error, isLoading }: ResponseStatusBarProps) {
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const statusClass = response
    ? response.status < 300
      ? 'status-2xx'
      : response.status < 400
      ? 'status-3xx'
      : response.status < 500
      ? 'status-4xx'
      : 'status-5xx'
    : '';

  return (
    <div className="response-status-bar">
      {isLoading && (
        <div className="response-loading">
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="loading-text">Sending request...</span>
        </div>
      )}

      {!isLoading && !response && !error && (
        <div className="response-placeholder">
          Hit <kbd>Send</kbd> to get a response
        </div>
      )}

      {!isLoading && error && (
        <div className="response-error">
          <AlertTriangle size={14} strokeWidth={2} />
          <span>{error}</span>
        </div>
      )}

      {!isLoading && response && (
        <div className="response-meta">
          <span className={`status-badge ${statusClass}`}>
            {response.status} {response.statusText}
          </span>
          <span className="meta-item">
            <Clock size={12} strokeWidth={2} className="meta-icon" />
            <span className="meta-value">{response.time}ms</span>
          </span>
          <span className="meta-item">
            <HardDrive size={12} strokeWidth={2} className="meta-icon" />
            <span className="meta-value">{formatSize(response.size)}</span>
          </span>
        </div>
      )}
    </div>
  );
}
