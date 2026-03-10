import { useState } from 'react';
import { AlertTriangle, Clock, HardDrive } from 'lucide-react';
import { ResponseData } from '../../types';
import './ResponsePanel.css';

interface ResponsePanelProps {
  response: ResponseData | null;
  error: string | null;
  isLoading: boolean;
}

type ResponseTab = 'body' | 'headers';
type ViewMode = 'pretty' | 'raw';

export function ResponsePanel({ response, error, isLoading }: ResponsePanelProps) {
  const [activeTab, setActiveTab] = useState<ResponseTab>('body');
  const [viewMode, setViewMode] = useState<ViewMode>('pretty');

  const statusClass = response
    ? response.status < 300
      ? 'status-2xx'
      : response.status < 400
      ? 'status-3xx'
      : response.status < 500
      ? 'status-4xx'
      : 'status-5xx'
    : '';

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatBody = (body: string, mode: ViewMode): string => {
    if (mode === 'raw') return body;
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  };

  const isJson = (body: string): boolean => {
    try {
      JSON.parse(body);
      return true;
    } catch {
      return false;
    }
  };

  const headerEntries = response
    ? Object.entries(response.headers).sort(([a], [b]) => a.localeCompare(b))
    : [];

  return (
    <div className="response-panel">
      {/* Status Bar */}
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

      {/* Response Tabs */}
      {response && (
        <>
          <div className="response-tabs">
            <button
              className={`tab-btn ${activeTab === 'body' ? 'active' : ''}`}
              onClick={() => setActiveTab('body')}
            >
              Body
            </button>
            <button
              className={`tab-btn ${activeTab === 'headers' ? 'active' : ''}`}
              onClick={() => setActiveTab('headers')}
            >
              Headers
              <span className="tab-badge">{headerEntries.length}</span>
            </button>

            {activeTab === 'body' && isJson(response.body) && (
              <div className="view-mode-toggle">
                <button
                  className={`mode-btn ${viewMode === 'pretty' ? 'active' : ''}`}
                  onClick={() => setViewMode('pretty')}
                >
                  Pretty
                </button>
                <button
                  className={`mode-btn ${viewMode === 'raw' ? 'active' : ''}`}
                  onClick={() => setViewMode('raw')}
                >
                  Raw
                </button>
              </div>
            )}
          </div>

          <div className="response-content">
            {activeTab === 'body' && (
              <pre className="response-body">
                <code
                  dangerouslySetInnerHTML={{
                    __html: highlightJson(formatBody(response.body, viewMode)),
                  }}
                />
              </pre>
            )}

            {activeTab === 'headers' && (
              <div className="response-headers">
                {headerEntries.map(([key, value]) => (
                  <div key={key} className="header-row">
                    <span className="header-key">{key}</span>
                    <span className="header-sep">:</span>
                    <span className="header-value">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightJson(json: string): string {
  const escaped = escapeHtml(json);
  return escaped.replace(
    /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = 'jn'; // number
      if (/^"/.test(match)) {
        if (/:$/.test(match)) cls = 'jk'; // key
        else cls = 'js'; // string
      } else if (/^(true|false)$/.test(match)) {
        cls = 'jb'; // boolean
      } else if (match === 'null') {
        cls = 'jnull';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}
