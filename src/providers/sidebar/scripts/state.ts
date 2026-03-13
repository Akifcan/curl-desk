export function scriptState(): string {
  return `
  const vscode = acquireVsCodeApi();
  let collections = [];
  let history = [];
  let environments = [];
  let activeEnvId = null;
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
    formFields: [{ key: '', value: '', type: 'text', enabled: true, fileName: '', fileData: '' }],
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
`;
}
