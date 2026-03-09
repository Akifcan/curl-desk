import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Plus, ChevronRight, ChevronDown, X, Check, Zap, Save } from 'lucide-react';
import { METHOD_COLORS } from '../types';
import './Sidebar.css';
export function Sidebar({ collections, activeRequestId, onSelectRequest, onAddCollection, onDeleteCollection, onDeleteRequest, onNewRequest, onSaveToCollection, }) {
    const [expanded, setExpanded] = useState(new Set());
    const [addingCollection, setAddingCollection] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [savingTo, setSavingTo] = useState(null);
    const [saveName, setSaveName] = useState('');
    const toggle = (id) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };
    const handleAddCollection = () => {
        if (newCollectionName.trim()) {
            onAddCollection(newCollectionName.trim());
            setNewCollectionName('');
            setAddingCollection(false);
        }
    };
    const handleSave = (collectionId) => {
        if (saveName.trim()) {
            onSaveToCollection(collectionId, saveName.trim());
            setSavingTo(null);
            setSaveName('');
        }
    };
    return (_jsxs("div", { className: "sidebar", children: [_jsxs("div", { className: "sidebar-header", children: [_jsx(Zap, { size: 14, strokeWidth: 2.5 }), _jsx("span", { className: "sidebar-logo", children: "Curl Desk" })] }), _jsxs("div", { className: "sidebar-actions", children: [_jsxs("button", { className: "btn btn-primary sidebar-new-btn", onClick: onNewRequest, children: [_jsx(Plus, { size: 13, strokeWidth: 2.5 }), " New Request"] }), _jsxs("button", { className: "btn btn-ghost sidebar-collection-btn", onClick: () => setAddingCollection(true), title: "New Collection", children: [_jsx(Plus, { size: 13, strokeWidth: 2.5 }), " Collection"] })] }), addingCollection && (_jsxs("div", { className: "sidebar-input-row", children: [_jsx("input", { autoFocus: true, className: "sidebar-input", type: "text", placeholder: "Collection name...", value: newCollectionName, onChange: (e) => setNewCollectionName(e.target.value), onKeyDown: (e) => {
                            if (e.key === 'Enter')
                                handleAddCollection();
                            if (e.key === 'Escape') {
                                setAddingCollection(false);
                                setNewCollectionName('');
                            }
                        } }), _jsx("button", { className: "btn btn-primary btn-sm btn-icon", onClick: handleAddCollection, children: _jsx(Check, { size: 12, strokeWidth: 2.5 }) }), _jsx("button", { className: "btn btn-ghost btn-sm btn-icon", onClick: () => { setAddingCollection(false); setNewCollectionName(''); }, children: _jsx(X, { size: 12, strokeWidth: 2.5 }) })] })), _jsxs("div", { className: "sidebar-collections", children: [collections.length === 0 && !addingCollection && (_jsxs("div", { className: "sidebar-empty", children: [_jsx("p", { children: "No collections yet." }), _jsx("p", { children: "Create one to save requests." })] })), collections.map((col) => (_jsxs("div", { className: "collection", children: [_jsxs("div", { className: "collection-header", onClick: () => toggle(col.id), children: [_jsx("span", { className: "collection-arrow", children: expanded.has(col.id)
                                            ? _jsx(ChevronDown, { size: 12, strokeWidth: 2 })
                                            : _jsx(ChevronRight, { size: 12, strokeWidth: 2 }) }), _jsx("span", { className: "collection-name", children: col.name }), _jsx("span", { className: "collection-count", children: col.requests.length }), _jsx("button", { className: "icon-btn delete-btn", onClick: (e) => { e.stopPropagation(); onDeleteCollection(col.id); }, title: "Delete collection", children: _jsx(X, { size: 11, strokeWidth: 2.5 }) })] }), expanded.has(col.id) && (_jsxs("div", { className: "collection-requests", children: [col.requests.length === 0 && (_jsx("div", { className: "collection-empty", children: "No requests" })), col.requests.map((req) => (_jsxs("div", { className: `request-item ${activeRequestId === req.id ? 'active' : ''}`, onClick: () => onSelectRequest(req), children: [_jsx("span", { className: "request-method", style: { color: METHOD_COLORS[req.method] }, children: req.method }), _jsx("span", { className: "request-name", children: req.name || req.url || 'Untitled' }), _jsx("button", { className: "icon-btn delete-btn", onClick: (e) => { e.stopPropagation(); onDeleteRequest(col.id, req.id); }, title: "Delete request", children: _jsx(X, { size: 11, strokeWidth: 2.5 }) })] }, req.id))), savingTo === col.id ? (_jsxs("div", { className: "sidebar-input-row save-row", children: [_jsx("input", { autoFocus: true, className: "sidebar-input", type: "text", placeholder: "Request name...", value: saveName, onChange: (e) => setSaveName(e.target.value), onKeyDown: (e) => {
                                                    if (e.key === 'Enter')
                                                        handleSave(col.id);
                                                    if (e.key === 'Escape') {
                                                        setSavingTo(null);
                                                        setSaveName('');
                                                    }
                                                } }), _jsx("button", { className: "btn btn-primary btn-sm btn-icon", onClick: () => handleSave(col.id), children: _jsx(Check, { size: 12, strokeWidth: 2.5 }) }), _jsx("button", { className: "btn btn-ghost btn-sm btn-icon", onClick: () => { setSavingTo(null); setSaveName(''); }, children: _jsx(X, { size: 12, strokeWidth: 2.5 }) })] })) : (_jsxs("button", { className: "btn btn-ghost btn-sm save-here-btn", onClick: () => { setSavingTo(col.id); setSaveName(''); }, children: [_jsx(Save, { size: 11, strokeWidth: 2 }), " Save current here"] }))] }))] }, col.id)))] })] }));
}
