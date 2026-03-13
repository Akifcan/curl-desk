import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { ResponseStatusBar } from './ResponseStatusBar';
import { ResponseBody } from './ResponseBody';
import { ResponseHeaders } from './ResponseHeaders';
import './ResponsePanel.css';
function isJson(body) {
    try {
        JSON.parse(body);
        return true;
    }
    catch {
        return false;
    }
}
function isHtml(body, contentType) {
    if (/text\/html/i.test(contentType))
        return true;
    return /^\s*<!doctype\s+html/i.test(body) || /^\s*<html/i.test(body);
}
export function ResponsePanel({ response, error, isLoading }) {
    const [activeTab, setActiveTab] = useState('body');
    const [viewMode, setViewMode] = useState('pretty');
    const [htmlPreview, setHtmlPreview] = useState(false);
    return (_jsxs("div", { className: "response-panel", children: [_jsx(ResponseStatusBar, { response: response, error: error, isLoading: isLoading }), response && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "response-tabs", children: [_jsx("button", { className: `tab-btn ${activeTab === 'body' ? 'active' : ''}`, onClick: () => setActiveTab('body'), children: "Body" }), _jsxs("button", { className: `tab-btn ${activeTab === 'headers' ? 'active' : ''}`, onClick: () => setActiveTab('headers'), children: ["Headers", _jsx("span", { className: "tab-badge", children: Object.keys(response.headers).length })] }), activeTab === 'body' && isJson(response.body) && (_jsxs("div", { className: "view-mode-toggle", children: [_jsx("button", { className: `mode-btn ${viewMode === 'pretty' ? 'active' : ''}`, onClick: () => setViewMode('pretty'), children: "Pretty" }), _jsx("button", { className: `mode-btn ${viewMode === 'raw' ? 'active' : ''}`, onClick: () => setViewMode('raw'), children: "Raw" })] })), activeTab === 'body' && isHtml(response.body, response.contentType ?? '') && (_jsxs("div", { className: "view-mode-toggle", children: [_jsx("button", { className: `mode-btn ${!htmlPreview ? 'active' : ''}`, onClick: () => setHtmlPreview(false), children: "Source" }), _jsx("button", { className: `mode-btn ${htmlPreview ? 'active' : ''}`, onClick: () => setHtmlPreview(true), children: "Preview" })] }))] }), _jsxs("div", { className: "response-content", children: [activeTab === 'body' && _jsx(ResponseBody, { body: response.body, viewMode: viewMode, contentType: response.contentType ?? '', htmlPreview: htmlPreview }), activeTab === 'headers' && _jsx(ResponseHeaders, { headers: response.headers })] })] }))] }));
}
