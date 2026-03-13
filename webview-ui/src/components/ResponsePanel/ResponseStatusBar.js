import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertTriangle, Clock, HardDrive } from 'lucide-react';
export function ResponseStatusBar({ response, error, isLoading }) {
    const formatSize = (bytes) => {
        if (bytes < 1024)
            return `${bytes} B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    };
    const statusClass = response
        ? response.status < 300
            ? 'status-2xx'
            : response.status < 400
                ? 'status-3xx'
                : response.status < 500
                    ? 'status-4xx'
                    : 'status-5xx'
        : '';
    return (_jsxs("div", { className: "response-status-bar", children: [isLoading && (_jsxs("div", { className: "response-loading", children: [_jsx("span", { className: "loading-dot" }), _jsx("span", { className: "loading-dot" }), _jsx("span", { className: "loading-dot" }), _jsx("span", { className: "loading-text", children: "Sending request..." })] })), !isLoading && !response && !error && (_jsxs("div", { className: "response-placeholder", children: ["Enter a URL and hit ", _jsx("kbd", { children: "Send" }), " to make your first request"] })), !isLoading && error && (_jsxs("div", { className: "response-error", children: [_jsx(AlertTriangle, { size: 14, strokeWidth: 2 }), _jsx("span", { children: error })] })), !isLoading && response && (_jsxs("div", { className: "response-meta", children: [_jsxs("span", { className: `status-badge ${statusClass}`, children: [response.status, " ", response.statusText] }), _jsxs("span", { className: "meta-item", children: [_jsx(Clock, { size: 12, strokeWidth: 2, className: "meta-icon" }), _jsxs("span", { className: "meta-value", children: [response.time, "ms"] })] }), _jsxs("span", { className: "meta-item", children: [_jsx(HardDrive, { size: 12, strokeWidth: 2, className: "meta-icon" }), _jsx("span", { className: "meta-value", children: formatSize(response.size) })] })] }))] }));
}
