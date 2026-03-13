import { useState, useEffect } from 'react';

type ViewMode = 'pretty' | 'raw';

interface ResponseBodyProps {
  body: string;
  viewMode: ViewMode;
  contentType: string;
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

  try {
    const formatted = JSON.stringify(JSON.parse(body), null, 2);
    return highlightJson(formatted);
  } catch { /* not JSON */ }

  if (/^\s*</.test(body)) {
    return highlightXml(body);
  }

  return escapeHtml(body);
}

function getMediaType(contentType: string): 'image' | 'video' | 'audio' | 'pdf' | null {
  if (/^image\//.test(contentType)) return 'image';
  if (/^video\//.test(contentType)) return 'video';
  if (/^audio\//.test(contentType)) return 'audio';
  if (/application\/pdf/.test(contentType)) return 'pdf';
  return null;
}

function dataUriToBlob(dataUri: string): Blob {
  const parts = dataUri.split(',');
  const mime = parts[0].split(':')[1].split(';')[0];
  const raw = atob(parts[1]);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function PdfViewer({ dataUri }: { dataUri: string }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    const blob = dataUriToBlob(dataUri);
    const blobUrl = URL.createObjectURL(blob);
    setUrl(blobUrl);
    return () => URL.revokeObjectURL(blobUrl);
  }, [dataUri]);

  if (!url) return null;
  return (
    <div className="response-media">
      <iframe src={url} className="response-pdf" title="PDF Response" />
    </div>
  );
}

function CodeView({ highlighted }: { highlighted: string }) {
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

export function ResponseBody({ body, viewMode, contentType }: ResponseBodyProps) {
  const mediaType = getMediaType(contentType);

  if (mediaType === 'image') {
    return (
      <div className="response-media">
        <img src={body} alt="Response" className="response-image" />
      </div>
    );
  }

  if (mediaType === 'video') {
    return (
      <div className="response-media">
        <video src={body} controls className="response-video" />
      </div>
    );
  }

  if (mediaType === 'audio') {
    return (
      <div className="response-media">
        <audio src={body} controls className="response-audio" />
      </div>
    );
  }

  if (mediaType === 'pdf') {
    return <PdfViewer dataUri={body} />;
  }

  const highlighted = detectAndHighlight(body, viewMode);
  return <CodeView highlighted={highlighted} />;
}
