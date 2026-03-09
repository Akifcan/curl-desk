import { useState } from 'react';
import { Plus, ChevronRight, ChevronDown, X, Check, Zap, Save } from 'lucide-react';
import { Collection, Request, METHOD_COLORS } from '../types';
import './Sidebar.css';

interface SidebarProps {
  collections: Collection[];
  activeRequestId: string;
  onSelectRequest: (req: Request) => void;
  onAddCollection: (name: string) => void;
  onDeleteCollection: (id: string) => void;
  onDeleteRequest: (collectionId: string, requestId: string) => void;
  onNewRequest: () => void;
  onSaveToCollection: (collectionId: string, name: string) => void;
}

export function Sidebar({
  collections,
  activeRequestId,
  onSelectRequest,
  onAddCollection,
  onDeleteCollection,
  onDeleteRequest,
  onNewRequest,
  onSaveToCollection,
}: SidebarProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [addingCollection, setAddingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [savingTo, setSavingTo] = useState<string | null>(null);
  const [saveName, setSaveName] = useState('');

  const toggle = (id: string) => {
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

  const handleSave = (collectionId: string) => {
    if (saveName.trim()) {
      onSaveToCollection(collectionId, saveName.trim());
      setSavingTo(null);
      setSaveName('');
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Zap size={14} strokeWidth={2.5} />
        <span className="sidebar-logo">Curl Desk</span>
      </div>

      <div className="sidebar-actions">
        <button className="btn btn-primary sidebar-new-btn" onClick={onNewRequest}>
          <Plus size={13} strokeWidth={2.5} /> New Request
        </button>
        <button
          className="btn btn-ghost sidebar-collection-btn"
          onClick={() => setAddingCollection(true)}
          title="New Collection"
        >
          <Plus size={13} strokeWidth={2.5} /> Collection
        </button>
      </div>

      {addingCollection && (
        <div className="sidebar-input-row">
          <input
            autoFocus
            className="sidebar-input"
            type="text"
            placeholder="Collection name..."
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddCollection();
              if (e.key === 'Escape') { setAddingCollection(false); setNewCollectionName(''); }
            }}
          />
          <button className="btn btn-primary btn-sm btn-icon" onClick={handleAddCollection}>
            <Check size={12} strokeWidth={2.5} />
          </button>
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => { setAddingCollection(false); setNewCollectionName(''); }}
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>
      )}

      <div className="sidebar-collections">
        {collections.length === 0 && !addingCollection && (
          <div className="sidebar-empty">
            <p>No collections yet.</p>
            <p>Create one to save requests.</p>
          </div>
        )}

        {collections.map((col) => (
          <div key={col.id} className="collection">
            <div className="collection-header" onClick={() => toggle(col.id)}>
              <span className="collection-arrow">
                {expanded.has(col.id)
                  ? <ChevronDown size={12} strokeWidth={2} />
                  : <ChevronRight size={12} strokeWidth={2} />}
              </span>
              <span className="collection-name">{col.name}</span>
              <span className="collection-count">{col.requests.length}</span>
              <button
                className="icon-btn delete-btn"
                onClick={(e) => { e.stopPropagation(); onDeleteCollection(col.id); }}
                title="Delete collection"
              >
                <X size={11} strokeWidth={2.5} />
              </button>
            </div>

            {expanded.has(col.id) && (
              <div className="collection-requests">
                {col.requests.length === 0 && (
                  <div className="collection-empty">No requests</div>
                )}
                {col.requests.map((req) => (
                  <div
                    key={req.id}
                    className={`request-item ${activeRequestId === req.id ? 'active' : ''}`}
                    onClick={() => onSelectRequest(req)}
                  >
                    <span className="request-method" style={{ color: METHOD_COLORS[req.method] }}>
                      {req.method}
                    </span>
                    <span className="request-name">{req.name || req.url || 'Untitled'}</span>
                    <button
                      className="icon-btn delete-btn"
                      onClick={(e) => { e.stopPropagation(); onDeleteRequest(col.id, req.id); }}
                      title="Delete request"
                    >
                      <X size={11} strokeWidth={2.5} />
                    </button>
                  </div>
                ))}

                {savingTo === col.id ? (
                  <div className="sidebar-input-row save-row">
                    <input
                      autoFocus
                      className="sidebar-input"
                      type="text"
                      placeholder="Request name..."
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave(col.id);
                        if (e.key === 'Escape') { setSavingTo(null); setSaveName(''); }
                      }}
                    />
                    <button className="btn btn-primary btn-sm btn-icon" onClick={() => handleSave(col.id)}>
                      <Check size={12} strokeWidth={2.5} />
                    </button>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => { setSavingTo(null); setSaveName(''); }}>
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-ghost btn-sm save-here-btn"
                    onClick={() => { setSavingTo(col.id); setSaveName(''); }}
                  >
                    <Save size={11} strokeWidth={2} /> Save current here
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
