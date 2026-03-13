import { useState } from 'react';
import { ResponseData } from '../../types';
import { ResponseStatusBar } from './ResponseStatusBar';
import { ResponseBody } from './ResponseBody';
import { ResponseHeaders } from './ResponseHeaders';
import './ResponsePanel.css';

type ResponseTab = 'body' | 'headers';
type ViewMode = 'pretty' | 'raw';

interface ResponsePanelProps {
  response: ResponseData | null;
  error: string | null;
  isLoading: boolean;
}

function isJson(body: string): boolean {
  try {
    JSON.parse(body);
    return true;
  } catch {
    return false;
  }
}

function isHtml(body: string, contentType: string): boolean {
  if (/text\/html/i.test(contentType)) return true;
  return /^\s*<!doctype\s+html/i.test(body) || /^\s*<html/i.test(body);
}

export function ResponsePanel({ response, error, isLoading }: ResponsePanelProps) {
  const [activeTab, setActiveTab] = useState<ResponseTab>('body');
  const [viewMode, setViewMode] = useState<ViewMode>('pretty');
  const [htmlPreview, setHtmlPreview] = useState(false);

  return (
    <div className="response-panel">
      <ResponseStatusBar response={response} error={error} isLoading={isLoading} />

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
              <span className="tab-badge">{Object.keys(response.headers).length}</span>
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

            {activeTab === 'body' && isHtml(response.body, response.contentType ?? '') && (
              <div className="view-mode-toggle">
                <button
                  className={`mode-btn ${!htmlPreview ? 'active' : ''}`}
                  onClick={() => setHtmlPreview(false)}
                >
                  Source
                </button>
                <button
                  className={`mode-btn ${htmlPreview ? 'active' : ''}`}
                  onClick={() => setHtmlPreview(true)}
                >
                  Preview
                </button>
              </div>
            )}
          </div>

          <div className="response-content">
            {activeTab === 'body' && <ResponseBody body={response.body} viewMode={viewMode} contentType={response.contentType ?? ''} htmlPreview={htmlPreview} />}
            {activeTab === 'headers' && <ResponseHeaders headers={response.headers} />}
          </div>
        </>
      )}
    </div>
  );
}
