export function scriptEnvHelpers(): string {
  return `
  function getActiveEnv() {
    if (!activeEnvId) return null;
    return environments.find(e => e.id === activeEnvId) || null;
  }

  function replaceVars(str) {
    const env = getActiveEnv();
    if (!env) return str;
    return str.replace(/\\{\\{([^}]+)\\}\\}/g, (_, key) => {
      const v = env.variables.find(v => v.key === key.trim());
      return v ? v.value : '{{' + key + '}}';
    });
  }

  function updateUrlHighlight() {
    const mirror = document.getElementById('qr-url-mirror');
    const env = getActiveEnv();
    const url = qrState.url;
    if (!env || !url.includes('{{')) {
      mirror.innerHTML = '';
      return;
    }
    mirror.innerHTML = url.split(/(\\{\\{[^}]*\\}\\})/).map(part => {
      if (/^\\{\\{[^}]*\\}\\}$/.test(part)) {
        const key = part.slice(2, -2).trim();
        const defined = env.variables.some(v => v.key === key);
        return '<span class="' + (defined ? 'var-defined' : 'var-undefined') + '">' + escHtml(part) + '</span>';
      }
      return escHtml(part);
    }).join('');
  }
`;
}
