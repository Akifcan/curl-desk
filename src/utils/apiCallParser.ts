export interface ParsedApiCall {
  method: string;
  url: string;
  body?: string;
  headers?: Record<string, string>;
}

/**
 * Finds the first balanced-bracket substring starting from the first
 * occurrence of `openCh` in `text`, skipping over string literals.
 */
function findBalanced(text: string, openCh: string, closeCh: string): string {
  let depth = 0;
  let start = -1;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      i++;
      while (i < text.length && text[i] !== ch) {
        if (text[i] === '\\') i++;
        i++;
      }
    } else if (ch === openCh) {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === closeCh) {
      depth--;
      if (depth === 0 && start !== -1) return text.slice(start, i + 1);
    }
    i++;
  }
  return '';
}

/**
 * Converts a JS object literal to a JSON-like template string.
 */
function jsObjectToTemplate(js: string): string {
  return js
    .replace(/([{,]\s*\n?\s*)(\w+)\s*:/g, (_, pre, key) => `${pre}"${key}":`)
    .replace(/:\s*'([^']*)'/g, ': "$1"')
    .replace(/`([^`]*)`/g, (_, body) =>
      `"${body.replace(/\$\{([^}]+)\}/g, '{{$1}}')}"`)
    .replace(/:\s*([A-Za-z_$][A-Za-z0-9_$.]*)(\s*[,\n\r}])/g, (m, name, tail) =>
      ['true', 'false', 'null'].includes(name) ? m : `: "{{${name}}}"${tail}`);
}

/** Extract key-value pairs from a JS object literal string like { 'Key': 'Val', Key2: val2 } */
function extractHeaders(objStr: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const re = /['"]?([\w-]+)['"]?\s*:\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`|([A-Za-z_$][\w.]*))/g;
  let m;
  while ((m = re.exec(objStr)) !== null) {
    const key = m[1];
    const val = m[2] ?? m[3] ?? m[4] ?? `{{${m[5]}}}`;
    headers[key] = val;
  }
  return headers;
}

/** Skip over TypeScript generic type params like <Record<string, string>> */
function skipGenerics(text: string): string {
  if (!text.startsWith('<')) return text;
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '<') depth++;
    else if (text[i] === '>') { depth--; if (depth === 0) return text.slice(i + 1); }
  }
  return text;
}

/** Extract a string value (single, double, or backtick quoted) from beginning of text */
function extractString(text: string): { value: string; rest: string } | null {
  const trimmed = text.trimStart();
  const quote = trimmed[0];
  if (quote !== '"' && quote !== "'" && quote !== '`') return null;
  let i = 1;
  while (i < trimmed.length && trimmed[i] !== quote) {
    if (trimmed[i] === '\\') i++;
    i++;
  }
  const raw = trimmed.slice(1, i);
  const value = raw.replace(/\$\{([^}]+)\}/g, '{{$1}}');
  return { value, rest: trimmed.slice(i + 1) };
}

/** Split comma-separated args at top level (respecting brackets/strings) */
function splitArgs(text: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      current += ch; i++;
      while (i < text.length && text[i] !== ch) {
        if (text[i] === '\\') { current += text[i]; i++; }
        current += text[i]; i++;
      }
      if (i < text.length) current += text[i];
    } else if ('({[<'.includes(ch)) { depth++; current += ch; }
    else if (')}]>'.includes(ch)) { depth--; current += ch; }
    else if (ch === ',' && depth === 0) { args.push(current.trim()); current = ''; }
    else { current += ch; }
  }
  if (current.trim()) args.push(current.trim());
  return args;
}

/**
 * Parse API calls from selected code text.
 * Supports:
 *   - axios/instance: api.post<Type>('/url', body, { headers })
 *   - fetch('url', { method, headers, body })
 *   - $.ajax({ url, method, headers, data })
 *   - XMLHttpRequest patterns
 *   - curl commands
 */
export function parseApiCall(text: string): ParsedApiCall | null {
  const t = text.trim();

  return parseAxiosStyle(t)
    ?? parseFetchStyle(t)
    ?? parseJQueryAjax(t)
    ?? parseXHR(t)
    ?? parseCurl(t);
}

// ── axios / custom instance: .get|post|put|delete|patch<Generic>('url', body?, config?) ──
function parseAxiosStyle(t: string): ParsedApiCall | null {
  const re = /\.(get|post|put|delete|patch|head|options)\s*(<|[\s(])/i;
  const match = t.match(re);
  if (!match) return null;

  const method = match[1].toUpperCase();
  const afterMethod = t.slice(t.indexOf(match[0]) + match[0].length - 1);

  // skip generics if present
  let rest = afterMethod;
  if (rest.trimStart().startsWith('<')) {
    rest = skipGenerics(rest.trimStart());
  }

  // now expect (
  rest = rest.trimStart();
  if (!rest.startsWith('(')) return null;

  const argsRaw = findBalanced(rest, '(', ')');
  if (!argsRaw) return null;

  const inner = argsRaw.slice(1, -1);
  const args = splitArgs(inner);

  // arg[0] = url
  const urlParsed = extractString(args[0] ?? '');
  if (!urlParsed) return null;
  const url = urlParsed.value;

  let body: string | undefined;
  let headers: Record<string, string> | undefined;

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    // arg[1] = body (object or variable)
    if (args[1]) {
      const bodyTrimmed = args[1].trimStart();
      if (bodyTrimmed.startsWith('{')) {
        const raw = findBalanced(bodyTrimmed, '{', '}');
        if (raw) body = jsObjectToTemplate(raw);
      }
    }
    // arg[2] = config with headers
    if (args[2]) {
      headers = extractHeadersFromConfig(args[2].trimStart());
    }
  } else {
    // GET/HEAD/OPTIONS: arg[1] = config
    if (args[1]) {
      headers = extractHeadersFromConfig(args[1].trimStart());
    }
  }

  return { method, url, body, headers };
}

