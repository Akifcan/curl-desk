import { useState } from 'react';
import { Plus, X, Check, Zap } from 'lucide-react';
import { Collection, Request } from '../../types';
import { CollectionItem } from './CollectionItem';
import './Sidebar.css';

interface SidebarProps {
  collections: Collection[];
  activeRequestId: string;
  onSelectRequest: (req: Request) => void;
  onAddCollection: (name: string) => void;
  onDeleteCollection: (id: string) => void;
  onRenameCollection: (id: string, name: string) => void;
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
  onRenameCollection,
  onDeleteRequest,
  onNewRequest,
  onSaveToCollection,
}: SidebarProps) {
  const [addingCollection, setAddingCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  const handleAddCollection = () => {
    if (newCollectionName.trim()) {
      onAddCollection(newCollectionName.trim());
      setNewCollectionName('');
      setAddingCollection(false);
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
          <CollectionItem
            key={col.id}
            col={col}
            activeRequestId={activeRequestId}
            onSelectRequest={onSelectRequest}
            onDeleteCollection={onDeleteCollection}
            onRenameCollection={onRenameCollection}
            onDeleteRequest={onDeleteRequest}
            onSaveToCollection={onSaveToCollection}
          />
        ))}
      </div>
    </div>
  );
}
