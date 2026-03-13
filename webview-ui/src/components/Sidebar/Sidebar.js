import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Plus, X, Check, Zap } from 'lucide-react';
import { CollectionItem } from './CollectionItem';
import './Sidebar.css';
export function Sidebar({ collections, activeRequestId, onSelectRequest, onAddCollection, onDeleteCollection, onRenameCollection, onRenameRequest, onDeleteRequest, onNewRequest, onSaveToCollection, }) {
    const [addingCollection, setAddingCollection] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const handleAddCollection = () => {
        if (newCollectionName.trim()) {
            onAddCollection(newCollectionName.trim());
            setNewCollectionName('');
            setAddingCollection(false);
        }
    };
    return (_jsxs("div", { className: "sidebar", children: [_jsxs("div", { className: "sidebar-header", children: [_jsx(Zap, { size: 14, strokeWidth: 2.5 }), _jsx("span", { className: "sidebar-logo", children: "Curl Desk" })] }), _jsxs("div", { className: "sidebar-actions", children: [_jsxs("button", { className: "btn btn-primary sidebar-new-btn", onClick: onNewRequest, children: [_jsx(Plus, { size: 13, strokeWidth: 2.5 }), " New Request"] }), _jsxs("button", { className: "btn btn-ghost sidebar-collection-btn", onClick: () => setAddingCollection(true), title: "New Collection", children: [_jsx(Plus, { size: 13, strokeWidth: 2.5 }), " Collection"] })] }), addingCollection && (_jsxs("div", { className: "sidebar-input-row", children: [_jsx("input", { autoFocus: true, className: "sidebar-input", type: "text", placeholder: "Collection name...", value: newCollectionName, onChange: (e) => setNewCollectionName(e.target.value), onKeyDown: (e) => {
                            if (e.key === 'Enter')
                                handleAddCollection();
                            if (e.key === 'Escape') {
                                setAddingCollection(false);
                                setNewCollectionName('');
                            }
                        } }), _jsx("button", { className: "btn btn-primary btn-sm btn-icon", onClick: handleAddCollection, children: _jsx(Check, { size: 12, strokeWidth: 2.5 }) }), _jsx("button", { className: "btn btn-ghost btn-sm btn-icon", onClick: () => { setAddingCollection(false); setNewCollectionName(''); }, children: _jsx(X, { size: 12, strokeWidth: 2.5 }) })] })), _jsxs("div", { className: "sidebar-collections", children: [collections.length === 0 && !addingCollection && (_jsxs("div", { className: "sidebar-empty", children: [_jsx("p", { children: "No collections yet." }), _jsx("p", { children: "Create one to save requests." })] })), collections.map((col) => (_jsx(CollectionItem, { col: col, activeRequestId: activeRequestId, onSelectRequest: onSelectRequest, onDeleteCollection: onDeleteCollection, onRenameCollection: onRenameCollection, onRenameRequest: onRenameRequest, onDeleteRequest: onDeleteRequest, onSaveToCollection: onSaveToCollection }, col.id)))] })] }));
}