/** Extract headers from an axios config object like { headers: { ... }, ... } */
function extractHeadersFromConfig(configStr: string): Record<string, string> | undefined {
  if (!configStr.startsWith('{')) return undefined;
  const obj = findBalanced(configStr, '{', '}');
  if (!obj) return undefined;

  const headersMatch = obj.match(/\bheaders\s*:\s*\{/);
  if (!headersMatch) {
    // check for Authorization at top level
    const authMatch = obj.match(/\bAuthorization\s*:\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`)/);
    if (authMatch) {
      return { Authorization: authMatch[1] ?? authMatch[2] ?? authMatch[3] ?? '' };
    }
    return undefined;
  }

  const start = obj.indexOf(headersMatch[0]) + headersMatch[0].length - 1;
  const headersObj = findBalanced(obj.slice(start), '{', '}');
  if (!headersObj) return undefined;
  return extractHeaders(headersObj);
}

// ── fetch('url', { method, headers, body }) ──
function parseFetchStyle(t: string): ParsedApiCall | null {
  const fetchRe = /\bfetch\s*\(\s*(`([^`]*)`|'([^']*)'|"([^"]*)")/i;
  const fetchMatch = t.match(fetchRe);
  if (!fetchMatch) return null;

  const rawUrl = fetchMatch[2] ?? fetchMatch[3] ?? fetchMatch[4] ?? '';
  const url = rawUrl.replace(/\$\{([^}]+)\}/g, '{{$1}}');

  let method = 'GET';
  let body: string | undefined;
  let headers: Record<string, string> | undefined;

  const matchEnd = t.indexOf(fetchMatch[0]) + fetchMatch[0].length;
  const rest = t.slice(matchEnd);
  const commaIdx = rest.indexOf(',');
  if (commaIdx !== -1) {
    const optsRaw = rest.slice(commaIdx + 1).trimStart();
    if (optsRaw.startsWith('{')) {
      const optsObj = findBalanced(optsRaw, '{', '}');

      // method
      const methodMatch = optsObj.match(/\bmethod\s*:\s*['"`]([^'"`]+)['"`]/i);
      if (methodMatch) method = methodMatch[1].toUpperCase();

      // headers
      const headersMatch = optsObj.match(/\bheaders\s*:\s*\{/);
      if (headersMatch) {
        const hStart = optsObj.indexOf(headersMatch[0]) + headersMatch[0].length - 1;
        const headersObj = findBalanced(optsObj.slice(hStart), '{', '}');
        if (headersObj) headers = extractHeaders(headersObj);
      }

      // body: JSON.stringify({...})
      const stringifyMatch = optsObj.match(/\bbody\s*:\s*JSON\.stringify\s*\(/i);
      if (stringifyMatch) {
        const parenStart = optsObj.indexOf(stringifyMatch[0]) + stringifyMatch[0].length - 1;
        const inner = findBalanced(optsObj.slice(parenStart), '(', ')');
        const objStr = inner.slice(1, -1).trimStart();
        if (objStr.startsWith('{')) {
          const raw = findBalanced(objStr, '{', '}');
          if (raw) body = jsObjectToTemplate(raw);
        }
      } else {
        // body: '...' or body: `...` or body: "{...}"
        const bodyStrMatch = optsObj.match(/\bbody\s*:\s*(['"`])/);
        if (bodyStrMatch) {
          const bStart = optsObj.indexOf(bodyStrMatch[0]) + bodyStrMatch[0].length - 1;
          const parsed = extractString(optsObj.slice(bStart));
          if (parsed) body = parsed.value;
        }
      }
    }
  }

  return { method, url, body, headers };
}

