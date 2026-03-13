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
    el.innerHTML = '<button class="icon-btn" onclick="event.stopPropagation(); showDeleteConfirm(\\'' + id + '\\')" title="Delete">✕</button>';
  }

  function deleteHistoryItem(id) {
    vscode.postMessage({ type: 'DELETE_HISTORY_ITEM', payload: id });
  }

  function deleteRequest(collectionId, requestId) {
    vscode.postMessage({ type: 'DELETE_REQUEST', payload: { collectionId, requestId } });
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
