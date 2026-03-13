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

  function openBinaryInVscode(dataUri, ext) {
    vscode.postMessage({ type: 'OPEN_BINARY_RESPONSE', payload: { dataUri: dataUri, fileName: 'response.' + ext } });
  }

  function renderMediaBody(contentType, body) {
    if (/^image\\//.test(contentType)) {
      return '<div class="sb-media"><img src="' + body + '" alt="Response" class="sb-media-img" /></div>';
    }
    if (/^video\\//.test(contentType)) {
      return '<div class="sb-media"><video src="' + body + '" controls class="sb-media-video"></video></div>';
    }
    if (/^audio\\//.test(contentType)) {
      return '<div class="sb-media"><audio src="' + body + '" controls class="sb-media-audio"></audio></div>';
    }
    if (/application\\/pdf/.test(contentType)) {
      var sizeKb = Math.round((body.length * 3) / 4 / 1024);
      return '<div class="sb-media sb-binary">' +
        '<div style="font-size:36px">📄</div>' +
        '<div style="font-size:12px;font-weight:600;color:var(--vscode-foreground)">application/pdf</div>' +
        '<div style="font-size:11px;color:var(--vscode-descriptionForeground)">~' + sizeKb + ' KB</div>' +
        '<button class="sb-open-btn" onclick="openBinaryInVscode(lastResponseBody, \\'pdf\\')">Open in VS Code</button>' +
      '</div>';
    }
    return null;
  }

  var lastResponseBody = '';
  var lastResponseHtml = false;
  var lastStatusBar = '';
  var lastHighlighted = '';

  function isHtmlBody(body, ct) {
    if (/text\\/html/i.test(ct)) return true;
    return /^\\s*<!doctype\\s+html/i.test(body) || /^\\s*<html/i.test(body);
  }

  function toggleHtmlPreview() {
    lastResponseHtml = !lastResponseHtml;
    const el = document.getElementById('qr-response');
    if (lastResponseHtml) {
      el.innerHTML = lastStatusBar +
        '<div class="qr-resp-bar"><button class="sb-html-toggle active" onclick="toggleHtmlPreview()">Source</button></div>' +
        '<iframe class="sb-html-frame" sandbox="allow-same-origin" srcdoc="' + escHtml(lastResponseBody) + '"></iframe>';
    } else {
      el.innerHTML = lastStatusBar +
        '<div class="qr-resp-bar"><button class="sb-html-toggle" onclick="toggleHtmlPreview()">Preview</button></div>' +
        renderCodeWithLines(lastHighlighted);
    }
  }

  function renderQrResponse(type, payload) {
    const el = document.getElementById('qr-response');
    const sendBtn = document.getElementById('qr-send-btn');
    sendBtn.disabled = false;
    sendBtn.innerHTML = '&#9654;';
    qrState.isLoading = false;
    lastResponseBody = payload.body || '';
    lastResponseHtml = false;

    if (type === 'REQUEST_ERROR') {
      el.innerHTML = \`<div class="qr-resp-error">\${escHtml(payload.message)}</div>\`;
      return;
    }
    const statusColor = payload.status < 300 ? '#98c379' : payload.status < 400 ? '#e5c07b' : '#e06c75';
    lastStatusBar = \`
      <div class="qr-resp-bar">
        <span class="qr-resp-status" style="color:\${statusColor}">\${payload.status} \${escHtml(payload.statusText)}</span>
        <span class="qr-resp-meta">\${payload.time}ms</span>
        <span class="qr-resp-meta">\${(payload.size / 1024).toFixed(1)}KB</span>
      </div>
    \`;

    const ct = payload.contentType || '';
    const media = renderMediaBody(ct, payload.body);
    if (media) {
      el.innerHTML = lastStatusBar + media;
      return;
    }

    const formatted = formatBodyText(payload.body);
    lastHighlighted = highlightJsonStr(formatted);

    var htmlToggle = '';
    if (isHtmlBody(payload.body, ct)) {
      htmlToggle = '<div class="qr-resp-bar"><button class="sb-html-toggle" onclick="toggleHtmlPreview()">Preview</button></div>';
    }

    el.innerHTML = lastStatusBar + htmlToggle + renderCodeWithLines(lastHighlighted);
  }
`;
}
