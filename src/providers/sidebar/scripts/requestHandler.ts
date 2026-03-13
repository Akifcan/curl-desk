export function scriptRequestHandler(): string {
  return `
  function highlightJsonStr(json) {
    var escaped = escHtml(json);
    return escaped.replace(
      /("(\\\\u[a-fA-F0-9]{4}|\\\\[^u]|[^\\\\\\"])*"(\\s*:)?|true|false|null|-?\\d+(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)/g,
      function(m) {
        var c = 'syn-num';
        if (/^"/.test(m)) { c = /:$/.test(m) ? 'syn-key' : 'syn-str'; }
        else if (/^(true|false)$/.test(m)) { c = 'syn-bool'; }
        else if (m === 'null') { c = 'syn-null'; }
        return '<span class="' + c + '">' + m + '</span>';
      }
    );
  }

  function formatBodyText(body) {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch (e) {
      return body;
    }
  }

  function renderCodeWithLines(html) {
    var lines = html.split('\\n');
    var gutter = lines.map(function(_, i) {
      return '<span class="sb-line-num">' + (i + 1) + '</span>';
    }).join('');
    return '<div class="sb-editor">' +
      '<div class="sb-gutter">' + gutter + '</div>' +
      '<pre class="sb-code"><code>' + html + '</code></pre>' +
    '</div>';
  }

  function sendQuickRequest() {
    if (!qrState.url.trim() || qrState.isLoading) return;
    qrState.isLoading = true;
    const sendBtn = document.getElementById('qr-send-btn');
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span class="spinner"></span>';

    const hdrs = {};
    qrState.headers.filter(h => h.key.trim()).forEach(h => { hdrs[replaceVars(h.key)] = replaceVars(h.value); });
    if (qrState.authType === 'bearer' && qrState.authToken) {
      hdrs['Authorization'] = 'Bearer ' + qrState.authToken;
    } else if (qrState.authType === 'basic') {
      hdrs['Authorization'] = 'Basic ' + btoa(qrState.authUser + ':' + qrState.authPass);
    }
    if (qrState.bodyType === 'json') hdrs['Content-Type'] = 'application/json';

    const isForm = qrState.bodyType === 'form';
    const formFields = isForm
      ? qrState.formFields.filter(f => f.enabled && f.key.trim()).map(f => ({
          key: f.key, value: f.value, type: f.type,
          fileName: f.fileName, fileData: f.fileData, fileMimeType: f.fileMimeType
        }))
      : undefined;

    vscode.postMessage({
      type: 'SEND_REQUEST',
      payload: {
        method: qrState.method,
        url: replaceVars(qrState.url),
        headers: hdrs,
        body: !isForm && qrState.bodyType !== 'none' ? replaceVars(qrState.body) : undefined,
        formFields,
        params: {},
      }
    });
  }

  function renderQrResponse(type, payload) {
    const el = document.getElementById('qr-response');
    const sendBtn = document.getElementById('qr-send-btn');
    sendBtn.disabled = false;
    sendBtn.innerHTML = '&#9654;';
    qrState.isLoading = false;

    if (type === 'REQUEST_ERROR') {
      el.innerHTML = \`<div class="qr-resp-error">\${escHtml(payload.message)}</div>\`;
      return;
    }
    const statusColor = payload.status < 300 ? '#98c379' : payload.status < 400 ? '#e5c07b' : '#e06c75';
    const formatted = formatBodyText(payload.body);
    const highlighted = highlightJsonStr(formatted);

    el.innerHTML = \`
      <div class="qr-resp-bar">
        <span class="qr-resp-status" style="color:\${statusColor}">\${payload.status} \${escHtml(payload.statusText)}</span>
        <span class="qr-resp-meta">\${payload.time}ms</span>
        <span class="qr-resp-meta">\${(payload.size / 1024).toFixed(1)}KB</span>
      </div>
    \` + renderCodeWithLines(highlighted);
  }
`;
}
