import * as vscode from 'vscode';
import { CurlDeskPanel } from '../panels/CurlDeskPanel';

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'curl-desk.sidebar';
  private _view?: vscode.WebviewView;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = this._getHtml();

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'GET_COLLECTIONS': {
          const collections = this.context.globalState.get('curl-desk:collections', []);
          webviewView.webview.postMessage({ type: 'COLLECTIONS_LOADED', payload: collections });
          break;
        }
        case 'OPEN_PANEL': {
          CurlDeskPanel.createOrShow(this.context);
          // Pass selected request to main panel if provided
          if (message.payload) {
            setTimeout(() => {
              CurlDeskPanel.currentPanel?.loadRequest(message.payload);
            }, 300);
          }
          break;
        }
        case 'DELETE_COLLECTION': {
          const collections: unknown[] = this.context.globalState.get('curl-desk:collections', []);
          const updated = (collections as Array<{ id: string }>).filter(
            (c) => c.id !== message.payload
          );
          await this.context.globalState.update('curl-desk:collections', updated);
          webviewView.webview.postMessage({ type: 'COLLECTIONS_LOADED', payload: updated });
          break;
        }
        case 'DELETE_REQUEST': {
          const { collectionId, requestId } = message.payload as {
            collectionId: string;
            requestId: string;
          };
          const cols: unknown[] = this.context.globalState.get('curl-desk:collections', []);
          const updated = (cols as Array<{ id: string; requests: Array<{ id: string }> }>).map(
            (c) =>
              c.id === collectionId
                ? { ...c, requests: c.requests.filter((r) => r.id !== requestId) }
                : c
          );
          await this.context.globalState.update('curl-desk:collections', updated);
          webviewView.webview.postMessage({ type: 'COLLECTIONS_LOADED', payload: updated });
          break;
        }
      }
    });

    // Refresh when panel becomes visible
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        const collections = this.context.globalState.get('curl-desk:collections', []);
        webviewView.webview.postMessage({ type: 'COLLECTIONS_LOADED', payload: collections });
      }
    });
  }

  /** Called by main panel when collections change, to keep sidebar in sync */
  public refresh() {
    if (this._view?.visible) {
      const collections = this.context.globalState.get('curl-desk:collections', []);
      this._view.webview.postMessage({ type: 'COLLECTIONS_LOADED', payload: collections });
    }
  }

  private _getHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline';">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: var(--vscode-font-family);
    font-size: 12px;
    color: var(--vscode-foreground);
    background: var(--vscode-sideBar-background);
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .top-section {
    padding: 10px;
    border-bottom: 1px solid var(--vscode-panel-border);
    flex-shrink: 0;
  }

  .open-btn {
    width: 100%;
    padding: 7px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .open-btn:hover { background: var(--vscode-button-hoverBackground); }

  .tabs {
    display: flex;
    border-bottom: 1px solid var(--vscode-panel-border);
    flex-shrink: 0;
  }

  .tab {
    flex: 1;
    padding: 8px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--vscode-tab-inactiveForeground);
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    text-align: center;
  }

  .tab.active {
    color: var(--vscode-tab-activeForeground);
    border-bottom-color: var(--vscode-focusBorder);
  }

  .search-box {
    padding: 6px 8px;
    border-bottom: 1px solid var(--vscode-panel-border);
    flex-shrink: 0;
  }

  .search-input {
    width: 100%;
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1px solid var(--vscode-input-border);
    border-radius: 3px;
    padding: 4px 8px;
    font-size: 12px;
    outline: none;
  }

  .search-input:focus { border-color: var(--vscode-focusBorder); }
  .search-input::placeholder { color: var(--vscode-input-placeholderForeground); }

  .list {
    flex: 1;
    overflow-y: auto;
  }

  .empty {
    padding: 24px 12px;
    text-align: center;
    color: var(--vscode-descriptionForeground);
    font-size: 11px;
    line-height: 1.7;
  }

  .collection-header {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 8px;
    cursor: pointer;
    font-weight: 600;
    color: var(--vscode-foreground);
    font-size: 12px;
    user-select: none;
  }

  .collection-header:hover { background: var(--vscode-list-hoverBackground); }

  .caret { font-size: 10px; color: var(--vscode-descriptionForeground); width: 10px; }
  .col-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .col-count {
    font-size: 10px;
    background: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
    border-radius: 8px;
    padding: 1px 5px;
    min-width: 16px;
    text-align: center;
  }

  .icon-btn {
    background: none; border: none; cursor: pointer;
    padding: 1px 4px; border-radius: 3px;
    font-size: 11px; opacity: 0;
    color: var(--vscode-descriptionForeground);
  }

  .collection-header:hover .icon-btn,
  .request-row:hover .icon-btn { opacity: 1; }

  .icon-btn:hover { color: #e06c75 !important; }

  .request-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 8px 5px 22px;
    cursor: pointer;
    font-size: 11px;
  }

  .request-row:hover { background: var(--vscode-list-hoverBackground); }

  .method {
    font-size: 10px;
    font-weight: 700;
    min-width: 42px;
    flex-shrink: 0;
  }

  .req-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--vscode-foreground);
  }

  .history-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 8px;
    cursor: pointer;
    border-bottom: 1px solid var(--vscode-panel-border);
  }

  .history-item:hover { background: var(--vscode-list-hoverBackground); }

  .history-info { flex: 1; min-width: 0; }

  .history-url {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--vscode-foreground);
    font-size: 11px;
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: var(--vscode-scrollbarSlider-background); border-radius: 2px; }
</style>
</head>
<body>
<div class="top-section">
  <button class="open-btn" onclick="openPanel()">⚡ Open Curl Desk</button>
