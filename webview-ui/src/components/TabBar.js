import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Plus, X } from 'lucide-react';
import { METHOD_COLORS } from '../types';
function getTabLabel(tab) {
    if (tab.request.name && tab.request.name !== 'New Request') {
        return tab.request.name;
    }
    if (tab.request.url) {
        try {
            const u = new URL(tab.request.url);
            return u.pathname === '/' ? u.hostname : u.hostname + u.pathname;
        }
        catch {
            return tab.request.url;
        }
    }
    return 'New Request';
}
export function TabBar({ tabs, activeTabId, onSelect, onClose, onNew }) {
    return (_jsxs("div", { className: "tab-bar", children: [_jsx("div", { className: "tab-bar-list", children: tabs.map((tab) => {
                    const isActive = tab.id === activeTabId;
                    return (_jsxs("div", { className: `tab-bar-item ${isActive ? 'active' : ''}`, onClick: () => onSelect(tab.id), children: [tab.isLoading ? (_jsx("span", { className: "tab-bar-spinner" })) : (_jsx("span", { className: "tab-bar-method", style: { color: METHOD_COLORS[tab.request.method] }, children: tab.request.method })), _jsx("span", { className: "tab-bar-label", children: getTabLabel(tab) }), tabs.length > 1 && (_jsx("button", { className: "tab-bar-close", onClick: (e) => { e.stopPropagation(); onClose(tab.id); }, title: "Close tab", children: _jsx(X, { size: 11, strokeWidth: 2.5 }) }))] }, tab.id));
                }) }), _jsx("button", { className: "tab-bar-new", onClick: onNew, title: "New tab", children: _jsx(Plus, { size: 13, strokeWidth: 2.5 }) })] }));
}
