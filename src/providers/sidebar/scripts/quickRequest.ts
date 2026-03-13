export function scriptQuickRequest(): string {
  return `
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
      const typeRow = \`
        <div class="body-type-row">
          \${['none', 'json', 'text', 'form'].map(t => \`
            <label class="radio-label">
              <input type="radio" name="qr-body-type" value="\${t}" \${qrState.bodyType === t ? 'checked' : ''}
                onchange="qrState.bodyType = this.value; renderQrTabContent()" />
              \${t === 'none' ? 'None' : t === 'json' ? 'JSON' : t === 'text' ? 'Text' : 'Form'}
            </label>
          \`).join('')}
        </div>
      \`;
      if (qrState.bodyType === 'none') {
        el.innerHTML = typeRow + '<div style="padding:8px 10px;font-size:11px;color:var(--vscode-descriptionForeground)">No body.</div>';
      } else if (qrState.bodyType === 'form') {
        el.innerHTML = typeRow + \`
          <div style="padding:2px 0;">
            \${qrState.formFields.map((f, i) => \`
              <div class="kv-row">
                <input type="checkbox" \${f.enabled ? 'checked' : ''} style="flex-shrink:0;width:13px;height:13px;accent-color:var(--vscode-focusBorder);"
                  onchange="qrFormField(\${i}, 'enabled', this.checked)" />
                <input class="kv-key" type="text" placeholder="key" value="\${escHtml(f.key)}"
                  oninput="qrFormField(\${i}, 'key', this.value)" />
                <select class="form-type-select" onchange="qrFormFieldType(\${i}, this.value)">
                  <option value="text" \${f.type === 'text' ? 'selected' : ''}>Text</option>
                  <option value="file" \${f.type === 'file' ? 'selected' : ''}>File</option>
                </select>
                \${f.type === 'text' ? \`
                  <input class="kv-val" type="text" placeholder="value" value="\${escHtml(f.value)}"
                    oninput="qrFormField(\${i}, 'value', this.value)" />
                \` : \`
                  <label class="file-pick-btn" onclick="document.getElementById('qrff-\${i}').click()">
                    <input type="file" id="qrff-\${i}" style="display:none" onchange="qrFormFile(\${i}, this)" />
                    📎 <span class="\${f.fileName ? '' : 'file-placeholder'}">\${f.fileName ? escHtml(f.fileName) : 'Choose file'}</span>
                  </label>
                \`}
                <button class="kv-del" onclick="qrFormRemove(\${i})">✕</button>
              </div>
            \`).join('')}
          </div>
        \`;
      } else {
        el.innerHTML = typeRow + \`
          <textarea class="body-editor"
            placeholder="\${qrState.bodyType === 'json' ? '{\\n  &quot;key&quot;: &quot;value&quot;\\n}' : 'Request body...'}"
            oninput="qrState.body = this.value">\${escHtml(qrState.body)}</textarea>
        \`;
      }
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

  function qrFormField(index, field, value) {
    qrState.formFields[index][field] = value;
    const last = qrState.formFields[qrState.formFields.length - 1];
    if (last.key || last.value || last.fileName) {
      qrState.formFields.push({ key: '', value: '', type: 'text', enabled: true, fileName: '', fileData: '' });
      renderQrTabContent();
    }
  }

  function qrFormFieldType(index, type) {
    qrState.formFields[index].type = type;
    qrState.formFields[index].value = '';
    qrState.formFields[index].fileName = '';
    qrState.formFields[index].fileData = '';
    renderQrTabContent();
  }

  function qrFormRemove(index) {
    qrState.formFields.splice(index, 1);
    if (qrState.formFields.length === 0) {
      qrState.formFields.push({ key: '', value: '', type: 'text', enabled: true, fileName: '', fileData: '' });
    }
    renderQrTabContent();
  }

  function qrFormFile(index, input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      qrState.formFields[index].fileName = file.name;
      qrState.formFields[index].fileData = e.target.result;
      qrState.formFields[index].fileMimeType = file.type || 'application/octet-stream';
      const last = qrState.formFields[qrState.formFields.length - 1];
      if (last.key || last.value || last.fileName) {
        qrState.formFields.push({ key: '', value: '', type: 'text', enabled: true, fileName: '', fileData: '' });
      }
      renderQrTabContent();
    };
    reader.readAsDataURL(file);
  }
`;
}
