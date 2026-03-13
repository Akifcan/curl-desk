import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Save, Check, X } from 'lucide-react';
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
export function ResponsePanel({ response, error, isLoading, collections, activeRequestId, onSaveExample }) {
    const [activeTab, setActiveTab] = useState('body');
    const [viewMode, setViewMode] = useState('pretty');
    const [htmlPreview, setHtmlPreview] = useState(false);
    const [savingExample, setSavingExample] = useState(false);
    const [exampleName, setExampleName] = useState('');
    // Find which collection contains the active request
    const parentCollection = collections.find((c) => c.requests.some((r) => r.id === activeRequestId));
    const handleSaveExample = () => {
        if (exampleName.trim() && parentCollection) {
            onSaveExample(parentCollection.id, activeRequestId, exampleName.trim());
            setSavingExample(false);
            setExampleName('');
        }
    };
    return (_jsxs("div", { className: "response-panel", children: [_jsx(ResponseStatusBar, { response: response, error: error, isLoading: isLoading }), response && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "response-tabs", children: [_jsx("button", { className: `tab-btn ${activeTab === 'body' ? 'active' : ''}`, onClick: () => setActiveTab('body'), children: "Body" }), _jsxs("button", { className: `tab-btn ${activeTab === 'headers' ? 'active' : ''}`, onClick: () => setActiveTab('headers'), children: ["Headers", _jsx("span", { className: "tab-badge", children: Object.keys(response.headers).length })] }), activeTab === 'body' && isJson(response.body) && (_jsxs("div", { className: "view-mode-toggle", children: [_jsx("button", { className: `mode-btn ${viewMode === 'pretty' ? 'active' : ''}`, onClick: () => setViewMode('pretty'), children: "Pretty" }), _jsx("button", { className: `mode-btn ${viewMode === 'raw' ? 'active' : ''}`, onClick: () => setViewMode('raw'), children: "Raw" })] })), activeTab === 'body' && isHtml(response.body, response.contentType ?? '') && (_jsxs("div", { className: "view-mode-toggle", children: [_jsx("button", { className: `mode-btn ${!htmlPreview ? 'active' : ''}`, onClick: () => setHtmlPreview(false), children: "Source" }), _jsx("button", { className: `mode-btn ${htmlPreview ? 'active' : ''}`, onClick: () => setHtmlPreview(true), children: "Preview" })] })), parentCollection && (_jsx("div", { className: "save-example-area", children: savingExample ? (_jsxs("div", { className: "save-example-input", children: [_jsx("input", { autoFocus: true, type: "text", placeholder: "Example name...", value: exampleName, onChange: (e) => setExampleName(e.target.value), onKeyDown: (e) => {
                                                if (e.key === 'Enter')
                                                    handleSaveExample();
                                                if (e.key === 'Escape') {
                                                    setSavingExample(false);
                                                    setExampleName('');
                                                }
                                            } }), _jsx("button", { className: "btn btn-primary btn-sm btn-icon", onClick: handleSaveExample, children: _jsx(Check, { size: 12, strokeWidth: 2.5 }) }), _jsx("button", { className: "btn btn-ghost btn-sm btn-icon", onClick: () => { setSavingExample(false); setExampleName(''); }, children: _jsx(X, { size: 12, strokeWidth: 2.5 }) })] })) : (_jsxs("button", { className: "btn btn-ghost btn-sm save-example-btn", onClick: () => setSavingExample(true), children: [_jsx(Save, { size: 11, strokeWidth: 2 }), " Save as Example"] })) }))] }), _jsxs("div", { className: "response-content", children: [activeTab === 'body' && _jsx(ResponseBody, { body: response.body, viewMode: viewMode, contentType: response.contentType ?? '', htmlPreview: htmlPreview }), activeTab === 'headers' && _jsx(ResponseHeaders, { headers: response.headers })] })] }))] }));
}
