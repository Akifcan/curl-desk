import { jsx as _jsx } from "react/jsx-runtime";
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
function highlightJson(json) {
    const escaped = escapeHtml(json);
    return escaped.replace(/("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match) => {
        let cls = 'jn';
        if (/^"/.test(match)) {
            cls = /:$/.test(match) ? 'jk' : 'js';
        }
        else if (/^(true|false)$/.test(match)) {
            cls = 'jb';
        }
        else if (match === 'null') {
            cls = 'jnull';
        }
        return `<span class="${cls}">${match}</span>`;
    });
}
function formatBody(body, mode) {
    if (mode === 'raw')
        return body;
    try {
        return JSON.stringify(JSON.parse(body), null, 2);
    }
    catch {
        return body;
    }
}
export function ResponseBody({ body, viewMode }) {
    return (_jsx("pre", { className: "response-body", children: _jsx("code", { dangerouslySetInnerHTML: {
                __html: highlightJson(formatBody(body, viewMode)),
            } }) }));
}
