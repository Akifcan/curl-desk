import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { TabBar } from './components/TabBar';
import { RequestPanel } from './components/RequestPanel/RequestPanel';
import { ResponsePanel } from './components/ResponsePanel/ResponsePanel';
import { EnvManager } from './components/EnvManager/EnvManager';
import { createAppTab, createDefaultRequest, generateId, } from './types';
import { vscode } from './vscode';
import './App.css';
export default function App() {
    const [collections, setCollections] = useState([]);
    const [environments, setEnvironments] = useState([]);
    const [activeEnvId, setActiveEnvId] = useState(null);
    const [showEnvManager, setShowEnvManager] = useState(false);
    const initialTab = createAppTab();
    const [tabs, setTabs] = useState([initialTab]);
    const [activeTabId, setActiveTabId] = useState(initialTab.id);
    const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
    // Keep a ref to activeTabId so message handlers always see the latest value
    const activeTabIdRef = useRef(activeTabId);
    useEffect(() => { activeTabIdRef.current = activeTabId; }, [activeTabId]);
    const updateTab = useCallback((id, partial) => {
        setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, ...partial } : t)));
    }, []);
    const addTab = useCallback((request) => {
        const tab = createAppTab(request);
        setTabs((prev) => [...prev, tab]);
        setActiveTabId(tab.id);
    }, []);
    const closeTab = useCallback((id) => {
        setTabs((prev) => {
            if (prev.length === 1)
                return prev;
            const idx = prev.findIndex((t) => t.id === id);
            const next = prev.filter((t) => t.id !== id);
            setActiveTabId((cur) => {
                if (cur !== id)
                    return cur;
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
        const handler = (event) => {
            const message = event.data;
            switch (message.type) {
                case 'COLLECTIONS_LOADED':
                    setCollections(message.payload);
                    break;
                case 'ENVIRONMENTS_LOADED': {
                    const { environments: envs, activeEnvId: id } = message.payload;
                    setEnvironments(envs);
                    setActiveEnvId(id);
                    break;
                }
                case 'REQUEST_RESPONSE':
                    if (message.source === 'sidebar')
                        break;
                    if (message.tabId) {
                        updateTab(message.tabId, {
                            response: message.payload,
                            isLoading: false,
                            error: null,
                        });
                    }
                    break;
                case 'REQUEST_ERROR':
                    if (message.source === 'sidebar')
                        break;
                    if (message.tabId) {
                        updateTab(message.tabId, {
                            error: message.payload.message,
                            isLoading: false,
                            response: null,
                        });
                    }
                    break;
                case 'LOAD_REQUEST':
                    addTab(message.payload);
                    break;
                case 'LOAD_PARSED_REQUEST': {
                    const { method, url, body } = message.payload;
                    addTab({
                        ...createDefaultRequest(),
                        method: method,
                        url,
                        body: body ?? '',
                        bodyType: body ? 'json' : 'none',
                    });
                    break;
                }
                case 'LOAD_BODY': {
                    const { body, bodyType } = message.payload;
                    const tabId = activeTabIdRef.current;
                    setTabs((prev) => prev.map((t) => {
                        if (t.id !== tabId)
                            return t;
                        const method = ['GET', 'HEAD', 'OPTIONS'].includes(t.request.method)
                            ? 'POST'
                            : t.request.method;
                        return { ...t, request: { ...t.request, body, bodyType: bodyType, method } };
                    }));
                    break;
                }
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [updateTab, addTab]);
    const replaceVars = useCallback((str) => {
        if (!activeEnvId)
            return str;
        const env = environments.find((e) => e.id === activeEnvId);
        if (!env)
            return str;
        return str.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
            const v = env.variables.find((v) => v.key === key.trim());
            return v ? v.value : `{{${key}}}`;
        });
    }, [environments, activeEnvId]);
    const saveEnvs = useCallback((updatedEnvs, updatedActiveId) => {
        setEnvironments(updatedEnvs);
        setActiveEnvId(updatedActiveId);
        vscode.postMessage({ type: 'SAVE_ENVIRONMENTS', payload: { environments: updatedEnvs, activeEnvId: updatedActiveId } });
    }, []);
    const saveCollections = useCallback((updated) => {
        setCollections(updated);
        vscode.postMessage({ type: 'SAVE_COLLECTIONS', payload: updated });
    }, []);
    const handleSend = useCallback(() => {
        if (!activeTab.request.url.trim())
            return;
        const tabId = activeTab.id;
        updateTab(tabId, { isLoading: true, error: null, response: null });
        const headers = {};
        activeTab.request.headers
            .filter((h) => h.enabled && h.key.trim())
            .forEach((h) => { headers[replaceVars(h.key)] = replaceVars(h.value); });
        if (activeTab.request.auth.type === 'bearer' && activeTab.request.auth.token) {
            headers['Authorization'] = `Bearer ${activeTab.request.auth.token}`;
        }
        else if (activeTab.request.auth.type === 'basic') {
            const creds = btoa(`${activeTab.request.auth.username}:${activeTab.request.auth.password}`);
            headers['Authorization'] = `Basic ${creds}`;
        }
        if (activeTab.request.bodyType === 'json') {
            headers['Content-Type'] = 'application/json';
        }
        // form-data: Content-Type with boundary is set by the extension host
        const params = {};
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
    const handleAddCollection = (name) => {
        saveCollections([...collections, { id: generateId(), name, requests: [] }]);
    };
    const handleDeleteCollection = (id) => {
        saveCollections(collections.filter((c) => c.id !== id));
    };
    const handleRenameCollection = (id, name) => {
        saveCollections(collections.map((c) => c.id === id ? { ...c, name } : c));
    };
    const handleRenameRequest = (collectionId, requestId, name) => {
        saveCollections(collections.map((c) => c.id === collectionId
            ? { ...c, requests: c.requests.map((r) => r.id === requestId ? { ...r, name } : r) }
            : c));
    };
    const handleDeleteRequest = (collectionId, requestId) => {
        saveCollections(collections.map((c) => c.id === collectionId
            ? { ...c, requests: c.requests.filter((r) => r.id !== requestId) }
            : c));
    };
    const handleSaveExample = (collectionId, requestId, name) => {
        if (!activeTab.response)
            return;
        const example = { id: generateId(), name, response: activeTab.response };
        saveCollections(collections.map((c) => c.id === collectionId
            ? { ...c, requests: c.requests.map((r) => r.id === requestId
                    ? { ...r, examples: [...(r.examples ?? []), example] }
                    : r) }
            : c));
    };
    const handleDeleteExample = (collectionId, requestId, exampleId) => {
        saveCollections(collections.map((c) => c.id === collectionId
            ? { ...c, requests: c.requests.map((r) => r.id === requestId
                    ? { ...r, examples: (r.examples ?? []).filter((e) => e.id !== exampleId) }
                    : r) }
            : c));
    };
    const handleSaveToCollection = (collectionId, name) => {
        const saved = { ...activeTab.request, id: generateId(), name };
        saveCollections(collections.map((c) => c.id === collectionId ? { ...c, requests: [...c.requests, saved] } : c));
    };
    const activeEnvName = environments.find((e) => e.id === activeEnvId)?.name ?? null;
    return (_jsxs("div", { className: "app", children: [showEnvManager && (_jsx(EnvManager, { environments: environments, activeEnvId: activeEnvId, onSave: saveEnvs, onClose: () => setShowEnvManager(false) })), _jsx(Sidebar, { collections: collections, activeRequestId: activeTab.request.id, onSelectRequest: (req) => addTab(req), onAddCollection: handleAddCollection, onDeleteCollection: handleDeleteCollection, onRenameCollection: handleRenameCollection, onRenameRequest: handleRenameRequest, onDeleteRequest: handleDeleteRequest, onNewRequest: () => addTab(), onSaveToCollection: handleSaveToCollection, onDeleteExample: handleDeleteExample, onLoadExample: (resp) => updateTab(activeTab.id, { response: resp }) }), _jsxs("div", { className: "main-content", children: [_jsx(TabBar, { tabs: tabs, activeTabId: activeTabId, onSelect: setActiveTabId, onClose: closeTab, onNew: () => addTab(), onOpenEnv: () => setShowEnvManager(true), activeEnvName: activeEnvName }), _jsx(RequestPanel, { request: activeTab.request, onChange: (req) => updateTab(activeTab.id, { request: req }), onSend: handleSend, isLoading: activeTab.isLoading, activeEnv: environments.find((e) => e.id === activeEnvId) ?? null }), _jsx(ResponsePanel, { response: activeTab.response, error: activeTab.error, isLoading: activeTab.isLoading, collections: collections, activeRequestId: activeTab.request.id, onSaveExample: handleSaveExample })] })] }));
}
