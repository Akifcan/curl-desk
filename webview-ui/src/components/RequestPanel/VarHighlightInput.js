import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
function renderHighlighted(value, activeEnv) {
    const parts = value.split(/({{[^}]*}})/g);
    return parts.map((part, i) => {
        if (/^{{[^}]*}}$/.test(part)) {
            const key = part.slice(2, -2).trim();
            const defined = activeEnv?.variables.some((v) => v.key === key) ?? false;
            return (_jsx("mark", { className: defined ? 'var-token var-defined' : 'var-token var-undefined', children: part }, i));
        }
        return _jsx("span", { children: part }, i);
    });
}
export function VarHighlightInput({ value, onChange, onKeyDown, placeholder, activeEnv }) {
    const inputRef = useRef(null);
    const mirrorRef = useRef(null);
    const syncScroll = () => {
        if (inputRef.current && mirrorRef.current) {
            mirrorRef.current.scrollLeft = inputRef.current.scrollLeft;
        }
    };
    return (_jsxs("div", { className: "var-highlight-wrap", children: [_jsxs("div", { ref: mirrorRef, className: "var-highlight-mirror", "aria-hidden": true, children: [renderHighlighted(value, activeEnv), _jsx("span", { children: " " })] }), _jsx("input", { ref: inputRef, className: "url-input var-highlight-input", value: value, onChange: (e) => onChange(e.target.value), onKeyDown: onKeyDown, onScroll: syncScroll, placeholder: placeholder, spellCheck: false, autoComplete: "off" })] }));
}
