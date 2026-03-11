export interface ParsedApiCall {
  method: string;
  url: string;
  body?: string;
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
 * - Unquoted keys        → "key":
 * - Variable references  → "{{varName}}"
 * - Single-quoted strings → double-quoted
 * - Template literals    → "string with {{interpolations}}"
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

/**
 * Tries to extract method, url, and body from a selected JS/TS API call.
 * Supports:
 *   - anyVar.(get|post|put|delete|patch)('url', { body })
 *   - fetch('url', { method: '...', body: JSON.stringify({ ... }) })
 */
export function parseApiCall(text: string): ParsedApiCall | null {
  const t = text.trim();

  // ── Pattern 1: [anything].(method)('url', bodyObject?) ───────────────────
  const axiosRe = /\.(get|post|put|delete|patch|head|options)\s*\(\s*(`([^`]*)`|'([^']*)'|"([^"]*)")/i;
  const axiosMatch = t.match(axiosRe);
  if (axiosMatch) {
    const method = axiosMatch[1].toUpperCase();
    const rawUrl = axiosMatch[3] ?? axiosMatch[4] ?? axiosMatch[5] ?? '';
    const url = rawUrl.replace(/\$\{([^}]+)\}/g, '{{$1}}');

    let body: string | undefined;
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      const matchEnd = t.indexOf(axiosMatch[0]) + axiosMatch[0].length;
      const rest = t.slice(matchEnd);
      const commaIdx = rest.indexOf(',');
      if (commaIdx !== -1) {
        const candidate = rest.slice(commaIdx + 1).trimStart();
        if (candidate.startsWith('{')) {
          const raw = findBalanced(candidate, '{', '}');
          if (raw) body = jsObjectToTemplate(raw);
        }
      }
    }

    return { method, url, body };
  }

  // ── Pattern 2: fetch('url', { method, body: JSON.stringify({...}) }) ─────
  const fetchRe = /\bfetch\s*\(\s*(`([^`]*)`|'([^']*)'|"([^"]*)")/i;
  const fetchMatch = t.match(fetchRe);
  if (fetchMatch) {
    const rawUrl = fetchMatch[2] ?? fetchMatch[3] ?? fetchMatch[4] ?? '';
    const url = rawUrl.replace(/\$\{([^}]+)\}/g, '{{$1}}');

    let method = 'GET';
    let body: string | undefined;

    const matchEnd = t.indexOf(fetchMatch[0]) + fetchMatch[0].length;
    const rest = t.slice(matchEnd);
    const commaIdx = rest.indexOf(',');
    if (commaIdx !== -1) {
      const optsRaw = rest.slice(commaIdx + 1).trimStart();
      if (optsRaw.startsWith('{')) {
        const optsObj = findBalanced(optsRaw, '{', '}');

        const methodMatch = optsObj.match(/\bmethod\s*:\s*['"`]([^'"`]+)['"`]/i);
        if (methodMatch) method = methodMatch[1].toUpperCase();

        const stringifyMatch = optsObj.match(/\bbody\s*:\s*JSON\.stringify\s*\(/i);
        if (stringifyMatch) {
          const parenStart = optsObj.indexOf(stringifyMatch[0]) + stringifyMatch[0].length - 1;
          const inner = findBalanced(optsObj.slice(parenStart), '(', ')');
          const objStr = inner.slice(1, -1).trimStart();
          if (objStr.startsWith('{')) {
            const raw = findBalanced(objStr, '{', '}');
            if (raw) body = jsObjectToTemplate(raw);
          }
        }
      }
    }

    return { method, url, body };
  }

  return null;
}
