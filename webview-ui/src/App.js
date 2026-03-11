import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { TabBar } from './components/TabBar';
import { RequestPanel } from './components/RequestPanel/RequestPanel';
import { ResponsePanel } from './components/ResponsePanel/ResponsePanel';
import { createAppTab, generateId, } from './types';
import { vscode } from './vscode';
import './App.css';
export default function App() {
    const [collections, setCollections] = useState([]);
    const initialTab = createAppTab();
    const [tabs, setTabs] = useState([initialTab]);
    const [activeTabId, setActiveTabId] = useState(initialTab.id);
    const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
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
    // Load collections on mount
    useEffect(() => {
        vscode.postMessage({ type: 'GET_COLLECTIONS' });
    }, []);
    // Listen for messages from extension
    useEffect(() => {
        const handler = (event) => {
            const message = event.data;
            switch (message.type) {
                case 'COLLECTIONS_LOADED':
                    setCollections(message.payload);
                    break;
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
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, [updateTab, addTab]);
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
            .forEach((h) => { headers[h.key] = h.value; });
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
    const handleAddCollection = (name) => {
        saveCollections([...collections, { id: generateId(), name, requests: [] }]);
    };
    const handleDeleteCollection = (id) => {
        saveCollections(collections.filter((c) => c.id !== id));
    };
    const handleDeleteRequest = (collectionId, requestId) => {
        saveCollections(collections.map((c) => c.id === collectionId
            ? { ...c, requests: c.requests.filter((r) => r.id !== requestId) }
            : c));
    };
    const handleSaveToCollection = (collectionId, name) => {
        const saved = { ...activeTab.request, id: generateId(), name };
        saveCollections(collections.map((c) => c.id === collectionId ? { ...c, requests: [...c.requests, saved] } : c));
    };
    return (_jsxs("div", { className: "app", children: [_jsx(Sidebar, { collections: collections, activeRequestId: activeTab.request.id, onSelectRequest: (req) => addTab(req), onAddCollection: handleAddCollection, onDeleteCollection: handleDeleteCollection, onDeleteRequest: handleDeleteRequest, onNewRequest: () => addTab(), onSaveToCollection: handleSaveToCollection }), _jsxs("div", { className: "main-content", children: [_jsx(TabBar, { tabs: tabs, activeTabId: activeTabId, onSelect: setActiveTabId, onClose: closeTab, onNew: () => addTab() }), _jsx(RequestPanel, { request: activeTab.request, onChange: (req) => updateTab(activeTab.id, { request: req }), onSend: handleSend, isLoading: activeTab.isLoading }), _jsx(ResponsePanel, { response: activeTab.response, error: activeTab.error, isLoading: activeTab.isLoading })] })] }));
}
