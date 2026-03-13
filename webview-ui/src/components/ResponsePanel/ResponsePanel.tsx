import { useState } from 'react';
import { Save, Check, X } from 'lucide-react';
import { Collection, ResponseData } from '../../types';
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
  collections: Collection[];
  activeRequestId: string;
  onSaveExample: (collectionId: string, requestId: string, name: string) => void;
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

export function ResponsePanel({ response, error, isLoading, collections, activeRequestId, onSaveExample }: ResponsePanelProps) {
  const [activeTab, setActiveTab] = useState<ResponseTab>('body');
  const [viewMode, setViewMode] = useState<ViewMode>('pretty');
  const [htmlPreview, setHtmlPreview] = useState(false);
  const [savingExample, setSavingExample] = useState(false);
  const [exampleName, setExampleName] = useState('');

  // Find which collection contains the active request
  const parentCollection = collections.find((c) => c.requests.some((r) => r.id === activeRequestId));

  const handleSaveExample = () => {
    if (exampleName.trim() && parentCollection) {
      onSaveExample(parentCollection.id, activeRequestId, exampleName.trim());
      setSavingExample(false);
      setExampleName('');
    }
  };

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

            {parentCollection && (
              <div className="save-example-area">
                {savingExample ? (
                  <div className="save-example-input">
                    <input
                      autoFocus
                      type="text"
                      placeholder="Example name..."
                      value={exampleName}
                      onChange={(e) => setExampleName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveExample();
                        if (e.key === 'Escape') { setSavingExample(false); setExampleName(''); }
                      }}
                    />
                    <button className="btn btn-primary btn-sm btn-icon" onClick={handleSaveExample}>
                      <Check size={12} strokeWidth={2.5} />
                    </button>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setSavingExample(false); setExampleName(''); }}>
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-ghost btn-sm save-example-btn" onClick={() => setSavingExample(true)}>
                    <Save size={11} strokeWidth={2} /> Save as Example
                  </button>
                )}
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
