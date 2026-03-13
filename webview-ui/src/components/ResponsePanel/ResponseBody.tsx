type ViewMode = 'pretty' | 'raw';

interface ResponseBodyProps {
  body: string;
  viewMode: ViewMode;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightJson(json: string): string {
  const escaped = escapeHtml(json);
  return escaped.replace(
    /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = 'syn-num';
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'syn-key' : 'syn-str';
      } else if (/^(true|false)$/.test(match)) {
        cls = 'syn-bool';
      } else if (match === 'null') {
        cls = 'syn-null';
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

function highlightXml(text: string): string {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/(&lt;\/?)([\w:-]+)/g, '$1<span class="syn-tag">$2</span>')
    .replace(/([\w:-]+)(=)(&quot;[^&]*&quot;)/g, '<span class="syn-attr">$1</span>$2<span class="syn-str">$3</span>');
}

function detectAndHighlight(body: string, mode: ViewMode): string {
  if (mode === 'raw') return escapeHtml(body);

  // Try JSON
  try {
    const formatted = JSON.stringify(JSON.parse(body), null, 2);
    return highlightJson(formatted);
  } catch { /* not JSON */ }

  // Try HTML/XML
  if (/^\s*</.test(body)) {
    return highlightXml(body);
  }

  return escapeHtml(body);
}

export function ResponseBody({ body, viewMode }: ResponseBodyProps) {
  const highlighted = detectAndHighlight(body, viewMode);
  const lines = highlighted.split('\n');

  return (
    <div className="response-body-editor">
      <div className="line-gutter" aria-hidden>
        {lines.map((_, i) => (
          <span key={i} className="line-num">{i + 1}</span>
        ))}
      </div>
      <pre className="response-body">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}
