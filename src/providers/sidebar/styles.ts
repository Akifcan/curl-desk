export function sidebarStyles(): string {
  return `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: var(--vscode-font-family);
    font-size: 13px;
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
    width: 100%; padding: 9px 12px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    border: none; border-radius: 6px; cursor: pointer;
    font-size: 13px; font-weight: 600;
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
    border-radius: 6px; padding: 6px 20px 6px 8px;
    font-size: 12px; font-weight: 700; cursor: pointer; outline: none;
    appearance: none; -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 10 6'%3E%3Cpath fill='%23636d83' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 5px center;
    min-width: 64px; transition: border-color 0.15s;
  }
  .qr-method:focus { border-color: var(--vscode-focusBorder); }

  .qr-url-wrap {
    flex: 1; position: relative; min-width: 0;
  }
  .qr-url-mirror {
    position: absolute; inset: 0;
    padding: 6px 9px; font-size: 12px;
    font-family: var(--vscode-editor-font-family, monospace);
    white-space: pre; overflow: hidden; pointer-events: none;
    color: transparent; border: 1.5px solid transparent;
    border-radius: 6px; line-height: normal; box-sizing: border-box;
  }
  .qr-url-mirror .var-defined { background: rgba(152, 195, 121, 0.25); box-shadow: 0 0 0 1px rgba(152, 195, 121, 0.4); border-radius: 3px; color: transparent; }
  .qr-url-mirror .var-undefined { background: rgba(224, 108, 117, 0.2); box-shadow: 0 0 0 1px rgba(224, 108, 117, 0.4); border-radius: 3px; color: transparent; }

  .qr-url {
    width: 100%; background: transparent;
    color: var(--vscode-input-foreground);
    border: 1.5px solid var(--vscode-input-border);
    border-radius: 6px; padding: 6px 9px;
    font-size: 12px; outline: none; min-width: 0;
    font-family: var(--vscode-editor-font-family, monospace);
    transition: border-color 0.15s; position: relative; box-sizing: border-box;
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
    cursor: pointer; padding: 8px 6px;
    font-size: 12px; font-weight: 500;
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
    padding: 4px 5px; font-size: 12px; outline: none; min-width: 0;
    font-family: var(--vscode-editor-font-family, monospace);
    transition: background 0.1s, border-color 0.1s;
  }
  .kv-key:focus, .kv-val:focus { background: var(--vscode-input-background); border-color: var(--vscode-input-border); }
  .kv-key::placeholder, .kv-val::placeholder { color: var(--vscode-input-placeholderForeground); }
  .kv-del { background: none; border: none; cursor: pointer; padding: 2px 4px; border-radius: 3px; font-size: 10px; opacity: 0; color: var(--vscode-descriptionForeground); flex-shrink: 0; transition: opacity 0.1s; }
  .kv-row:hover .kv-del { opacity: 1; }
  .kv-del:hover { color: #e06c75; }

  .body-type-row { display: flex; gap: 10px; padding: 7px 10px; flex-wrap: wrap; border-bottom: 1px solid var(--vscode-panel-border); }
  .radio-label { display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer; color: var(--vscode-foreground); }

  .form-type-select {
    width: 54px; flex-shrink: 0;
    background: var(--vscode-input-background); color: var(--vscode-descriptionForeground);
    border: 1px solid transparent; border-radius: 4px;
    padding: 3px 3px; font-size: 11px; outline: none; cursor: pointer;
    transition: border-color 0.1s;
  }
  .form-type-select:hover, .form-type-select:focus { border-color: var(--vscode-input-border); }

  .file-pick-btn {
    flex: 2; display: flex; align-items: center; gap: 4px;
    padding: 3px 5px; background: transparent; border: 1px solid transparent; border-radius: 4px;
    cursor: pointer; font-size: 11px; color: var(--vscode-foreground); overflow: hidden; min-width: 0;
    transition: background 0.1s, border-color 0.1s;
  }
  .file-pick-btn:hover { background: var(--vscode-input-background); border-color: var(--vscode-input-border); }
  .file-pick-btn span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .file-placeholder { color: var(--vscode-input-placeholderForeground) !important; }

  .body-editor {
    width: 100%; background: transparent; color: var(--vscode-foreground);
    border: none; padding: 7px 10px; font-size: 12px;
    font-family: var(--vscode-editor-font-family, monospace);
    resize: none; outline: none; min-height: 60px; line-height: 1.6; display: block;
  }
  .body-editor::placeholder { color: var(--vscode-input-placeholderForeground); }

  .auth-section { padding: 8px 10px; display: flex; flex-direction: column; gap: 7px; }
  .field-label { font-size: 11px; font-weight: 600; color: var(--vscode-descriptionForeground); margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.4px; }
  .auth-select, .auth-input {
    width: 100%; background: var(--vscode-input-background); color: var(--vscode-input-foreground);
    border: 1.5px solid var(--vscode-input-border); border-radius: 6px;
    padding: 6px 9px; font-size: 12px; outline: none;
    transition: border-color 0.15s;
  }
  .auth-select:focus, .auth-input:focus { border-color: var(--vscode-focusBorder); }
  .auth-input::placeholder { color: var(--vscode-input-placeholderForeground); }

  .qr-response { border-top: 1px solid var(--vscode-panel-border); min-height: 80px; max-height: 160px; overflow-y: auto; }
  .qr-resize-handle {
    height: 5px; cursor: ns-resize; background: transparent;
    position: relative; flex-shrink: 0;
  }
  .qr-resize-handle:hover, .qr-resize-handle.active { background: var(--vscode-focusBorder); height: 3px; }
  .qr-resp-bar { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-bottom: 1px solid var(--vscode-panel-border); background: var(--vscode-editorGroupHeader-tabsBackground, var(--vscode-sideBar-background)); }
  .qr-resp-status { font-size: 12px; font-weight: 700; padding: 2px 9px; border-radius: 10px; }
  .qr-resp-meta { font-size: 11px; color: var(--vscode-descriptionForeground); font-weight: 500; }
  .qr-resp-error { padding: 7px 10px; font-size: 12px; color: #e06c75; word-break: break-word; }

  .sb-editor { display: flex; min-height: 100%; }
  .sb-gutter {
    display: flex; flex-direction: column;
    padding: 6px 0;
    border-right: 1px solid var(--vscode-panel-border);
    flex-shrink: 0; user-select: none;
    position: sticky; left: 0; z-index: 1;
    background: var(--vscode-editorGutter-background, var(--vscode-sideBar-background));
  }
  .sb-line-num {
    display: block; padding: 0 8px 0 10px;
    font-size: 11px; line-height: 1.6;
    font-family: var(--vscode-editor-font-family, monospace);
    color: var(--vscode-editorLineNumber-foreground, #495162);
    text-align: right; min-width: 24px;
  }
  .sb-code {
    margin: 0; padding: 6px 10px; font-size: 11px;
    font-family: var(--vscode-editor-font-family, monospace);
    line-height: 1.6; color: var(--vscode-foreground);
    white-space: pre-wrap; word-break: break-all;
    flex: 1; min-width: 0;
  }
  .syn-key { color: #9cdcfe; }
  .syn-str { color: #ce9178; }
  .syn-num { color: #b5cea8; }
  .syn-bool { color: #569cd6; }
  .syn-null { color: #569cd6; font-style: italic; }

  .spinner {
    display: inline-block; width: 11px; height: 11px;
    border: 2px solid rgba(255,255,255,0.25); border-top-color: #fff;
    border-radius: 50%; animation: spin 0.6s linear infinite; vertical-align: middle;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Collections/History Tabs */
  .tabs { display: flex; border-bottom: 1px solid var(--vscode-panel-border); flex-shrink: 0; }
  .tab {
    flex: 1; padding: 9px; background: none; border: none;
    border-bottom: 2px solid transparent;
    color: var(--vscode-tab-inactiveForeground);
    cursor: pointer; font-size: 13px; font-weight: 500; text-align: center;
    margin-bottom: -1px; transition: color 0.15s, border-color 0.15s;
  }
  .tab:hover { color: var(--vscode-foreground); }
  .tab.active { color: var(--vscode-tab-activeForeground); border-bottom-color: var(--vscode-focusBorder); font-weight: 600; }

  /* Search */
  .search-box { padding: 8px; border-bottom: 1px solid var(--vscode-panel-border); flex-shrink: 0; }
  .search-input {
    width: 100%; background: var(--vscode-input-background); color: var(--vscode-input-foreground);
    border: 1.5px solid var(--vscode-input-border); border-radius: 6px;
    padding: 6px 10px; font-size: 13px; outline: none; transition: border-color 0.15s;
  }
  .search-input:focus { border-color: var(--vscode-focusBorder); }
  .search-input::placeholder { color: var(--vscode-input-placeholderForeground); }

  .list { flex: 1; overflow-y: auto; padding: 6px 0; }

  .empty { padding: 24px 12px; text-align: center; color: var(--vscode-descriptionForeground); font-size: 12px; line-height: 1.7; }

  /* Collection Cards */
  .collection-card { margin: 4px 8px; border-radius: 6px; border: 1px solid var(--vscode-panel-border); overflow: hidden; }

  .collection-header {
    display: flex; align-items: center; gap: 5px;
    padding: 8px 10px; cursor: pointer;
    font-weight: 600; color: var(--vscode-foreground); font-size: 13px; user-select: none;
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
  .request-row:hover .icon-btn,
  .history-item:hover .icon-btn { opacity: 1; }
  .icon-btn:hover { color: #e06c75 !important; }

  .collection-body { border-top: 1px solid var(--vscode-panel-border); padding: 4px 0; }

  .request-row {
    display: flex; align-items: center; gap: 7px;
    padding: 7px 10px 7px 22px; cursor: pointer; font-size: 12px;
    border-radius: 4px; margin: 1px 6px; transition: background 0.1s;
  }
  .request-row:hover { background: var(--vscode-list-hoverBackground); }

  .method { font-size: 11px; font-weight: 700; min-width: 44px; flex-shrink: 0; }
  .req-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--vscode-foreground); }

  /* History */
  .history-item {
    display: flex; align-items: center; gap: 8px;
    padding: 9px 10px; cursor: pointer;
    border-radius: 6px; margin: 3px 8px; transition: background 0.1s;
    border: 1px solid var(--vscode-panel-border);
  }
  .history-item:hover { background: var(--vscode-list-hoverBackground); }
  .history-info { flex: 1; min-width: 0; }
  .history-url { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--vscode-foreground); font-size: 12px; }

  .col-rename-input {
    width: 100%; background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    border: 1.5px solid var(--vscode-focusBorder);
    border-radius: 4px; padding: 2px 6px;
    font-size: 13px; font-weight: 600; outline: none; min-width: 0;
    font-family: var(--vscode-font-family);
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: var(--vscode-scrollbarSlider-background); border-radius: 2px; }
`;
}
