import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { RequestPanel } from './components/RequestPanel/RequestPanel';
import { ResponsePanel } from './components/ResponsePanel/ResponsePanel';
import {
  Collection,
  Request,
  ResponseData,
  createDefaultRequest,
  generateId,
} from './types';
import { vscode } from './vscode';
import './App.css';

export default function App() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeRequest, setActiveRequest] = useState<Request>(createDefaultRequest());
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load collections on mount
  useEffect(() => {
    vscode.postMessage({ type: 'GET_COLLECTIONS' });
  }, []);

  // Listen for messages from extension
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const message = event.data as { type: string; source?: string; payload: unknown };
      switch (message.type) {
        case 'COLLECTIONS_LOADED':
          setCollections(message.payload as Collection[]);
          break;
        case 'REQUEST_RESPONSE':
          if (message.source === 'sidebar') break;
          setResponse(message.payload as ResponseData);
          setIsLoading(false);
          setError(null);
          break;
        case 'REQUEST_ERROR':
          if (message.source === 'sidebar') break;
          setError((message.payload as { message: string }).message);
          setIsLoading(false);
          setResponse(null);
          break;
        case 'LOAD_REQUEST':
          setActiveRequest(message.payload as Request);
          setResponse(null);
          setError(null);
          break;
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const saveCollections = useCallback((updated: Collection[]) => {
    setCollections(updated);
    vscode.postMessage({ type: 'SAVE_COLLECTIONS', payload: updated });
  }, []);

  const handleSend = useCallback(() => {
    if (!activeRequest.url.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    const headers: Record<string, string> = {};
    activeRequest.headers
      .filter((h) => h.enabled && h.key.trim())
      .forEach((h) => { headers[h.key] = h.value; });

    if (activeRequest.auth.type === 'bearer' && activeRequest.auth.token) {
      headers['Authorization'] = `Bearer ${activeRequest.auth.token}`;
    } else if (activeRequest.auth.type === 'basic') {
      const creds = btoa(`${activeRequest.auth.username}:${activeRequest.auth.password}`);
      headers['Authorization'] = `Basic ${creds}`;
    }

    if (activeRequest.bodyType === 'json') {
      headers['Content-Type'] = 'application/json';
    } else if (activeRequest.bodyType === 'form') {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    const params: Record<string, string> = {};
    activeRequest.params
      .filter((p) => p.enabled && p.key.trim())
      .forEach((p) => { params[p.key] = p.value; });

    vscode.postMessage({
      type: 'SEND_REQUEST',
      payload: {
        method: activeRequest.method,
        url: activeRequest.url,
        headers,
        body: activeRequest.bodyType !== 'none' ? activeRequest.body : undefined,
        params,
      },
    });
  }, [activeRequest]);

  const handleAddCollection = (name: string) => {
    saveCollections([
      ...collections,
      { id: generateId(), name, requests: [] },
    ]);
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
    const saved: Request = { ...activeRequest, id: generateId(), name };
    saveCollections(
      collections.map((c) =>
        c.id === collectionId ? { ...c, requests: [...c.requests, saved] } : c
      )
    );
  };

  const handleSelectRequest = (req: Request) => {
    setActiveRequest(req);
    setResponse(null);
    setError(null);
  };

  return (
    <div className="app">
      <Sidebar
        collections={collections}
        activeRequestId={activeRequest.id}
        onSelectRequest={handleSelectRequest}
        onAddCollection={handleAddCollection}
        onDeleteCollection={handleDeleteCollection}
        onDeleteRequest={handleDeleteRequest}
        onNewRequest={() => {
          setActiveRequest(createDefaultRequest());
          setResponse(null);
          setError(null);
        }}
        onSaveToCollection={handleSaveToCollection}
      />
      <div className="main-content">
        <RequestPanel
          request={activeRequest}
          onChange={setActiveRequest}
          onSend={handleSend}
          isLoading={isLoading}
        />
        <ResponsePanel
          response={response}
          error={error}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
