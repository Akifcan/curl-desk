import { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { TabBar } from './components/TabBar';
import { RequestPanel } from './components/RequestPanel/RequestPanel';
import { ResponsePanel } from './components/ResponsePanel/ResponsePanel';
import { EnvManager } from './components/EnvManager/EnvManager';
import {
  AppTab,
  BodyType,
  Collection,
  Environment,
  Example,
  HttpMethod,
  Request,
  ResponseData,
  createAppTab,
  createDefaultRequest,
  createKeyValue,
  generateId,
} from './types';
import { vscode } from './vscode';
import './App.css';

export default function App() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activeEnvId, setActiveEnvId] = useState<string | null>(null);
  const [showEnvManager, setShowEnvManager] = useState(false);

  const initialTab = createAppTab();
  const [tabs, setTabs] = useState<AppTab[]>([initialTab]);
  const [activeTabId, setActiveTabId] = useState<string>(initialTab.id);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

  // Keep a ref to activeTabId so message handlers always see the latest value
  const activeTabIdRef = useRef(activeTabId);
  useEffect(() => { activeTabIdRef.current = activeTabId; }, [activeTabId]);

  const updateTab = useCallback((id: string, partial: Partial<AppTab>) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, ...partial } : t)));
  }, []);

  const addTab = useCallback((request?: Request) => {
    const tab = createAppTab(request);
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(tab.id);
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs((prev) => {
      if (prev.length === 1) return prev;
      const idx = prev.findIndex((t) => t.id === id);
      const next = prev.filter((t) => t.id !== id);
      setActiveTabId((cur) => {
        if (cur !== id) return cur;
        return next[Math.max(0, idx - 1)].id;
      });
      return next;
    });
  }, []);

  // Load collections and environments on mount
  useEffect(() => {
    vscode.postMessage({ type: 'GET_COLLECTIONS' });
    vscode.postMessage({ type: 'GET_ENVIRONMENTS' });
  }, []);

  // Listen for messages from extension
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const message = event.data as { type: string; source?: string; tabId?: string; payload: unknown };
      switch (message.type) {
        case 'COLLECTIONS_LOADED':
          setCollections(message.payload as Collection[]);
          break;
        case 'ENVIRONMENTS_LOADED': {
          const { environments: envs, activeEnvId: id } = message.payload as { environments: Environment[]; activeEnvId: string | null };
          setEnvironments(envs);
          setActiveEnvId(id);
          break;
        }
        case 'REQUEST_RESPONSE':
          if (message.source === 'sidebar') break;
          if (message.tabId) {
            updateTab(message.tabId, {
              response: message.payload as ResponseData,
              isLoading: false,
              error: null,
            });
          }
          break;
        case 'REQUEST_ERROR':
          if (message.source === 'sidebar') break;
          if (message.tabId) {
            updateTab(message.tabId, {
              error: (message.payload as { message: string }).message,
              isLoading: false,
              response: null,
            });
          }
          break;
        case 'LOAD_REQUEST':
          addTab(message.payload as Request);
          break;
        case 'LOAD_PARSED_REQUEST': {
          const { method, url, body, headers } = message.payload as {
            method: string; url: string; body?: string; headers?: Record<string, string>;
          };
          const req = createDefaultRequest();
          req.method = method as HttpMethod;
          req.url = url;
          req.body = body ?? '';
          req.bodyType = body ? 'json' : 'none';
          if (headers) {
            const authHeader = headers['Authorization'] || headers['authorization'];
            if (authHeader) {
              if (authHeader.toLowerCase().startsWith('bearer ')) {
                req.auth = { type: 'bearer', token: authHeader.slice(7), username: '', password: '' };
              } else if (authHeader.toLowerCase().startsWith('basic ')) {
                let username = '', password = '';
                try {
                  const decoded = atob(authHeader.slice(6));
                  const [user, ...passParts] = decoded.split(':');
                  username = user;
                  password = passParts.join(':');
                } catch {}
                req.auth = { type: 'basic', token: '', username, password };
              }
            }
            const filtered = Object.entries(headers).filter(([k]) => k.toLowerCase() !== 'authorization');
            if (filtered.length > 0) {
              req.headers = [
                ...filtered.map(([key, value]) => ({ id: generateId(), key, value, enabled: true })),
                createKeyValue(),
              ];
            }
          }
          addTab(req);
          break;
        }
        case 'LOAD_BODY': {
          const { body, bodyType } = message.payload as { body: string; bodyType: string };
          const tabId = activeTabIdRef.current;
          setTabs((prev) => prev.map((t) => {
            if (t.id !== tabId) return t;
            const method = ['GET', 'HEAD', 'OPTIONS'].includes(t.request.method)
              ? 'POST'
              : t.request.method;
            return { ...t, request: { ...t.request, body, bodyType: bodyType as BodyType, method } };
          }));
          break;
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [updateTab, addTab]);

  const replaceVars = useCallback((str: string): string => {
    if (!activeEnvId) return str;
    const env = environments.find((e) => e.id === activeEnvId);
    if (!env) return str;
    return str.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
      const v = env.variables.find((v) => v.key === key.trim());
      return v ? v.value : `{{${key}}}`;
    });
  }, [environments, activeEnvId]);

  const saveEnvs = useCallback((updatedEnvs: Environment[], updatedActiveId: string | null) => {
    setEnvironments(updatedEnvs);
    setActiveEnvId(updatedActiveId);
    vscode.postMessage({ type: 'SAVE_ENVIRONMENTS', payload: { environments: updatedEnvs, activeEnvId: updatedActiveId } });
  }, []);

  const saveCollections = useCallback((updated: Collection[]) => {
    setCollections(updated);
    vscode.postMessage({ type: 'SAVE_COLLECTIONS', payload: updated });
  }, []);

  const handleSend = useCallback(() => {
    if (!activeTab.request.url.trim()) return;

    const tabId = activeTab.id;
    updateTab(tabId, { isLoading: true, error: null, response: null });

    const headers: Record<string, string> = {};
    activeTab.request.headers
      .filter((h) => h.enabled && h.key.trim())
      .forEach((h) => { headers[replaceVars(h.key)] = replaceVars(h.value); });

    if (activeTab.request.auth.type === 'bearer' && activeTab.request.auth.token) {
      headers['Authorization'] = `Bearer ${activeTab.request.auth.token}`;
    } else if (activeTab.request.auth.type === 'basic') {
      const creds = btoa(`${activeTab.request.auth.username}:${activeTab.request.auth.password}`);
      headers['Authorization'] = `Basic ${creds}`;
    }

    if (activeTab.request.bodyType === 'json') {
      headers['Content-Type'] = 'application/json';
    }
    // form-data: Content-Type with boundary is set by the extension host

    const params: Record<string, string> = {};
    activeTab.request.params
      .filter((p) => p.enabled && p.key.trim())
      .forEach((p) => { params[replaceVars(p.key)] = replaceVars(p.value); });

    const isForm = activeTab.request.bodyType === 'form';
    const formFields = isForm
      ? (activeTab.request.formFields ?? []).filter((f) => f.enabled && f.key.trim())
      : undefined;

    vscode.postMessage({
      type: 'SEND_REQUEST',
      tabId,
      payload: {
        method: activeTab.request.method,
        url: replaceVars(activeTab.request.url),
        headers,
        body: !isForm && activeTab.request.bodyType !== 'none' ? replaceVars(activeTab.request.body) : undefined,
        formFields,
        params,
      },
    });
  }, [activeTab, updateTab]);

  const handleAddCollection = (name: string) => {
    saveCollections([...collections, { id: generateId(), name, requests: [] }]);
  };

  const handleDeleteCollection = (id: string) => {
    saveCollections(collections.filter((c) => c.id !== id));
  };

  const handleRenameCollection = (id: string, name: string) => {
    saveCollections(collections.map((c) => c.id === id ? { ...c, name } : c));
  };

  const handleRenameRequest = (collectionId: string, requestId: string, name: string) => {
    saveCollections(
      collections.map((c) =>
        c.id === collectionId
          ? { ...c, requests: c.requests.map((r) => r.id === requestId ? { ...r, name } : r) }
          : c
      )
    );
  };

  const handleDeleteRequest = (collectionId: string, requestId: string) => {
    saveCollections(
      collections.map((c) =>
        c.id === collectionId
          ? { ...c, requests: c.requests.filter((r) => r.id !== requestId) }
          : c
      )
    );
  };

  const handleSaveExample = (collectionId: string, requestId: string, name: string) => {
    if (!activeTab.response) return;
    const example: Example = { id: generateId(), name, response: activeTab.response };
    saveCollections(
      collections.map((c) =>
        c.id === collectionId
          ? { ...c, requests: c.requests.map((r) =>
              r.id === requestId
                ? { ...r, examples: [...(r.examples ?? []), example] }
                : r
            ) }
          : c
      )
    );
  };

  const handleRenameExample = (collectionId: string, requestId: string, exampleId: string, name: string) => {
    saveCollections(
      collections.map((c) =>
        c.id === collectionId
          ? { ...c, requests: c.requests.map((r) =>
              r.id === requestId
                ? { ...r, examples: (r.examples ?? []).map((e) => e.id === exampleId ? { ...e, name } : e) }
                : r
            ) }
          : c
      )
    );
  };

  const handleDeleteExample = (collectionId: string, requestId: string, exampleId: string) => {
    saveCollections(
      collections.map((c) =>
        c.id === collectionId
          ? { ...c, requests: c.requests.map((r) =>
              r.id === requestId
                ? { ...r, examples: (r.examples ?? []).filter((e) => e.id !== exampleId) }
                : r
            ) }
          : c
      )
    );
  };

  const handleSaveToCollection = (collectionId: string, name: string) => {
    const saved: Request = { ...activeTab.request, id: generateId(), name };
    saveCollections(
      collections.map((c) =>
        c.id === collectionId ? { ...c, requests: [...c.requests, saved] } : c
      )
    );
  };

  const activeEnvName = environments.find((e) => e.id === activeEnvId)?.name ?? null;

  return (
    <div className="app">
      {showEnvManager && (
        <EnvManager
          environments={environments}
          activeEnvId={activeEnvId}
          onSave={saveEnvs}
          onClose={() => setShowEnvManager(false)}
        />
      )}
      <Sidebar
        collections={collections}
        activeRequestId={activeTab.request.id}
        onSelectRequest={(req) => addTab(req)}
        onAddCollection={handleAddCollection}
        onDeleteCollection={handleDeleteCollection}
        onRenameCollection={handleRenameCollection}
        onRenameRequest={handleRenameRequest}
        onDeleteRequest={handleDeleteRequest}
        onNewRequest={() => addTab()}
        onSaveToCollection={handleSaveToCollection}
        onRenameExample={handleRenameExample}
        onDeleteExample={handleDeleteExample}
        onLoadExample={(req, resp) => {
          const tab = createAppTab(req);
          tab.response = resp;
          setTabs((prev) => [...prev, tab]);
          setActiveTabId(tab.id);
        }}
      />
      <div className="main-content">
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSelect={setActiveTabId}
          onClose={closeTab}
          onNew={() => addTab()}
          onOpenEnv={() => setShowEnvManager(true)}
          activeEnvName={activeEnvName}
        />
        <RequestPanel
          request={activeTab.request}
          onChange={(req) => updateTab(activeTab.id, { request: req })}
          onSend={handleSend}
          isLoading={activeTab.isLoading}
          activeEnv={environments.find((e) => e.id === activeEnvId) ?? null}
        />
        <ResponsePanel
          response={activeTab.response}
          error={activeTab.error}
          isLoading={activeTab.isLoading}
          collections={collections}
          activeRequestId={activeTab.request.id}
          onSaveExample={handleSaveExample}
        />
      </div>
    </div>
  );
}
