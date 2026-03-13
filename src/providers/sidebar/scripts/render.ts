export function scriptRender(): string {
  return `
  function render() {
    const el = document.getElementById('list-content');

    if (activeTab === 'history') {
      if (history.length === 0) {
        el.innerHTML = '<div class="empty">No history yet.<br>Send a request to see it here.</div>';
        return;
      }
      const filtered = searchQuery
        ? history.filter(r => r.url?.toLowerCase().includes(searchQuery) || r.method?.toLowerCase().includes(searchQuery))
        : history;

      el.innerHTML = filtered.map(r => \`
        <div class="history-item">
          <span class="method" style="color:\${METHOD_COLORS[r.method] || '#abb2bf'}">\${r.method}</span>
          <div class="history-info">
            <div class="history-url">\${escHtml(r.url || '')}</div>
          </div>
          <button class="icon-btn" onclick="event.stopPropagation(); deleteHistoryItem('\${r.id}')" title="Delete">✕</button>
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
            <span id="col-actions-\${col.id}"><button class="icon-btn" onclick="event.stopPropagation(); showDeleteConfirm('\${col.id}')" title="Delete">✕</button></span>
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
`;
}
