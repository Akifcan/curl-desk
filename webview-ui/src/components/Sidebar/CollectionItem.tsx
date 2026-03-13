import { useState } from 'react';
import { ChevronRight, ChevronDown, X, Check, Save, Trash2, Pencil } from 'lucide-react';
import { Collection, Request, METHOD_COLORS } from '../../types';

interface CollectionItemProps {
  col: Collection;
  activeRequestId: string;
  onSelectRequest: (req: Request) => void;
  onDeleteCollection: (id: string) => void;
  onRenameCollection: (id: string, name: string) => void;
  onRenameRequest: (collectionId: string, requestId: string, name: string) => void;
  onDeleteRequest: (collectionId: string, requestId: string) => void;
  onSaveToCollection: (collectionId: string, name: string) => void;
}

export function CollectionItem({
  col,
  activeRequestId,
  onSelectRequest,
  onDeleteCollection,
  onRenameCollection,
  onRenameRequest,
  onDeleteRequest,
  onSaveToCollection,
}: CollectionItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [editReqName, setEditReqName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState('');

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

  return (
    <div className="collection">
      <div className="collection-header" onClick={() => !editing && setIsExpanded((prev) => !prev)}>
        <span className="collection-arrow">
          {isExpanded
            ? <ChevronDown size={12} strokeWidth={2} />
            : <ChevronRight size={12} strokeWidth={2} />}
        </span>
        {editing ? (
          <span className="collection-edit" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              className="collection-edit-input"
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') setEditing(false);
              }}
              onBlur={handleRename}
            />
          </span>
        ) : (
          <span className="collection-name" onDoubleClick={(e) => { e.stopPropagation(); setEditName(col.name); setEditing(true); }}>{col.name}</span>
        )}
        <span className="collection-count">{col.requests.length}</span>
        {confirmDelete ? (
          <span className="confirm-delete" onClick={(e) => e.stopPropagation()}>
            <span className="confirm-label">Delete?</span>
            <button
              className="icon-btn confirm-yes"
              onClick={() => onDeleteCollection(col.id)}
              title="Confirm delete"
            >
              <Check size={11} strokeWidth={2.5} />
            </button>
            <button
              className="icon-btn confirm-no"
              onClick={() => setConfirmDelete(false)}
              title="Cancel"
            >
              <X size={11} strokeWidth={2.5} />
            </button>
          </span>
        ) : (
          <span className="collection-actions">
            <button
              className="icon-btn"
              onClick={(e) => { e.stopPropagation(); setEditName(col.name); setEditing(true); }}
              title="Rename collection"
            >
              <Pencil size={11} strokeWidth={2.5} />
            </button>
            <button
              className="icon-btn delete-btn"
              onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
              title="Delete collection"
            >
              <Trash2 size={11} strokeWidth={2.5} />
            </button>
          </span>
        )}
      </div>

      {isExpanded && (
        <div className="collection-requests">
          {col.requests.length === 0 && (
            <div className="collection-empty">No requests</div>
          )}

          {col.requests.map((req) => (
            <div
              key={req.id}
              className={`request-item ${activeRequestId === req.id ? 'active' : ''}`}
              onClick={() => editingReqId !== req.id && onSelectRequest(req)}
            >
              <span className="request-method" style={{ color: METHOD_COLORS[req.method] }}>
                {req.method}
              </span>
              {editingReqId === req.id ? (
                <input
                  autoFocus
                  className="request-edit-input"
                  type="text"
                  value={editReqName}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setEditReqName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameRequest();
                    if (e.key === 'Escape') setEditingReqId(null);
                  }}
                  onBlur={handleRenameRequest}
                />
              ) : (
                <span
                  className="request-name"
                  onDoubleClick={(e) => { e.stopPropagation(); setEditingReqId(req.id); setEditReqName(req.name || ''); }}
                >
                  {req.name || req.url || 'Untitled'}
                </span>
              )}
              {editingReqId !== req.id && (
                <span className="request-actions">
                  <button
                    className="icon-btn"
                    onClick={(e) => { e.stopPropagation(); setEditingReqId(req.id); setEditReqName(req.name || ''); }}
                    title="Rename request"
                  >
                    <Pencil size={10} strokeWidth={2.5} />
                  </button>
                  <button
                    className="icon-btn delete-btn"
                    onClick={(e) => { e.stopPropagation(); onDeleteRequest(col.id, req.id); }}
                    title="Delete request"
                  >
                    <X size={11} strokeWidth={2.5} />
                  </button>
                </span>
              )}
            </div>
          ))}

          {saving ? (
            <div className="sidebar-input-row save-row">
              <input
                autoFocus
                className="sidebar-input"
                type="text"
                placeholder="Request name..."
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') { setSaving(false); setSaveName(''); }
                }}
              />
              <button className="btn btn-primary btn-sm btn-icon" onClick={handleSave}>
                <Check size={12} strokeWidth={2.5} />
              </button>
              <button
                className="btn btn-ghost btn-sm btn-icon"
                onClick={() => { setSaving(false); setSaveName(''); }}
              >
                <X size={12} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              className="btn btn-ghost btn-sm save-here-btn"
              onClick={() => { setSaving(true); setSaveName(''); }}
            >
              <Save size={11} strokeWidth={2} /> Save current here
            </button>
          )}
        </div>
      )}
    </div>
  );
}
