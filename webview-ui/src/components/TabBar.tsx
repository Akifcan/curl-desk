import { Plus, X, Layers } from 'lucide-react';
import { AppTab, METHOD_COLORS } from '../types';

interface TabBarProps {
  tabs: AppTab[];
  activeTabId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
  onOpenEnv: () => void;
  activeEnvName: string | null;
}

function getTabLabel(tab: AppTab): string {
  if (tab.request.name && tab.request.name !== 'New Request') {
    return tab.request.name;
  }
  if (tab.request.url) {
    try {
      const u = new URL(tab.request.url);
      return u.pathname === '/' ? u.hostname : u.hostname + u.pathname;
    } catch {
      return tab.request.url;
    }
  }
  return 'New Request';
}

export function TabBar({ tabs, activeTabId, onSelect, onClose, onNew, onOpenEnv, activeEnvName }: TabBarProps) {
  return (
    <div className="tab-bar">
      <div className="tab-bar-list">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              className={`tab-bar-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelect(tab.id)}
            >
              {tab.isLoading ? (
                <span className="tab-bar-spinner" />
              ) : (
                <span
                  className="tab-bar-method"
                  style={{ color: METHOD_COLORS[tab.request.method] }}
                >
                  {tab.request.method}
                </span>
              )}
              <span className="tab-bar-label">{getTabLabel(tab)}</span>
              {tabs.length > 1 && (
                <button
                  className="tab-bar-close"
                  onClick={(e) => { e.stopPropagation(); onClose(tab.id); }}
                  title="Close tab"
                >
                  <X size={11} strokeWidth={2.5} />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <button className="tab-bar-new" onClick={onNew} title="New tab">
        <Plus size={13} strokeWidth={2.5} />
      </button>
      <button
        className={`tab-bar-env ${activeEnvName ? 'active' : ''}`}
        onClick={onOpenEnv}
        title="Manage environments"
      >
        <Layers size={12} strokeWidth={2} />
        {activeEnvName ? activeEnvName : 'No Env'}
      </button>
    </div>
  );
}
