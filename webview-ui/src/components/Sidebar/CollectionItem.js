import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ChevronRight, ChevronDown, X, Check, Save, Trash2, Pencil, FileText } from 'lucide-react';
import { METHOD_COLORS } from '../../types';
export function CollectionItem({ col, activeRequestId, onSelectRequest, onDeleteCollection, onRenameCollection, onRenameRequest, onDeleteRequest, onSaveToCollection, onRenameExample, onDeleteExample, onLoadExample, }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editingReqId, setEditingReqId] = useState(null);
    const [editReqName, setEditReqName] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [editingExId, setEditingExId] = useState(null);
    const [editExName, setEditExName] = useState('');
    const handleRenameExample = (reqId) => {
        if (editingExId && editExName.trim()) {
            onRenameExample(col.id, reqId, editingExId, editExName.trim());
        }
        setEditingExId(null);
    };
    const handleSave = () => {
        if (saveName.trim()) {
            onSaveToCollection(col.id, saveName.trim());
            setSaving(false);
            setSaveName('');
        }
    };
    const handleRename = () => {
        if (editName.trim() && editName.trim() !== col.name) {
            onRenameCollection(col.id, editName.trim());
        }
        setEditing(false);
    };
    const handleRenameRequest = () => {
        if (editingReqId && editReqName.trim()) {
            onRenameRequest(col.id, editingReqId, editReqName.trim());
        }
        setEditingReqId(null);
    };
    return (_jsxs("div", { className: "collection", children: [_jsxs("div", { className: "collection-header", onClick: () => !editing && setIsExpanded((prev) => !prev), children: [_jsx("span", { className: "collection-arrow", children: isExpanded
                            ? _jsx(ChevronDown, { size: 12, strokeWidth: 2 })
                            : _jsx(ChevronRight, { size: 12, strokeWidth: 2 }) }), editing ? (_jsx("span", { className: "collection-edit", onClick: (e) => e.stopPropagation(), children: _jsx("input", { autoFocus: true, className: "collection-edit-input", type: "text", value: editName, onChange: (e) => setEditName(e.target.value), onKeyDown: (e) => {
                                if (e.key === 'Enter')
                                    handleRename();
                                if (e.key === 'Escape')
                                    setEditing(false);
                            }, onBlur: handleRename }) })) : (_jsx("span", { className: "collection-name", onDoubleClick: (e) => { e.stopPropagation(); setEditName(col.name); setEditing(true); }, children: col.name })), _jsx("span", { className: "collection-count", children: col.requests.length }), confirmDelete ? (_jsxs("span", { className: "confirm-delete", onClick: (e) => e.stopPropagation(), children: [_jsx("span", { className: "confirm-label", children: "Delete?" }), _jsx("button", { className: "icon-btn confirm-yes", onClick: () => onDeleteCollection(col.id), title: "Confirm delete", children: _jsx(Check, { size: 11, strokeWidth: 2.5 }) }), _jsx("button", { className: "icon-btn confirm-no", onClick: () => setConfirmDelete(false), title: "Cancel", children: _jsx(X, { size: 11, strokeWidth: 2.5 }) })] })) : (_jsxs("span", { className: "collection-actions", children: [_jsx("button", { className: "icon-btn", onClick: (e) => { e.stopPropagation(); setEditName(col.name); setEditing(true); }, title: "Rename collection", children: _jsx(Pencil, { size: 11, strokeWidth: 2.5 }) }), _jsx("button", { className: "icon-btn delete-btn", onClick: (e) => { e.stopPropagation(); setConfirmDelete(true); }, title: "Delete collection", children: _jsx(Trash2, { size: 11, strokeWidth: 2.5 }) })] }))] }), isExpanded && (_jsxs("div", { className: "collection-requests", children: [col.requests.length === 0 && (_jsx("div", { className: "collection-empty", children: "No requests" })), col.requests.map((req) => (_jsxs("div", { children: [_jsxs("div", { className: `request-item ${activeRequestId === req.id ? 'active' : ''}`, onClick: () => editingReqId !== req.id && onSelectRequest(req), children: [_jsx("span", { className: "request-method", style: { color: METHOD_COLORS[req.method] }, children: req.method }), editingReqId === req.id ? (_jsx("input", { autoFocus: true, className: "request-edit-input", type: "text", value: editReqName, onClick: (e) => e.stopPropagation(), onChange: (e) => setEditReqName(e.target.value), onKeyDown: (e) => {
                                            if (e.key === 'Enter')
                                                handleRenameRequest();
                                            if (e.key === 'Escape')
                                                setEditingReqId(null);
                                        }, onBlur: handleRenameRequest })) : (_jsx("span", { className: "request-name", onDoubleClick: (e) => { e.stopPropagation(); setEditingReqId(req.id); setEditReqName(req.name || ''); }, children: req.name || req.url || 'Untitled' })), editingReqId !== req.id && (_jsxs("span", { className: "request-actions", children: [_jsx("button", { className: "icon-btn", onClick: (e) => { e.stopPropagation(); setEditingReqId(req.id); setEditReqName(req.name || ''); }, title: "Rename request", children: _jsx(Pencil, { size: 10, strokeWidth: 2.5 }) }), _jsx("button", { className: "icon-btn delete-btn", onClick: (e) => { e.stopPropagation(); onDeleteRequest(col.id, req.id); }, title: "Delete request", children: _jsx(X, { size: 11, strokeWidth: 2.5 }) })] }))] }), req.examples && req.examples.length > 0 && (_jsx("div", { className: "examples-list", children: req.examples.map((ex) => (_jsxs("div", { className: "example-item", onClick: () => editingExId !== ex.id && onLoadExample(req, ex.response), children: [_jsx(FileText, { size: 10, strokeWidth: 2, className: "example-icon" }), editingExId === ex.id ? (_jsx("input", { autoFocus: true, className: "example-edit-input", type: "text", value: editExName, onClick: (e) => e.stopPropagation(), onChange: (e) => setEditExName(e.target.value), onKeyDown: (e) => {
                                                if (e.key === 'Enter')
                                                    handleRenameExample(req.id);
                                                if (e.key === 'Escape')
                                                    setEditingExId(null);
                                            }, onBlur: () => handleRenameExample(req.id) })) : (_jsx("span", { className: "example-name", onDoubleClick: (e) => { e.stopPropagation(); setEditingExId(ex.id); setEditExName(ex.name); }, children: ex.name })), _jsx("span", { className: `example-status status-${Math.floor(ex.response.status / 100)}xx`, children: ex.response.status }), editingExId !== ex.id && (_jsxs("span", { className: "example-actions", children: [_jsx("button", { className: "icon-btn", onClick: (e) => { e.stopPropagation(); setEditingExId(ex.id); setEditExName(ex.name); }, title: "Rename example", children: _jsx(Pencil, { size: 9, strokeWidth: 2.5 }) }), _jsx("button", { className: "icon-btn delete-btn", onClick: (e) => { e.stopPropagation(); onDeleteExample(col.id, req.id, ex.id); }, title: "Delete example", children: _jsx(X, { size: 10, strokeWidth: 2.5 }) })] }))] }, ex.id))) }))] }, req.id))), saving ? (_jsxs("div", { className: "sidebar-input-row save-row", children: [_jsx("input", { autoFocus: true, className: "sidebar-input", type: "text", placeholder: "Request name...", value: saveName, onChange: (e) => setSaveName(e.target.value), onKeyDown: (e) => {
                                    if (e.key === 'Enter')
                                        handleSave();
                                    if (e.key === 'Escape') {
                                        setSaving(false);
                                        setSaveName('');
                                    }
                                } }), _jsx("button", { className: "btn btn-primary btn-sm btn-icon", onClick: handleSave, children: _jsx(Check, { size: 12, strokeWidth: 2.5 }) }), _jsx("button", { className: "btn btn-ghost btn-sm btn-icon", onClick: () => { setSaving(false); setSaveName(''); }, children: _jsx(X, { size: 12, strokeWidth: 2.5 }) })] })) : (_jsxs("button", { className: "btn btn-ghost btn-sm save-here-btn", onClick: () => { setSaving(true); setSaveName(''); }, children: [_jsx(Save, { size: 11, strokeWidth: 2 }), " Save current here"] }))] }))] }));
}
