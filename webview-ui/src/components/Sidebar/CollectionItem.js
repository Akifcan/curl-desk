import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ChevronRight, ChevronDown, X, Check, Save } from 'lucide-react';
import { METHOD_COLORS } from '../../types';
export function CollectionItem({ col, activeRequestId, onSelectRequest, onDeleteCollection, onDeleteRequest, onSaveToCollection, }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveName, setSaveName] = useState('');
    const handleSave = () => {
        if (saveName.trim()) {
            onSaveToCollection(col.id, saveName.trim());
            setSaving(false);
            setSaveName('');
        }
    };
    return (_jsxs("div", { className: "collection", children: [_jsxs("div", { className: "collection-header", onClick: () => setIsExpanded((prev) => !prev), children: [_jsx("span", { className: "collection-arrow", children: isExpanded
                            ? _jsx(ChevronDown, { size: 12, strokeWidth: 2 })
                            : _jsx(ChevronRight, { size: 12, strokeWidth: 2 }) }), _jsx("span", { className: "collection-name", children: col.name }), _jsx("span", { className: "collection-count", children: col.requests.length }), _jsx("button", { className: "icon-btn delete-btn", onClick: (e) => { e.stopPropagation(); onDeleteCollection(col.id); }, title: "Delete collection", children: _jsx(X, { size: 11, strokeWidth: 2.5 }) })] }), isExpanded && (_jsxs("div", { className: "collection-requests", children: [col.requests.length === 0 && (_jsx("div", { className: "collection-empty", children: "No requests" })), col.requests.map((req) => (_jsxs("div", { className: `request-item ${activeRequestId === req.id ? 'active' : ''}`, onClick: () => onSelectRequest(req), children: [_jsx("span", { className: "request-method", style: { color: METHOD_COLORS[req.method] }, children: req.method }), _jsx("span", { className: "request-name", children: req.name || req.url || 'Untitled' }), _jsx("button", { className: "icon-btn delete-btn", onClick: (e) => { e.stopPropagation(); onDeleteRequest(col.id, req.id); }, title: "Delete request", children: _jsx(X, { size: 11, strokeWidth: 2.5 }) })] }, req.id))), saving ? (_jsxs("div", { className: "sidebar-input-row save-row", children: [_jsx("input", { autoFocus: true, className: "sidebar-input", type: "text", placeholder: "Request name...", value: saveName, onChange: (e) => setSaveName(e.target.value), onKeyDown: (e) => {
                                    if (e.key === 'Enter')
                                        handleSave();
                                    if (e.key === 'Escape') {
                                        setSaving(false);
                                        setSaveName('');
                                    }
                                } }), _jsx("button", { className: "btn btn-primary btn-sm btn-icon", onClick: handleSave, children: _jsx(Check, { size: 12, strokeWidth: 2.5 }) }), _jsx("button", { className: "btn btn-ghost btn-sm btn-icon", onClick: () => { setSaving(false); setSaveName(''); }, children: _jsx(X, { size: 12, strokeWidth: 2.5 }) })] })) : (_jsxs("button", { className: "btn btn-ghost btn-sm save-here-btn", onClick: () => { setSaving(true); setSaveName(''); }, children: [_jsx(Save, { size: 11, strokeWidth: 2 }), " Save current here"] }))] }))] }));
}
