import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    // Try JSON
    try {
        const formatted = JSON.stringify(JSON.parse(body), null, 2);
        return highlightJson(formatted);
    }
    catch { /* not JSON */ }
    // Try HTML/XML
    if (/^\s*</.test(body)) {
        return highlightXml(body);
    }
    return escapeHtml(body);
}
export function ResponseBody({ body, viewMode }) {
    const highlighted = detectAndHighlight(body, viewMode);
    const lines = highlighted.split('\n');
    return (_jsxs("div", { className: "response-body-editor", children: [_jsx("div", { className: "line-gutter", "aria-hidden": true, children: lines.map((_, i) => (_jsx("span", { className: "line-num", children: i + 1 }, i))) }), _jsx("pre", { className: "response-body", children: _jsx("code", { dangerouslySetInnerHTML: { __html: highlighted } }) })] }));
}
