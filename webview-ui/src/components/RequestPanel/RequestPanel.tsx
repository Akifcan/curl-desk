import { useState } from 'react';
import { Send, AlignLeft, List, Shield } from 'lucide-react';
import { Request, KeyValue, HttpMethod, createKeyValue } from '../../types';
import { KeyValueTable } from './KeyValueTable';
import { BodyTab } from './BodyTab';
import { AuthTab } from './AuthTab';
import './RequestPanel.css';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

const METHOD_COLORS: Record<string, string> = {
  GET: '#61afef',
  POST: '#98c379',
  PUT: '#e5c07b',
  DELETE: '#e06c75',
  PATCH: '#c678dd',
  HEAD: '#56b6c2',
  OPTIONS: '#abb2bf',
};

type Tab = 'params' | 'headers' | 'body' | 'auth';

interface RequestPanelProps {
  request: Request;
  onChange: (req: Request) => void;
  onSend: () => void;
  isLoading: boolean;
}

export function RequestPanel({ request, onChange, onSend, isLoading }: RequestPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('params');

  const update = (partial: Partial<Request>) => onChange({ ...request, ...partial });

  const handleKvChange = (
    field: 'params' | 'headers',
    id: string,
    key: keyof KeyValue,
    value: string | boolean
  ) => {
    const items = request[field].map((item) =>
      item.id === id ? { ...item, [key]: value } : item
    );
    const last = items[items.length - 1];
    if (last && (last.key || last.value)) {
      items.push(createKeyValue());
    }
    update({ [field]: items });
  };

  const removeKv = (field: 'params' | 'headers', id: string) => {
    const items = request[field].filter((item) => item.id !== id);
    if (items.length === 0) items.push(createKeyValue());
    update({ [field]: items });
  };

  const tabCount = (tab: Tab) => {
    if (tab === 'params') return request.params.filter((p) => p.key).length;
    if (tab === 'headers') return request.headers.filter((h) => h.key).length;
    if (tab === 'body') return request.bodyType !== 'none' ? 1 : 0;
    if (tab === 'auth') return request.auth.type !== 'none' ? 1 : 0;
    return 0;
  };

  const TAB_ICONS = {
    params: <List size={12} strokeWidth={2} />,
    headers: <AlignLeft size={12} strokeWidth={2} />,
    body: <AlignLeft size={12} strokeWidth={2} />,
    auth: <Shield size={12} strokeWidth={2} />,
  };

  return (
    <div className="request-panel">
      <div className="url-bar">
        <select
          className="method-select"
          value={request.method}
          onChange={(e) => update({ method: e.target.value as HttpMethod })}
          style={{ color: METHOD_COLORS[request.method] }}
        >
          {METHODS.map((m) => (
            <option key={m} value={m} style={{ color: METHOD_COLORS[m] }}>
              {m}
            </option>
          ))}
        </select>

        <input
          className="url-input"
          type="text"
          placeholder="https://api.example.com/endpoint"
          value={request.url}
          onChange={(e) => update({ url: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter') onSend(); }}
        />

        <button
          className={`btn btn-send ${isLoading ? 'loading' : ''}`}
          onClick={onSend}
          disabled={isLoading || !request.url.trim()}
        >
          {isLoading ? <span className="spinner" /> : <><Send size={13} strokeWidth={2.5} /> Send</>}
        </button>
      </div>

      <div className="request-tabs">
        {(['params', 'headers', 'body', 'auth'] as Tab[]).map((tab) => {
          const count = tabCount(tab);
          return (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {TAB_ICONS[tab]}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {count > 0 && <span className="tab-badge">{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="request-tab-content">
        {(activeTab === 'params' || activeTab === 'headers') && (
          <KeyValueTable
            items={request[activeTab]}
            onChangeField={(id, key, value) => handleKvChange(activeTab, id, key, value)}
            onRemove={(id) => removeKv(activeTab, id)}
            keyPlaceholder={activeTab === 'params' ? 'param' : 'header'}
          />
        )}

        {activeTab === 'body' && (
          <BodyTab
            bodyType={request.bodyType}
            body={request.body}
            onBodyTypeChange={(bodyType) => update({ bodyType })}
            onBodyChange={(body) => update({ body })}
          />
        )}

        {activeTab === 'auth' && (
          <AuthTab
            auth={request.auth}
            onAuthChange={(auth) => update({ auth })}
          />
        )}
      </div>
    </div>
  );
}
