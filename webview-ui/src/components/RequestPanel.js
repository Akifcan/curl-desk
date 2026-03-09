import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Send, X, AlignLeft, List, Shield } from 'lucide-react';
import { createKeyValue } from '../types';
import './RequestPanel.css';
const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
export function RequestPanel({ request, onChange, onSend, isLoading }) {
    const [activeTab, setActiveTab] = useState('params');
    const update = (partial) => onChange({ ...request, ...partial });
    const updateKeyValues = (field, items) => {
        update({ [field]: items });
    };
    const handleKvChange = (field, id, key, value) => {
        const items = request[field].map((item) => item.id === id ? { ...item, [key]: value } : item);
        const last = items[items.length - 1];
        if (last && (last.key || last.value)) {
            items.push(createKeyValue());
        }
        updateKeyValues(field, items);
    };
    const removeKv = (field, id) => {
        const items = request[field].filter((item) => item.id !== id);
        if (items.length === 0)
            items.push(createKeyValue());
        updateKeyValues(field, items);
    };
    const tabCount = (tab) => {
        if (tab === 'params')
            return request.params.filter((p) => p.key).length;
        if (tab === 'headers')
            return request.headers.filter((h) => h.key).length;
        if (tab === 'body')
            return request.bodyType !== 'none' ? 1 : 0;
        if (tab === 'auth')
            return request.auth.type !== 'none' ? 1 : 0;
        return 0;
    };
    return (_jsxs("div", { className: "request-panel", children: [_jsxs("div", { className: "url-bar", children: [_jsx("select", { className: "method-select", value: request.method, onChange: (e) => update({ method: e.target.value }), style: { color: getMethodColor(request.method) }, children: METHODS.map((m) => (_jsx("option", { value: m, style: { color: getMethodColor(m) }, children: m }, m))) }), _jsx("input", { className: "url-input", type: "text", placeholder: "https://api.example.com/endpoint", value: request.url, onChange: (e) => update({ url: e.target.value }), onKeyDown: (e) => { if (e.key === 'Enter')
                            onSend(); } }), _jsx("button", { className: `btn btn-send ${isLoading ? 'loading' : ''}`, onClick: onSend, disabled: isLoading || !request.url.trim(), children: isLoading ? _jsx("span", { className: "spinner" }) : _jsxs(_Fragment, { children: [_jsx(Send, { size: 13, strokeWidth: 2.5 }), " Send"] }) })] }), _jsx("div", { className: "request-tabs", children: ['params', 'headers', 'body', 'auth'].map((tab) => {
                    const count = tabCount(tab);
                    const tabIcon = {
                        params: _jsx(List, { size: 12, strokeWidth: 2 }),
                        headers: _jsx(AlignLeft, { size: 12, strokeWidth: 2 }),
                        body: _jsx(AlignLeft, { size: 12, strokeWidth: 2 }),
                        auth: _jsx(Shield, { size: 12, strokeWidth: 2 }),
                    }[tab];
                    return (_jsxs("button", { className: `tab-btn ${activeTab === tab ? 'active' : ''}`, onClick: () => setActiveTab(tab), children: [tabIcon, tab.charAt(0).toUpperCase() + tab.slice(1), count > 0 && _jsx("span", { className: "tab-badge", children: count })] }, tab));
                }) }), _jsxs("div", { className: "request-tab-content", children: [(activeTab === 'params' || activeTab === 'headers') && (_jsx(KeyValueTable, { items: request[activeTab], onChange: (items) => updateKeyValues(activeTab, items), onChangeField: (id, key, value) => handleKvChange(activeTab, id, key, value), onRemove: (id) => removeKv(activeTab, id), keyPlaceholder: activeTab === 'params' ? 'param' : 'header' })), activeTab === 'body' && (_jsx(BodyTab, { bodyType: request.bodyType, body: request.body, formData: request.params, onBodyTypeChange: (bodyType) => update({ bodyType }), onBodyChange: (body) => update({ body }) })), activeTab === 'auth' && (_jsx(AuthTab, { auth: request.auth, onAuthChange: (auth) => update({ auth }) }))] })] }));
}
function getMethodColor(method) {
    const colors = {
        GET: '#61afef',
        POST: '#98c379',
        PUT: '#e5c07b',
        DELETE: '#e06c75',
        PATCH: '#c678dd',
        HEAD: '#56b6c2',
        OPTIONS: '#abb2bf',
    };
    return colors[method] ?? '#abb2bf';
}
function KeyValueTable({ items, onChangeField, onRemove, keyPlaceholder }) {
    return (_jsxs("div", { className: "kv-table", children: [_jsxs("div", { className: "kv-header", children: [_jsx("span", { className: "kv-check" }), _jsx("span", { className: "kv-key", children: "Key" }), _jsx("span", { className: "kv-val", children: "Value" }), _jsx("span", { className: "kv-del" })] }), items.map((item) => (_jsxs("div", { className: "kv-row", children: [_jsx("input", { type: "checkbox", className: "kv-check", checked: item.enabled, onChange: (e) => onChangeField(item.id, 'enabled', e.target.checked) }), _jsx("input", { className: "kv-input kv-key", type: "text", placeholder: keyPlaceholder, value: item.key, onChange: (e) => onChangeField(item.id, 'key', e.target.value) }), _jsx("input", { className: "kv-input kv-val", type: "text", placeholder: "value", value: item.value, onChange: (e) => onChangeField(item.id, 'value', e.target.value) }), _jsx("button", { className: "kv-del icon-btn", onClick: () => onRemove(item.id), title: "Remove", children: _jsx(X, { size: 11, strokeWidth: 2.5 }) })] }, item.id)))] }));
}
function BodyTab({ bodyType, body, onBodyTypeChange, onBodyChange }) {
    return (_jsxs("div", { className: "body-tab", children: [_jsx("div", { className: "body-type-row", children: ['none', 'json', 'text', 'form'].map((type) => (_jsxs("label", { className: "radio-label", children: [_jsx("input", { type: "radio", name: "bodyType", value: type, checked: bodyType === type, onChange: () => onBodyTypeChange(type) }), type === 'none' ? 'None' : type === 'json' ? 'JSON' : type === 'text' ? 'Text' : 'Form'] }, type))) }), bodyType !== 'none' && (_jsx("textarea", { className: "body-editor", value: body, onChange: (e) => onBodyChange(e.target.value), placeholder: bodyType === 'json'
                    ? '{\n  "key": "value"\n}'
                    : bodyType === 'form'
                        ? 'key=value&key2=value2'
                        : 'Request body...', spellCheck: false })), bodyType === 'none' && (_jsx("div", { className: "body-none-msg", children: "No body for this request." }))] }));
}
function AuthTab({ auth, onAuthChange }) {
    const update = (partial) => onAuthChange({ ...auth, ...partial });
    return (_jsxs("div", { className: "auth-tab", children: [_jsxs("div", { className: "auth-type-row", children: [_jsx("label", { className: "field-label", children: "Auth Type" }), _jsxs("select", { className: "auth-select", value: auth.type, onChange: (e) => update({ type: e.target.value }), children: [_jsx("option", { value: "none", children: "No Auth" }), _jsx("option", { value: "bearer", children: "Bearer Token" }), _jsx("option", { value: "basic", children: "Basic Auth" })] })] }), auth.type === 'bearer' && (_jsxs("div", { className: "auth-field", children: [_jsx("label", { className: "field-label", children: "Token" }), _jsx("input", { className: "field-input", type: "text", placeholder: "your-token-here", value: auth.token, onChange: (e) => update({ token: e.target.value }) })] })), auth.type === 'basic' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "auth-field", children: [_jsx("label", { className: "field-label", children: "Username" }), _jsx("input", { className: "field-input", type: "text", placeholder: "username", value: auth.username, onChange: (e) => update({ username: e.target.value }) })] }), _jsxs("div", { className: "auth-field", children: [_jsx("label", { className: "field-label", children: "Password" }), _jsx("input", { className: "field-input", type: "password", placeholder: "password", value: auth.password, onChange: (e) => update({ password: e.target.value }) })] })] })), auth.type === 'none' && (_jsx("div", { className: "auth-none-msg", children: "No authentication for this request." }))] }));
}
