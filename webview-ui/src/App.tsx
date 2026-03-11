import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { TabBar } from './components/TabBar';
import { RequestPanel } from './components/RequestPanel/RequestPanel';
import { ResponsePanel } from './components/ResponsePanel/ResponsePanel';
import {
  AppTab,
  Collection,
  Request,
  ResponseData,
  createAppTab,
  generateId,
} from './types';
import { vscode } from './vscode';
import './App.css';

export default function App() {
  const [collections, setCollections] = useState<Collection[]>([]);

  const initialTab = createAppTab();
  const [tabs, setTabs] = useState<AppTab[]>([initialTab]);
  const [activeTabId, setActiveTabId] = useState<string>(initialTab.id);

  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

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

  // Load collections on mount
  useEffect(() => {
    vscode.postMessage({ type: 'GET_COLLECTIONS' });
  }, []);

  // Listen for messages from extension
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const message = event.data as { type: string; source?: string; tabId?: string; payload: unknown };
      switch (message.type) {
        case 'COLLECTIONS_LOADED':
          setCollections(message.payload as Collection[]);
          break;
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
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [updateTab, addTab]);

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
      .forEach((h) => { headers[h.key] = h.value; });

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
      .forEach((p) => { params[p.key] = p.value; });

    const isForm = activeTab.request.bodyType === 'form';
    const formFields = isForm
      ? (activeTab.request.formFields ?? []).filter((f) => f.enabled && f.key.trim())
      : undefined;

    vscode.postMessage({
      type: 'SEND_REQUEST',
      tabId,
      payload: {
        method: activeTab.request.method,
        url: activeTab.request.url,
        headers,
        body: !isForm && activeTab.request.bodyType !== 'none' ? activeTab.request.body : undefined,
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

  const handleDeleteRequest = (collectionId: string, requestId: string) => {
    saveCollections(
      collections.map((c) =>
        c.id === collectionId
          ? { ...c, requests: c.requests.filter((r) => r.id !== requestId) }
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

  return (
    <div className="app">
      <Sidebar
        collections={collections}
        activeRequestId={activeTab.request.id}
        onSelectRequest={(req) => addTab(req)}
        onAddCollection={handleAddCollection}
        onDeleteCollection={handleDeleteCollection}
        onDeleteRequest={handleDeleteRequest}
        onNewRequest={() => addTab()}
        onSaveToCollection={handleSaveToCollection}
      />
      <div className="main-content">
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSelect={setActiveTabId}
          onClose={closeTab}
          onNew={() => addTab()}
        />
        <RequestPanel
          request={activeTab.request}
          onChange={(req) => updateTab(activeTab.id, { request: req })}
          onSend={handleSend}
          isLoading={activeTab.isLoading}
        />
        <ResponsePanel
          response={activeTab.response}
          error={activeTab.error}
          isLoading={activeTab.isLoading}
        />
      </div>
    </div>
  );
}
