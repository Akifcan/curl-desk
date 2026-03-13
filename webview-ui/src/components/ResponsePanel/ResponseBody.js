import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { vscode } from '../../vscode';
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
function highlightJson(json) {
    const escaped = escapeHtml(json);
    return escaped.replace(/("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match) => {
        let cls = 'syn-num';
        if (/^"/.test(match)) {
            cls = /:$/.test(match) ? 'syn-key' : 'syn-str';
        }
        else if (/^(true|false)$/.test(match)) {
            cls = 'syn-bool';
        }
        else if (match === 'null') {
            cls = 'syn-null';
        }
        return `<span class="${cls}">${match}</span>`;
    });
}
function highlightXml(text) {
    const escaped = escapeHtml(text);
    return escaped
        .replace(/(&lt;\/?)([\w:-]+)/g, '$1<span class="syn-tag">$2</span>')
        .replace(/([\w:-]+)(=)(&quot;[^&]*&quot;)/g, '<span class="syn-attr">$1</span>$2<span class="syn-str">$3</span>');
}
function detectAndHighlight(body, mode) {
    if (mode === 'raw')
        return escapeHtml(body);
    try {
        const formatted = JSON.stringify(JSON.parse(body), null, 2);
        return highlightJson(formatted);
    }
    catch { /* not JSON */ }
    if (/^\s*</.test(body)) {
        return highlightXml(body);
    }
    return escapeHtml(body);
}
function getMediaType(contentType) {
    if (/^image\//.test(contentType))
        return 'image';
    if (/^video\//.test(contentType))
        return 'video';
    if (/^audio\//.test(contentType))
        return 'audio';
    if (/application\/pdf/.test(contentType))
        return 'pdf';
    return null;
}
function BinaryViewer({ dataUri, contentType }) {
    const ext = contentType.split('/')[1]?.split(';')[0] || 'bin';
    const sizeKb = Math.round((dataUri.length * 3) / 4 / 1024);
    const label = contentType.split(';')[0];
    const handleOpen = () => {
        vscode.postMessage({ type: 'OPEN_BINARY_RESPONSE', payload: { dataUri, fileName: `response.${ext}` } });
    };
    return (_jsxs("div", { className: "response-media response-binary", children: [_jsx("div", { className: "binary-icon", children: "\uD83D\uDCC4" }), _jsx("div", { className: "binary-label", children: label }), _jsxs("div", { className: "binary-size", children: ["~", sizeKb, " KB"] }), _jsx("button", { className: "binary-open-btn", onClick: handleOpen, children: "Open in VS Code" })] }));
}
function CodeView({ highlighted }) {
    const lines = highlighted.split('\n');
    return (_jsxs("div", { className: "response-body-editor", children: [_jsx("div", { className: "line-gutter", "aria-hidden": true, children: lines.map((_, i) => (_jsx("span", { className: "line-num", children: i + 1 }, i))) }), _jsx("pre", { className: "response-body", children: _jsx("code", { dangerouslySetInnerHTML: { __html: highlighted } }) })] }));
}
export function ResponseBody({ body, viewMode, contentType, htmlPreview }) {
    if (htmlPreview) {
        return (_jsx("div", { className: "response-html-preview", children: _jsx("iframe", { srcDoc: body, sandbox: "allow-same-origin", className: "html-preview-frame", title: "HTML Preview" }) }));
    }
    const mediaType = getMediaType(contentType);
    if (mediaType === 'image') {
        return (_jsx("div", { className: "response-media", children: _jsx("img", { src: body, alt: "Response", className: "response-image" }) }));
    }
    if (mediaType === 'video') {
        return (_jsx("div", { className: "response-media", children: _jsx("video", { src: body, controls: true, className: "response-video" }) }));
    }
    if (mediaType === 'audio') {
        return (_jsx("div", { className: "response-media", children: _jsx("audio", { src: body, controls: true, className: "response-audio" }) }));
    }
    if (mediaType === 'pdf') {
        return _jsx(BinaryViewer, { dataUri: body, contentType: contentType });
    }
    const highlighted = detectAndHighlight(body, viewMode);
    return _jsx(CodeView, { highlighted: highlighted });
}
