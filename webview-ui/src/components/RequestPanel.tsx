import { useState } from 'react';
import { Request, KeyValue, HttpMethod, BodyType, AuthType, createKeyValue } from '../types';
import './RequestPanel.css';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

interface RequestPanelProps {
  request: Request;
  onChange: (req: Request) => void;
  onSend: () => void;
  isLoading: boolean;
}

type Tab = 'params' | 'headers' | 'body' | 'auth';

export function RequestPanel({ request, onChange, onSend, isLoading }: RequestPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('params');

  const update = (partial: Partial<Request>) => onChange({ ...request, ...partial });

  const updateKeyValues = (field: 'params' | 'headers', items: KeyValue[]) => {
    update({ [field]: items });
  };

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
    updateKeyValues(field, items);
  };

  const removeKv = (field: 'params' | 'headers', id: string) => {
    const items = request[field].filter((item) => item.id !== id);
    if (items.length === 0) items.push(createKeyValue());
    updateKeyValues(field, items);
  };

  const tabCount = (tab: Tab) => {
    if (tab === 'params') return request.params.filter((p) => p.key).length;
    if (tab === 'headers') return request.headers.filter((h) => h.key).length;
    if (tab === 'body') return request.bodyType !== 'none' ? 1 : 0;
    if (tab === 'auth') return request.auth.type !== 'none' ? 1 : 0;
    return 0;
  };

  return (
    <div className="request-panel">
      <div className="url-bar">
        <select
          className="method-select"
          value={request.method}
          onChange={(e) => update({ method: e.target.value as HttpMethod })}
          style={{ color: getMethodColor(request.method) }}
        >
          {METHODS.map((m) => (
            <option key={m} value={m} style={{ color: getMethodColor(m) }}>
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
          {isLoading ? <span className="spinner" /> : 'Send'}
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
            onChange={(items) => updateKeyValues(activeTab, items)}
            onChangeField={(id, key, value) => handleKvChange(activeTab, id, key, value)}
            onRemove={(id) => removeKv(activeTab, id)}
            keyPlaceholder={activeTab === 'params' ? 'param' : 'header'}
          />
        )}

        {activeTab === 'body' && (
          <BodyTab
            bodyType={request.bodyType}
            body={request.body}
            formData={request.params}
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

function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: '#61afef',
    POST: '#98c379',
    PUT: '#e5c07b',
    DELETE: '#e06c75',
    PATCH: '#c678dd',
    HEAD: '#56b6c2',
    OPTIONS: '#abb2bf',
  };
  return colors[method] ?? '#abb2bf';
}

interface KvTableProps {
  items: KeyValue[];
  onChange: (items: KeyValue[]) => void;
  onChangeField: (id: string, key: keyof KeyValue, value: string | boolean) => void;
  onRemove: (id: string) => void;
  keyPlaceholder: string;
}

function KeyValueTable({ items, onChangeField, onRemove, keyPlaceholder }: KvTableProps) {
  return (
    <div className="kv-table">
      <div className="kv-header">
        <span className="kv-check" />
        <span className="kv-key">Key</span>
        <span className="kv-val">Value</span>
        <span className="kv-del" />
      </div>
      {items.map((item) => (
        <div key={item.id} className="kv-row">
          <input
            type="checkbox"
            className="kv-check"
            checked={item.enabled}
            onChange={(e) => onChangeField(item.id, 'enabled', e.target.checked)}
          />
          <input
            className="kv-input kv-key"
            type="text"
            placeholder={keyPlaceholder}
            value={item.key}
            onChange={(e) => onChangeField(item.id, 'key', e.target.value)}
          />
          <input
            className="kv-input kv-val"
            type="text"
            placeholder="value"
            value={item.value}
            onChange={(e) => onChangeField(item.id, 'value', e.target.value)}
          />
          <button
            className="kv-del icon-btn"
            onClick={() => onRemove(item.id)}
            title="Remove"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

interface BodyTabProps {
  bodyType: BodyType;
  body: string;
  formData: KeyValue[];
  onBodyTypeChange: (type: BodyType) => void;
  onBodyChange: (body: string) => void;
}

function BodyTab({ bodyType, body, onBodyTypeChange, onBodyChange }: BodyTabProps) {
  return (
    <div className="body-tab">
      <div className="body-type-row">
        {(['none', 'json', 'text', 'form'] as BodyType[]).map((type) => (
          <label key={type} className="radio-label">
            <input
              type="radio"
              name="bodyType"
              value={type}
              checked={bodyType === type}
              onChange={() => onBodyTypeChange(type)}
            />
            {type === 'none' ? 'None' : type === 'json' ? 'JSON' : type === 'text' ? 'Text' : 'Form'}
          </label>
        ))}
      </div>

      {bodyType !== 'none' && (
        <textarea
          className="body-editor"
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder={
            bodyType === 'json'
              ? '{\n  "key": "value"\n}'
              : bodyType === 'form'
              ? 'key=value&key2=value2'
              : 'Request body...'
          }
          spellCheck={false}
        />
      )}

      {bodyType === 'none' && (
        <div className="body-none-msg">No body for this request.</div>
      )}
    </div>
  );
}

interface AuthTabProps {
  auth: Request['auth'];
  onAuthChange: (auth: Request['auth']) => void;
}

function AuthTab({ auth, onAuthChange }: AuthTabProps) {
  const update = (partial: Partial<Request['auth']>) =>
    onAuthChange({ ...auth, ...partial });

  return (
    <div className="auth-tab">
      <div className="auth-type-row">
        <label className="field-label">Auth Type</label>
        <select
          className="auth-select"
          value={auth.type}
          onChange={(e) => update({ type: e.target.value as AuthType })}
        >
          <option value="none">No Auth</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
        </select>
      </div>

      {auth.type === 'bearer' && (
        <div className="auth-field">
          <label className="field-label">Token</label>
          <input
            className="field-input"
            type="text"
            placeholder="your-token-here"
            value={auth.token}
            onChange={(e) => update({ token: e.target.value })}
          />
        </div>
      )}

      {auth.type === 'basic' && (
        <>
          <div className="auth-field">
            <label className="field-label">Username</label>
            <input
              className="field-input"
              type="text"
              placeholder="username"
              value={auth.username}
              onChange={(e) => update({ username: e.target.value })}
            />
          </div>
          <div className="auth-field">
            <label className="field-label">Password</label>
            <input
              className="field-input"
              type="password"
              placeholder="password"
              value={auth.password}
              onChange={(e) => update({ password: e.target.value })}
            />
          </div>
        </>
      )}

      {auth.type === 'none' && (
        <div className="auth-none-msg">No authentication for this request.</div>
      )}
    </div>
  );
}
