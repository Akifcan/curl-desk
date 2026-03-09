import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { RequestPanel } from './components/RequestPanel';
import { ResponsePanel } from './components/ResponsePanel';
import { createDefaultRequest, generateId, } from './types';
import { vscode } from './vscode';
import './App.css';
export default function App() {
    const [collections, setCollections] = useState([]);
    const [activeRequest, setActiveRequest] = useState(createDefaultRequest());
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
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
                    setResponse(message.payload);
                    setIsLoading(false);
                    setError(null);
                    break;
                case 'REQUEST_ERROR':
                    setError(message.payload.message);
                    setIsLoading(false);
                    setResponse(null);
                    break;
                case 'LOAD_REQUEST':
                    setActiveRequest(message.payload);
                    setResponse(null);
                    setError(null);
                    break;
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);
    const saveCollections = useCallback((updated) => {
        setCollections(updated);
        vscode.postMessage({ type: 'SAVE_COLLECTIONS', payload: updated });
    }, []);
    const handleSend = useCallback(() => {
        if (!activeRequest.url.trim())
            return;
        setIsLoading(true);
        setError(null);
        setResponse(null);
        const headers = {};
        activeRequest.headers
            .filter((h) => h.enabled && h.key.trim())
            .forEach((h) => { headers[h.key] = h.value; });
        if (activeRequest.auth.type === 'bearer' && activeRequest.auth.token) {
            headers['Authorization'] = `Bearer ${activeRequest.auth.token}`;
        }
        else if (activeRequest.auth.type === 'basic') {
            const creds = btoa(`${activeRequest.auth.username}:${activeRequest.auth.password}`);
            headers['Authorization'] = `Basic ${creds}`;
        }
        if (activeRequest.bodyType === 'json') {
            headers['Content-Type'] = 'application/json';
        }
        else if (activeRequest.bodyType === 'form') {
            headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        const params = {};
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
    const handleAddCollection = (name) => {
        saveCollections([
            ...collections,
            { id: generateId(), name, requests: [] },
        ]);
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
        const saved = { ...activeRequest, id: generateId(), name };
        saveCollections(collections.map((c) => c.id === collectionId ? { ...c, requests: [...c.requests, saved] } : c));
    };
    const handleSelectRequest = (req) => {
        setActiveRequest(req);
        setResponse(null);
        setError(null);
    };
    return (_jsxs("div", { className: "app", children: [_jsx(Sidebar, { collections: collections, activeRequestId: activeRequest.id, onSelectRequest: handleSelectRequest, onAddCollection: handleAddCollection, onDeleteCollection: handleDeleteCollection, onDeleteRequest: handleDeleteRequest, onNewRequest: () => {
                    setActiveRequest(createDefaultRequest());
                    setResponse(null);
                    setError(null);
                }, onSaveToCollection: handleSaveToCollection }), _jsxs("div", { className: "main-content", children: [_jsx(RequestPanel, { request: activeRequest, onChange: setActiveRequest, onSend: handleSend, isLoading: isLoading }), _jsx(ResponsePanel, { response: response, error: error, isLoading: isLoading })] })] }));
}
