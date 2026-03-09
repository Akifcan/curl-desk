import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { AlertTriangle, Clock, HardDrive } from 'lucide-react';
import './ResponsePanel.css';
export function ResponsePanel({ response, error, isLoading }) {
    const [activeTab, setActiveTab] = useState('body');
    const [viewMode, setViewMode] = useState('pretty');
    const statusClass = response
        ? response.status < 300
            ? 'status-2xx'
            : response.status < 400
                ? 'status-3xx'
                : response.status < 500
                    ? 'status-4xx'
                    : 'status-5xx'
        : '';
    const formatSize = (bytes) => {
        if (bytes < 1024)
            return `${bytes} B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    };
    const formatBody = (body, mode) => {
        if (mode === 'raw')
            return body;
        try {
            return JSON.stringify(JSON.parse(body), null, 2);
        }
        catch {
            return body;
        }
    };
    const isJson = (body) => {
        try {
            JSON.parse(body);
            return true;
        }
        catch {
            return false;
        }
    };
    const headerEntries = response
        ? Object.entries(response.headers).sort(([a], [b]) => a.localeCompare(b))
        : [];
    return (_jsxs("div", { className: "response-panel", children: [_jsxs("div", { className: "response-status-bar", children: [isLoading && (_jsxs("div", { className: "response-loading", children: [_jsx("span", { className: "loading-dot" }), _jsx("span", { className: "loading-dot" }), _jsx("span", { className: "loading-dot" }), _jsx("span", { className: "loading-text", children: "Sending request..." })] })), !isLoading && !response && !error && (_jsxs("div", { className: "response-placeholder", children: ["Hit ", _jsx("kbd", { children: "Send" }), " to get a response"] })), !isLoading && error && (_jsxs("div", { className: "response-error", children: [_jsx(AlertTriangle, { size: 14, strokeWidth: 2 }), _jsx("span", { children: error })] })), !isLoading && response && (_jsxs("div", { className: "response-meta", children: [_jsxs("span", { className: `status-badge ${statusClass}`, children: [response.status, " ", response.statusText] }), _jsxs("span", { className: "meta-item", children: [_jsx(Clock, { size: 12, strokeWidth: 2, className: "meta-icon" }), _jsxs("span", { className: "meta-value", children: [response.time, "ms"] })] }), _jsxs("span", { className: "meta-item", children: [_jsx(HardDrive, { size: 12, strokeWidth: 2, className: "meta-icon" }), _jsx("span", { className: "meta-value", children: formatSize(response.size) })] })] }))] }), response && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "response-tabs", children: [_jsx("button", { className: `tab-btn ${activeTab === 'body' ? 'active' : ''}`, onClick: () => setActiveTab('body'), children: "Body" }), _jsxs("button", { className: `tab-btn ${activeTab === 'headers' ? 'active' : ''}`, onClick: () => setActiveTab('headers'), children: ["Headers", _jsx("span", { className: "tab-badge", children: headerEntries.length })] }), activeTab === 'body' && isJson(response.body) && (_jsxs("div", { className: "view-mode-toggle", children: [_jsx("button", { className: `mode-btn ${viewMode === 'pretty' ? 'active' : ''}`, onClick: () => setViewMode('pretty'), children: "Pretty" }), _jsx("button", { className: `mode-btn ${viewMode === 'raw' ? 'active' : ''}`, onClick: () => setViewMode('raw'), children: "Raw" })] }))] }), _jsxs("div", { className: "response-content", children: [activeTab === 'body' && (_jsx("pre", { className: "response-body", children: _jsx("code", { dangerouslySetInnerHTML: {
                                        __html: highlightJson(formatBody(response.body, viewMode)),
                                    } }) })), activeTab === 'headers' && (_jsx("div", { className: "response-headers", children: headerEntries.map(([key, value]) => (_jsxs("div", { className: "header-row", children: [_jsx("span", { className: "header-key", children: key }), _jsx("span", { className: "header-sep", children: ":" }), _jsx("span", { className: "header-value", children: value })] }, key))) }))] })] }))] }));
}
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
function highlightJson(json) {
    const escaped = escapeHtml(json);
    return escaped.replace(/("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match) => {
        let cls = 'jn'; // number
        if (/^"/.test(match)) {
            if (/:$/.test(match))
                cls = 'jk'; // key
            else
                cls = 'js'; // string
        }
        else if (/^(true|false)$/.test(match)) {
            cls = 'jb'; // boolean
        }
        else if (match === 'null') {
            cls = 'jnull';
        }
        return `<span class="${cls}">${match}</span>`;
    });
}
