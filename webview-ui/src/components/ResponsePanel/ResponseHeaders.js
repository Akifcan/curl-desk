import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ResponseHeaders({ headers }) {
    const entries = Object.entries(headers).sort(([a], [b]) => a.localeCompare(b));
    return (_jsx("div", { className: "response-headers", children: entries.map(([key, value]) => (_jsxs("div", { className: "header-row", children: [_jsx("span", { className: "header-key", children: key }), _jsx("span", { className: "header-sep", children: ":" }), _jsx("span", { className: "header-value", children: value })] }, key))) }));
}
