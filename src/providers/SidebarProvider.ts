import * as vscode from 'vscode';
import { CurlDeskPanel } from '../panels/CurlDeskPanel';
import { executeRequest } from '../utils/httpClient';

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
        case 'SEND_REQUEST': {
          try {
            const response = await executeRequest(message.payload);
            webviewView.webview.postMessage({ type: 'REQUEST_RESPONSE', payload: response });
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Request failed';
            webviewView.webview.postMessage({ type: 'REQUEST_ERROR', payload: { message: msg } });
          }
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

  /* Top Button */
  .top-section { padding: 10px; border-bottom: 1px solid var(--vscode-panel-border); flex-shrink: 0; }

  .open-btn {
    width: 100%; padding: 8px 12px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none; border-radius: 6px; cursor: pointer;
    font-size: 12px; font-weight: 600;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    transition: background 0.15s;
  }
  .open-btn:hover { background: var(--vscode-button-hoverBackground); }

  /* Quick Request Panel */
  .quick-section { border-bottom: 1px solid var(--vscode-panel-border); flex-shrink: 0; }

  .qr-url-bar {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 10px;
    border-bottom: 1px solid var(--vscode-panel-border);
    background: var(--vscode-editorGroupHeader-tabsBackground, var(--vscode-sideBar-background));
  }

  .qr-method {
    background: var(--vscode-input-background);
    border: 1.5px solid var(--vscode-input-border);
    border-radius: 6px; padding: 5px 18px 5px 7px;
    font-size: 11px; font-weight: 700; cursor: pointer; outline: none;
    appearance: none; -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 10 6'%3E%3Cpath fill='%23636d83' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 5px center;
    min-width: 60px; transition: border-color 0.15s;
  }
  .qr-method:focus { border-color: var(--vscode-focusBorder); }

  .qr-url {
    flex: 1; background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1.5px solid var(--vscode-input-border);
    border-radius: 6px; padding: 5px 8px;
    font-size: 11px; outline: none; min-width: 0;
    font-family: var(--vscode-editor-font-family, monospace);
    transition: border-color 0.15s;
  }
  .qr-url:focus { border-color: var(--vscode-focusBorder); }
  .qr-url::placeholder { color: var(--vscode-input-placeholderForeground); }

  .qr-send {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none; border-radius: 6px;
    padding: 5px 10px; cursor: pointer; font-size: 13px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s;
  }
  .qr-send:hover { background: var(--vscode-button-hoverBackground); }
  .qr-send:disabled { opacity: 0.4; cursor: not-allowed; }

  .qr-tabs { display: flex; border-bottom: 1px solid var(--vscode-panel-border); }
  .qr-tab {
    flex: 1; background: none; border: none;
    border-bottom: 2px solid transparent;
    color: var(--vscode-tab-inactiveForeground);
    cursor: pointer; padding: 7px 6px;
    font-size: 11px; font-weight: 500;
    text-align: center; margin-bottom: -1px;
    transition: color 0.15s, border-color 0.15s;
  }
  .qr-tab:hover { color: var(--vscode-foreground); }
  .qr-tab.active { color: var(--vscode-tab-activeForeground); border-bottom-color: var(--vscode-focusBorder); font-weight: 600; }

  .qr-tab-content { max-height: 120px; overflow-y: auto; padding: 4px 0; }

  .kv-row { display: flex; gap: 4px; padding: 3px 8px; align-items: center; border-radius: 4px; margin: 0 4px; }
  .kv-row:hover { background: var(--vscode-list-hoverBackground); }
  .kv-key, .kv-val {
    flex: 1; background: transparent; color: var(--vscode-foreground);
    border: 1px solid transparent; border-radius: 4px;
    padding: 3px 5px; font-size: 11px; outline: none; min-width: 0;
    font-family: var(--vscode-editor-font-family, monospace);
    transition: background 0.1s, border-color 0.1s;
  }
  .kv-key:focus, .kv-val:focus { background: var(--vscode-input-background); border-color: var(--vscode-input-border); }
  .kv-key::placeholder, .kv-val::placeholder { color: var(--vscode-input-placeholderForeground); }
  .kv-del { background: none; border: none; cursor: pointer; padding: 2px 4px; border-radius: 3px; font-size: 10px; opacity: 0; color: var(--vscode-descriptionForeground); flex-shrink: 0; transition: opacity 0.1s; }
  .kv-row:hover .kv-del { opacity: 1; }
  .kv-del:hover { color: #e06c75; }

  .body-type-row { display: flex; gap: 10px; padding: 6px 10px; flex-wrap: wrap; border-bottom: 1px solid var(--vscode-panel-border); }
  .radio-label { display: flex; align-items: center; gap: 4px; font-size: 11px; cursor: pointer; color: var(--vscode-foreground); }

  .body-editor {
    width: 100%; background: transparent; color: var(--vscode-foreground);
    border: none; padding: 6px 10px; font-size: 11px;
    font-family: var(--vscode-editor-font-family, monospace);
    resize: none; outline: none; min-height: 60px; line-height: 1.6; display: block;
  }
  .body-editor::placeholder { color: var(--vscode-input-placeholderForeground); }

  .auth-section { padding: 8px 10px; display: flex; flex-direction: column; gap: 7px; }
  .field-label { font-size: 10px; font-weight: 600; color: var(--vscode-descriptionForeground); margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.4px; }
  .auth-select, .auth-input {
    width: 100%; background: var(--vscode-input-background); color: var(--vscode-input-foreground);
    border: 1.5px solid var(--vscode-input-border); border-radius: 6px;
    padding: 5px 8px; font-size: 11px; outline: none;
    transition: border-color 0.15s;
  }
  .auth-select:focus, .auth-input:focus { border-color: var(--vscode-focusBorder); }
  .auth-input::placeholder { color: var(--vscode-input-placeholderForeground); }

  .qr-response { border-top: 1px solid var(--vscode-panel-border); display: none; }
  .qr-resp-bar { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-bottom: 1px solid var(--vscode-panel-border); background: var(--vscode-editorGroupHeader-tabsBackground, var(--vscode-sideBar-background)); }
  .qr-resp-status { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 10px; }
  .qr-resp-meta { font-size: 10px; color: var(--vscode-descriptionForeground); font-weight: 500; }
  .qr-resp-body {
    margin: 0; padding: 6px 10px; font-size: 11px;
    font-family: var(--vscode-editor-font-family, monospace);
    max-height: 120px; overflow-y: auto;
    white-space: pre-wrap; word-break: break-all; line-height: 1.6;
  }
  .qr-resp-error { padding: 6px 10px; font-size: 11px; color: #e06c75; word-break: break-word; }

  .spinner {
    display: inline-block; width: 11px; height: 11px;
    border: 2px solid rgba(255,255,255,0.25); border-top-color: #fff;
    border-radius: 50%; animation: spin 0.6s linear infinite; vertical-align: middle;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Collections/History Tabs */
  .tabs { display: flex; border-bottom: 1px solid var(--vscode-panel-border); flex-shrink: 0; }
  .tab {
    flex: 1; padding: 8px; background: none; border: none;
    border-bottom: 2px solid transparent;
    color: var(--vscode-tab-inactiveForeground);
    cursor: pointer; font-size: 12px; font-weight: 500; text-align: center;
    margin-bottom: -1px; transition: color 0.15s, border-color 0.15s;
  }
  .tab:hover { color: var(--vscode-foreground); }
  .tab.active { color: var(--vscode-tab-activeForeground); border-bottom-color: var(--vscode-focusBorder); font-weight: 600; }

  /* Search */
  .search-box { padding: 8px; border-bottom: 1px solid var(--vscode-panel-border); flex-shrink: 0; }
  .search-input {
    width: 100%; background: var(--vscode-input-background); color: var(--vscode-input-foreground);
    border: 1.5px solid var(--vscode-input-border); border-radius: 6px;
    padding: 5px 10px; font-size: 12px; outline: none; transition: border-color 0.15s;
  }
  .search-input:focus { border-color: var(--vscode-focusBorder); }
  .search-input::placeholder { color: var(--vscode-input-placeholderForeground); }

  .list { flex: 1; overflow-y: auto; padding: 6px 0; }

  .empty { padding: 24px 12px; text-align: center; color: var(--vscode-descriptionForeground); font-size: 11px; line-height: 1.7; }

  /* Collection Cards */
  .collection-card { margin: 4px 8px; border-radius: 6px; border: 1px solid var(--vscode-panel-border); overflow: hidden; }

  .collection-header {
    display: flex; align-items: center; gap: 5px;
    padding: 7px 10px; cursor: pointer;
    font-weight: 600; color: var(--vscode-foreground); font-size: 12px; user-select: none;
    background: var(--vscode-editorWidget-background, var(--vscode-sideBar-background));
    transition: background 0.1s;
  }
  .collection-header:hover { background: var(--vscode-list-hoverBackground); }

  .caret { font-size: 10px; color: var(--vscode-descriptionForeground); width: 10px; }
  .col-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .col-count {
    font-size: 10px; font-weight: 600;
    background: var(--vscode-badge-background); color: var(--vscode-badge-foreground);
    border-radius: 10px; padding: 1px 6px; min-width: 18px; text-align: center;
  }

  .icon-btn {
    background: none; border: none; cursor: pointer; padding: 2px 4px; border-radius: 3px;
    font-size: 11px; opacity: 0; color: var(--vscode-descriptionForeground); transition: opacity 0.1s;
  }
  .collection-header:hover .icon-btn,
  .request-row:hover .icon-btn { opacity: 1; }
  .icon-btn:hover { color: #e06c75 !important; }

  .collection-body { border-top: 1px solid var(--vscode-panel-border); padding: 4px 0; }

  .request-row {
    display: flex; align-items: center; gap: 7px;
    padding: 6px 10px 6px 22px; cursor: pointer; font-size: 11px;
    border-radius: 4px; margin: 1px 6px; transition: background 0.1s;
  }
  .request-row:hover { background: var(--vscode-list-hoverBackground); }

  .method { font-size: 10px; font-weight: 700; min-width: 42px; flex-shrink: 0; }
  .req-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--vscode-foreground); }

  /* History */
  .history-item {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 10px; cursor: pointer;
    border-radius: 6px; margin: 3px 8px; transition: background 0.1s;
    border: 1px solid var(--vscode-panel-border);
  }
  .history-item:hover { background: var(--vscode-list-hoverBackground); }
  .history-info { flex: 1; min-width: 0; }
  .history-url { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--vscode-foreground); font-size: 11px; }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: var(--vscode-scrollbarSlider-background); border-radius: 2px; }
</style>
</head>
<body>
<div class="top-section">
  <button class="open-btn" onclick="openPanel()">⚡ Open Curl Desk</button>
</div>

<div class="quick-section">
  <div class="qr-url-bar">
    <select class="qr-method" id="qr-method" onchange="qrState.method = this.value; this.style.color = METHOD_COLORS[this.value] || '#abb2bf'">
      <option value="GET">GET</option>
      <option value="POST">POST</option>
      <option value="PUT">PUT</option>
      <option value="DELETE">DELETE</option>
      <option value="PATCH">PATCH</option>
      <option value="HEAD">HEAD</option>
      <option value="OPTIONS">OPTIONS</option>
    </select>
    <input class="qr-url" id="qr-url" type="text" placeholder="URL"
      oninput="qrState.url = this.value"
      onkeydown="if(event.key==='Enter') sendQuickRequest()" />
    <button class="qr-send" id="qr-send-btn" onclick="sendQuickRequest()" title="Send">&#9654;</button>
  </div>
  <div class="qr-tabs">
    <button class="qr-tab active" id="qrtab-headers" onclick="switchQrTab('headers')">Headers</button>
    <button class="qr-tab" id="qrtab-body" onclick="switchQrTab('body')">Body</button>
    <button class="qr-tab" id="qrtab-auth" onclick="switchQrTab('auth')">Auth</button>
  </div>
  <div class="qr-tab-content" id="qr-tab-content"></div>
  <div class="qr-response" id="qr-response"></div>
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

  // Quick Request State
  const qrState = {
    method: 'GET',
    url: '',
    headers: [{ key: '', value: '' }],
    bodyType: 'none',
    body: '',
    authType: 'none',
    authToken: '',
    authUser: '',
    authPass: '',
    activeTab: 'headers',
    isLoading: false,
  };

  function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function switchQrTab(tab) {
    qrState.activeTab = tab;
    document.querySelectorAll('.qr-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('qrtab-' + tab).classList.add('active');
    renderQrTabContent();
  }

  function renderQrTabContent() {
    const el = document.getElementById('qr-tab-content');
    if (qrState.activeTab === 'headers') {
      el.innerHTML = qrState.headers.map((h, i) => \`
        <div class="kv-row">
          <input class="kv-key" type="text" placeholder="key" value="\${escHtml(h.key)}"
            oninput="updateHeader(\${i}, 'key', this.value)" />
          <input class="kv-val" type="text" placeholder="value" value="\${escHtml(h.value)}"
            oninput="updateHeader(\${i}, 'value', this.value)" />
          <button class="kv-del" onclick="removeHeader(\${i})">&#10005;</button>
        </div>
      \`).join('');
    } else if (qrState.activeTab === 'body') {
      el.innerHTML = \`
        <div class="body-type-row">
          \${['none', 'json', 'text', 'form'].map(t => \`
            <label class="radio-label">
              <input type="radio" name="qr-body-type" value="\${t}" \${qrState.bodyType === t ? 'checked' : ''}
                onchange="qrState.bodyType = this.value; renderQrTabContent()" />
              \${t === 'none' ? 'None' : t === 'json' ? 'JSON' : t === 'text' ? 'Text' : 'Form'}
            </label>
          \`).join('')}
        </div>
        \${qrState.bodyType !== 'none' ? \`
          <textarea class="body-editor"
            placeholder="\${qrState.bodyType === 'json' ? '{\\n  &quot;key&quot;: &quot;value&quot;\\n}' : qrState.bodyType === 'form' ? 'key=value&amp;key2=value2' : 'Request body...'}"
            oninput="qrState.body = this.value">\${escHtml(qrState.body)}</textarea>
        \` : '<div style="padding:8px;font-size:11px;color:var(--vscode-descriptionForeground)">No body.</div>'}
      \`;
    } else if (qrState.activeTab === 'auth') {
      el.innerHTML = \`
        <div class="auth-section">
          <div>
            <div class="field-label">Auth Type</div>
            <select class="auth-select" onchange="qrState.authType = this.value; renderQrTabContent()">
              <option value="none" \${qrState.authType === 'none' ? 'selected' : ''}>No Auth</option>
              <option value="bearer" \${qrState.authType === 'bearer' ? 'selected' : ''}>Bearer Token</option>
              <option value="basic" \${qrState.authType === 'basic' ? 'selected' : ''}>Basic Auth</option>
            </select>
          </div>
          \${qrState.authType === 'bearer' ? \`
            <div>
              <div class="field-label">Token</div>
              <input class="auth-input" type="text" placeholder="your-token" value="\${escHtml(qrState.authToken)}"
                oninput="qrState.authToken = this.value" />
            </div>
          \` : ''}
          \${qrState.authType === 'basic' ? \`
            <div>
              <div class="field-label">Username</div>
              <input class="auth-input" type="text" placeholder="username" value="\${escHtml(qrState.authUser)}"
                oninput="qrState.authUser = this.value" />
            </div>
            <div>
              <div class="field-label">Password</div>
              <input class="auth-input" type="password" placeholder="password" value="\${escHtml(qrState.authPass)}"
                oninput="qrState.authPass = this.value" />
            </div>
          \` : ''}
        </div>
      \`;
    }
  }

  function updateHeader(index, field, value) {
    qrState.headers[index][field] = value;
    const last = qrState.headers[qrState.headers.length - 1];
    if (last.key || last.value) {
      qrState.headers.push({ key: '', value: '' });
      renderQrTabContent();
    }
  }

  function removeHeader(index) {
    qrState.headers.splice(index, 1);
    if (qrState.headers.length === 0) qrState.headers.push({ key: '', value: '' });
    renderQrTabContent();
  }

  function sendQuickRequest() {
    if (!qrState.url.trim() || qrState.isLoading) return;
    qrState.isLoading = true;
    const sendBtn = document.getElementById('qr-send-btn');
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span class="spinner"></span>';

    const hdrs = {};
    qrState.headers.filter(h => h.key.trim()).forEach(h => { hdrs[h.key] = h.value; });
    if (qrState.authType === 'bearer' && qrState.authToken) {
      hdrs['Authorization'] = 'Bearer ' + qrState.authToken;
    } else if (qrState.authType === 'basic') {
      hdrs['Authorization'] = 'Basic ' + btoa(qrState.authUser + ':' + qrState.authPass);
    }
    if (qrState.bodyType === 'json') hdrs['Content-Type'] = 'application/json';
    else if (qrState.bodyType === 'form') hdrs['Content-Type'] = 'application/x-www-form-urlencoded';

    vscode.postMessage({
      type: 'SEND_REQUEST',
      payload: {
        method: qrState.method,
        url: qrState.url,
        headers: hdrs,
        body: qrState.bodyType !== 'none' ? qrState.body : undefined,
        params: {},
      }
    });
  }

  function renderQrResponse(type, payload) {
    const el = document.getElementById('qr-response');
    el.style.display = 'block';
    const sendBtn = document.getElementById('qr-send-btn');
    sendBtn.disabled = false;
    sendBtn.innerHTML = '&#9654;';
    qrState.isLoading = false;

    if (type === 'REQUEST_ERROR') {
      el.innerHTML = \`<div class="qr-resp-error">\${escHtml(payload.message)}</div>\`;
      return;
    }
    const statusColor = payload.status < 300 ? '#98c379' : payload.status < 400 ? '#e5c07b' : '#e06c75';
    el.innerHTML = \`
      <div class="qr-resp-bar">
        <span class="qr-resp-status" style="color:\${statusColor}">\${payload.status} \${escHtml(payload.statusText)}</span>
        <span class="qr-resp-meta">\${payload.time}ms</span>
        <span class="qr-resp-meta">\${(payload.size / 1024).toFixed(1)}KB</span>
      </div>
      <pre class="qr-resp-body">\${escHtml(payload.body)}</pre>
    \`;
  }

  // Initialize quick request panel
  document.getElementById('qr-method').style.color = METHOD_COLORS['GET'];
  renderQrTabContent();

  vscode.postMessage({ type: 'GET_COLLECTIONS' });

  window.addEventListener('message', (e) => {
    if (e.data.type === 'COLLECTIONS_LOADED') {
      collections = e.data.payload || [];
      render();
    } else if (e.data.type === 'REQUEST_RESPONSE') {
      renderQrResponse('REQUEST_RESPONSE', e.data.payload);
    } else if (e.data.type === 'REQUEST_ERROR') {
      renderQrResponse('REQUEST_ERROR', e.data.payload);
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
        <div class="collection-card">
          <div class="collection-header" onclick="toggleCollection('\${col.id}')">
            <span class="caret">\${isOpen ? '▾' : '▸'}</span>
            <span class="col-name">\${col.name}</span>
            <span class="col-count">\${col.requests.length}</span>
            <button class="icon-btn" onclick="event.stopPropagation(); deleteCollection('\${col.id}')" title="Delete">✕</button>
          </div>
          \${isOpen ? \`<div class="collection-body">\${
            col.requests.length === 0
              ? '<div style="padding:6px 22px;font-size:11px;color:var(--vscode-descriptionForeground)">No requests</div>'
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
