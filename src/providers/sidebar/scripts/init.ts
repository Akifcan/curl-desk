export function scriptInit(): string {
  return `
  // --- Resize Handle ---

  (function() {
    const handle = document.getElementById('qr-resize-handle');
    const respEl = document.getElementById('qr-response');
    let startY = 0, startH = 0, dragging = false;

    handle.addEventListener('mousedown', (e) => {
      dragging = true;
      startY = e.clientY;
      startH = respEl.offsetHeight;
      handle.classList.add('active');
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const delta = e.clientY - startY;
      const newH = Math.max(80, Math.min(startH + delta, window.innerHeight * 0.7));
      respEl.style.minHeight = newH + 'px';
      respEl.style.maxHeight = newH + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      handle.classList.remove('active');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    });
  })();

  // --- Message Listener ---

  window.addEventListener('message', (e) => {
    if (e.data.type === 'COLLECTIONS_LOADED') {
      collections = e.data.payload || [];
      render();
    } else if (e.data.type === 'HISTORY_LOADED') {
      history = e.data.payload || [];
      if (activeTab === 'history') render();
    } else if (e.data.type === 'ENVIRONMENTS_LOADED') {
      environments = e.data.payload.environments || [];
      activeEnvId = e.data.payload.activeEnvId || null;
      updateUrlHighlight();
    } else if (e.data.type === 'REQUEST_RESPONSE') {
      renderQrResponse('REQUEST_RESPONSE', e.data.payload);
    } else if (e.data.type === 'REQUEST_ERROR') {
      renderQrResponse('REQUEST_ERROR', e.data.payload);
    }
  });

  // --- Init ---

  document.getElementById('qr-method').style.color = METHOD_COLORS['GET'];
  renderQrTabContent();
  vscode.postMessage({ type: 'GET_COLLECTIONS' });
  vscode.postMessage({ type: 'GET_ENVIRONMENTS' });
`;
}
