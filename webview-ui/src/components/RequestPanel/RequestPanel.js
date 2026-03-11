import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Send, AlignLeft, List, Shield } from 'lucide-react';
import { createKeyValue } from '../../types';
import { KeyValueTable } from './KeyValueTable';
import { BodyTab } from './BodyTab';
import { AuthTab } from './AuthTab';
import { VarHighlightInput } from './VarHighlightInput';
import './RequestPanel.css';
const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
const METHOD_COLORS = {
    GET: '#61afef',
    POST: '#98c379',
    PUT: '#e5c07b',
    DELETE: '#e06c75',
    PATCH: '#c678dd',
    HEAD: '#56b6c2',
    OPTIONS: '#abb2bf',
};
export function RequestPanel({ request, onChange, onSend, isLoading, activeEnv }) {
    const [activeTab, setActiveTab] = useState('params');
    const update = (partial) => onChange({ ...request, ...partial });
    const handleKvChange = (field, id, key, value) => {
        const items = request[field].map((item) => item.id === id ? { ...item, [key]: value } : item);
        const last = items[items.length - 1];
        if (last && (last.key || last.value)) {
            items.push(createKeyValue());
        }
        update({ [field]: items });
    };
    const removeKv = (field, id) => {
        const items = request[field].filter((item) => item.id !== id);
        if (items.length === 0)
            items.push(createKeyValue());
        update({ [field]: items });
    };
    const tabCount = (tab) => {
        if (tab === 'params')
            return request.params.filter((p) => p.key).length;
        if (tab === 'headers')
            return request.headers.filter((h) => h.key).length;
        if (tab === 'body') {
            if (request.bodyType === 'form') {
                return request.formFields?.filter((f) => f.enabled && f.key).length ?? 0;
            }
            return request.bodyType !== 'none' ? 1 : 0;
        }
        if (tab === 'auth')
            return request.auth.type !== 'none' ? 1 : 0;
        return 0;
    };
    const TAB_ICONS = {
        params: _jsx(List, { size: 12, strokeWidth: 2 }),
        headers: _jsx(AlignLeft, { size: 12, strokeWidth: 2 }),
        body: _jsx(AlignLeft, { size: 12, strokeWidth: 2 }),
        auth: _jsx(Shield, { size: 12, strokeWidth: 2 }),
    };
    return (_jsxs("div", { className: "request-panel", children: [_jsxs("div", { className: "url-bar", children: [_jsx("select", { className: "method-select", value: request.method, onChange: (e) => update({ method: e.target.value }), style: { color: METHOD_COLORS[request.method] }, children: METHODS.map((m) => (_jsx("option", { value: m, style: { color: METHOD_COLORS[m] }, children: m }, m))) }), _jsx(VarHighlightInput, { value: request.url, onChange: (url) => update({ url }), onKeyDown: (e) => { if (e.key === 'Enter')
                            onSend(); }, placeholder: "https://api.example.com/endpoint", activeEnv: activeEnv }), _jsx("button", { className: `btn btn-send ${isLoading ? 'loading' : ''}`, onClick: onSend, disabled: isLoading || !request.url.trim(), children: isLoading ? _jsx("span", { className: "spinner" }) : _jsxs(_Fragment, { children: [_jsx(Send, { size: 13, strokeWidth: 2.5 }), " Send"] }) })] }), _jsx("div", { className: "request-tabs", children: ['params', 'headers', 'body', 'auth'].map((tab) => {
                    const count = tabCount(tab);
                    return (_jsxs("button", { className: `tab-btn ${activeTab === tab ? 'active' : ''}`, onClick: () => setActiveTab(tab), children: [TAB_ICONS[tab], tab.charAt(0).toUpperCase() + tab.slice(1), count > 0 && _jsx("span", { className: "tab-badge", children: count })] }, tab));
                }) }), _jsxs("div", { className: "request-tab-content", children: [(activeTab === 'params' || activeTab === 'headers') && (_jsx(KeyValueTable, { items: request[activeTab], onChangeField: (id, key, value) => handleKvChange(activeTab, id, key, value), onRemove: (id) => removeKv(activeTab, id), keyPlaceholder: activeTab === 'params' ? 'param' : 'header' })), activeTab === 'body' && (_jsx(BodyTab, { bodyType: request.bodyType, body: request.body, formFields: request.formFields, onBodyTypeChange: (bodyType) => update({ bodyType }), onBodyChange: (body) => update({ body }), onFormFieldsChange: (formFields) => update({ formFields }) })), activeTab === 'auth' && (_jsx(AuthTab, { auth: request.auth, onAuthChange: (auth) => update({ auth }) }))] })] }));
}