// ── $.ajax({ url, method/type, headers, data }) ──
function parseJQueryAjax(t: string): ParsedApiCall | null {
  const ajaxRe = /\$\.ajax\s*\(\s*\{/i;
  if (!ajaxRe.test(t)) return null;

  const start = t.search(ajaxRe);
  const objStart = t.indexOf('{', start);
  const obj = findBalanced(t.slice(objStart), '{', '}');
  if (!obj) return null;

  // url
  const urlMatch = obj.match(/\burl\s*:\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`)/);
  if (!urlMatch) return null;
  const rawUrl = urlMatch[1] ?? urlMatch[2] ?? urlMatch[3] ?? '';
  const url = rawUrl.replace(/\$\{([^}]+)\}/g, '{{$1}}');

  // method (jQuery uses both "method" and "type")
  let method = 'GET';
  const methodMatch = obj.match(/\b(?:method|type)\s*:\s*['"`]([^'"`]+)['"`]/i);
  if (methodMatch) method = methodMatch[1].toUpperCase();

  // headers
  let headers: Record<string, string> | undefined;
  const headersMatch = obj.match(/\bheaders\s*:\s*\{/);
  if (headersMatch) {
    const hStart = obj.indexOf(headersMatch[0]) + headersMatch[0].length - 1;
    const headersObj = findBalanced(obj.slice(hStart), '{', '}');
    if (headersObj) headers = extractHeaders(headersObj);
  }

  // data/body
  let body: string | undefined;
  const dataMatch = obj.match(/\bdata\s*:\s*\{/);
  if (dataMatch) {
    const dStart = obj.indexOf(dataMatch[0]) + dataMatch[0].length - 1;
    const dataObj = findBalanced(obj.slice(dStart), '{', '}');
    if (dataObj) body = jsObjectToTemplate(dataObj);
  }

  return { method, url, body, headers };
}

// ── XMLHttpRequest ──
function parseXHR(t: string): ParsedApiCall | null {
  const openRe = /\.open\s*\(\s*['"`](GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)['"`]\s*,\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`)/i;
  const openMatch = t.match(openRe);
  if (!openMatch) return null;

  const method = openMatch[1].toUpperCase();
  const rawUrl = openMatch[2] ?? openMatch[3] ?? openMatch[4] ?? '';
  const url = rawUrl.replace(/\$\{([^}]+)\}/g, '{{$1}}');

  // headers: setRequestHeader('key', 'val')
  const headers: Record<string, string> = {};
  const headerRe = /\.setRequestHeader\s*\(\s*['"`]([\w-]+)['"`]\s*,\s*(?:'([^']*)'|"([^"]*)"|`([^`]*)`|([A-Za-z_$][\w.]*))/g;
  let hm;
  while ((hm = headerRe.exec(t)) !== null) {
    headers[hm[1]] = hm[2] ?? hm[3] ?? hm[4] ?? `{{${hm[5]}}}`;
  }

  // body: .send(...)
  let body: string | undefined;
  const sendMatch = t.match(/\.send\s*\(\s*(?:JSON\.stringify\s*\()?/);
  if (sendMatch) {
    const after = t.slice(t.indexOf(sendMatch[0]) + sendMatch[0].length).trimStart();
    if (after.startsWith('{')) {
      const raw = findBalanced(after, '{', '}');
      if (raw) body = jsObjectToTemplate(raw);
    } else {
      const parsed = extractString(after);
      if (parsed && parsed.value) body = parsed.value;
    }
  }

  return { method, url, body, headers: Object.keys(headers).length ? headers : undefined };
}

// ── curl command ──
function parseCurl(t: string): ParsedApiCall | null {
  if (!/^\s*curl\s/i.test(t)) return null;

  let method = 'GET';
  let url = '';
  let body: string | undefined;
  const headers: Record<string, string> = {};

  // normalize line continuations
  const normalized = t.replace(/\\\s*\n/g, ' ');
  const tokens = tokenizeCurl(normalized);

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok === '-X' || tok === '--request') {
      method = (tokens[++i] ?? 'GET').toUpperCase();
    } else if (tok === '-H' || tok === '--header') {
      const header = tokens[++i] ?? '';
      const colonIdx = header.indexOf(':');
      if (colonIdx > 0) {
        headers[header.slice(0, colonIdx).trim()] = header.slice(colonIdx + 1).trim();
      }
    } else if (tok === '-d' || tok === '--data' || tok === '--data-raw') {
      body = tokens[++i] ?? '';
      if (method === 'GET') method = 'POST';
    } else if (tok === '-u' || tok === '--user') {
      const cred = tokens[++i] ?? '';
      headers['Authorization'] = `Basic ${Buffer.from(cred).toString('base64')}`;
    } else if (!tok.startsWith('-') && tok !== 'curl') {
      url = tok;
    }
  }

  if (!url) return null;
  return { method, url, body, headers: Object.keys(headers).length ? headers : undefined };
}

/** Simple tokenizer for curl commands that handles quoted strings */
function tokenizeCurl(cmd: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < cmd.length) {
    while (i < cmd.length && ' \t'.includes(cmd[i])) i++;
    if (i >= cmd.length) break;
    if (cmd[i] === '"' || cmd[i] === "'") {
      const q = cmd[i]; i++;
      let tok = '';
      while (i < cmd.length && cmd[i] !== q) {
        if (cmd[i] === '\\' && q === '"') { i++; tok += cmd[i] ?? ''; }
        else tok += cmd[i];
        i++;
      }
      i++;
      tokens.push(tok);
    } else {
      let tok = '';
      while (i < cmd.length && !' \t'.includes(cmd[i])) { tok += cmd[i]; i++; }
      tokens.push(tok);
    }
  }
  return tokens;
}
