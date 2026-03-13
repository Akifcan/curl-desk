export function scriptNavigation(): string {
  return `
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

  function showDeleteConfirm(id) {
    const el = document.getElementById('col-actions-' + id);
    if (!el) return;
    el.innerHTML = '<span style="font-size:11px;color:#e06c75;font-weight:600;margin-right:2px;">Delete?</span>' +
      '<button class="icon-btn" style="opacity:1;color:#e06c75;" onclick="event.stopPropagation(); deleteCollection(\\'' + id + '\\')" title="Confirm">✓</button>' +
      '<button class="icon-btn" style="opacity:1;" onclick="event.stopPropagation(); cancelDeleteConfirm(\\'' + id + '\\')" title="Cancel">✕</button>';
  }

  function cancelDeleteConfirm(id) {
    const el = document.getElementById('col-actions-' + id);
    if (!el) return;
    el.innerHTML = colActionsHtml(id);
  }

  function colActionsHtml(id) {
    return '<button class="icon-btn" onclick="event.stopPropagation(); startRenameCollection(\\'' + id + '\\')" title="Rename">✎</button>' +
      '<button class="icon-btn" onclick="event.stopPropagation(); showDeleteConfirm(\\'' + id + '\\')" title="Delete">✕</button>';
  }

  function startRenameCollection(id) {
    const col = collections.find(c => c.id === id);
    if (!col) return;
    const nameEl = document.getElementById('col-name-' + id);
    if (!nameEl) return;
    const oldName = col.name;
    nameEl.innerHTML = '<input class="col-rename-input" type="text" value="' + escHtml(oldName) + '" onclick="event.stopPropagation()" />';
    const input = nameEl.querySelector('input');
    input.focus();
    input.select();
    const commit = () => {
      const val = input.value.trim();
      if (val && val !== oldName) {
        vscode.postMessage({ type: 'RENAME_COLLECTION', payload: { id, name: val } });
      } else {
        nameEl.textContent = oldName;
      }
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { nameEl.textContent = oldName; }
    });
    input.addEventListener('blur', commit);
  }

  function deleteHistoryItem(id) {
    vscode.postMessage({ type: 'DELETE_HISTORY_ITEM', payload: id });
  }

  function deleteRequest(collectionId, requestId) {
    vscode.postMessage({ type: 'DELETE_REQUEST', payload: { collectionId, requestId } });
  }

  function startRenameRequest(collectionId, requestId) {
    const col = collections.find(c => c.id === collectionId);
    if (!col) return;
    const req = col.requests.find(r => r.id === requestId);
    if (!req) return;
    const nameEl = document.getElementById('req-name-' + requestId);
    if (!nameEl) return;
    const oldName = req.name || req.url || 'Untitled';
    nameEl.innerHTML = '<input class="col-rename-input" type="text" value="' + escHtml(req.name || '') + '" placeholder="Request name" onclick="event.stopPropagation()" />';
    const input = nameEl.querySelector('input');
    input.focus();
    input.select();
    const commit = () => {
      const val = input.value.trim();
      if (val && val !== req.name) {
        vscode.postMessage({ type: 'RENAME_REQUEST', payload: { collectionId, requestId, name: val } });
      } else {
        nameEl.textContent = oldName;
      }
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { nameEl.textContent = oldName; }
    });
    input.addEventListener('blur', commit);
  }

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
`;
}