</div>

<div class="tabs">
  <button class="tab active" id="tab-collections" onclick="switchTab('collections')">Collections</button>
  <button class="tab" id="tab-history" onclick="switchTab('history')">History</button>
</div>

<div class="search-box">
  <input class="search-input" type="text" placeholder="Search..." oninput="handleSearch(this.value)" />
</div>

<div class="list" id="list-content">
  <div class="empty">Loading...</div>
</div>

<script>
  const vscode = acquireVsCodeApi();
  let collections = [];
  let activeTab = 'collections';
  let searchQuery = '';
  const METHOD_COLORS = {
    GET: '#61afef', POST: '#98c379', PUT: '#e5c07b',
    DELETE: '#e06c75', PATCH: '#c678dd', HEAD: '#56b6c2', OPTIONS: '#abb2bf'
  };
  const expanded = new Set();

  vscode.postMessage({ type: 'GET_COLLECTIONS' });

  window.addEventListener('message', (e) => {
    if (e.data.type === 'COLLECTIONS_LOADED') {
      collections = e.data.payload || [];
      render();
    }
  });

  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    render();
  }

  function handleSearch(q) {
    searchQuery = q.toLowerCase();
    render();
  }

  function openPanel(request) {
    vscode.postMessage({ type: 'OPEN_PANEL', payload: request || null });
  }

  function toggleCollection(id) {
    expanded.has(id) ? expanded.delete(id) : expanded.add(id);
    render();
  }

  function deleteCollection(id) {
    vscode.postMessage({ type: 'DELETE_COLLECTION', payload: id });
  }

  function deleteRequest(collectionId, requestId) {
    vscode.postMessage({ type: 'DELETE_REQUEST', payload: { collectionId, requestId } });
  }

  function render() {
    const el = document.getElementById('list-content');

    if (activeTab === 'history') {
      const allRequests = collections.flatMap(c => c.requests);
      if (allRequests.length === 0) {
        el.innerHTML = '<div class="empty">No history yet.<br>Send some requests first.</div>';
        return;
      }
      const filtered = searchQuery
        ? allRequests.filter(r => r.url?.toLowerCase().includes(searchQuery) || r.method?.toLowerCase().includes(searchQuery))
        : allRequests;

      el.innerHTML = filtered.map(req => \`
        <div class="history-item" onclick='openPanel(\${JSON.stringify(req).replace(/'/g, "&#39;")})'>
          <span class="method" style="color:\${METHOD_COLORS[req.method] || '#abb2bf'}">\${req.method}</span>
          <div class="history-info">
            <div class="history-url">\${req.url || 'Untitled'}</div>
          </div>
        </div>
      \`).join('');
      return;
    }

    // Collections tab
    if (collections.length === 0) {
      el.innerHTML = '<div class="empty">No collections yet.<br>Open Curl Desk to create one.</div>';
      return;
    }

    const filtered = collections.map(col => ({
      ...col,
      requests: searchQuery
        ? col.requests.filter(r =>
            r.name?.toLowerCase().includes(searchQuery) ||
            r.url?.toLowerCase().includes(searchQuery) ||
            r.method?.toLowerCase().includes(searchQuery)
          )
        : col.requests
    })).filter(col => !searchQuery || col.requests.length > 0 || col.name.toLowerCase().includes(searchQuery));

    el.innerHTML = filtered.map(col => {
      const isOpen = expanded.has(col.id) || !!searchQuery;
      return \`
        <div>
          <div class="collection-header" onclick="toggleCollection('\${col.id}')">
            <span class="caret">\${isOpen ? '▾' : '▸'}</span>
            <span class="col-name">\${col.name}</span>
            <span class="col-count">\${col.requests.length}</span>
            <button class="icon-btn" onclick="event.stopPropagation(); deleteCollection('\${col.id}')" title="Delete">✕</button>
          </div>
          \${isOpen ? \`<div>\${
            col.requests.length === 0
              ? '<div style="padding:4px 22px;font-size:11px;color:var(--vscode-descriptionForeground)">No requests</div>'
              : col.requests.map(req => \`
                <div class="request-row" onclick='openPanel(\${JSON.stringify(req).replace(/'/g, "&#39;")})'>
                  <span class="method" style="color:\${METHOD_COLORS[req.method] || '#abb2bf'}">\${req.method}</span>
                  <span class="req-name">\${req.name || req.url || 'Untitled'}</span>
                  <button class="icon-btn" onclick="event.stopPropagation(); deleteRequest('\${col.id}', '\${req.id}')" title="Delete">✕</button>
                </div>
              \`).join('')
          }</div>\` : ''}
        </div>
      \`;
    }).join('');
  }
</script>
</body>
</html>`;
  }
}
