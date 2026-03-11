import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X, Paperclip } from 'lucide-react';
import { createFormField } from '../../types';
export function FormDataTable({ fields, onChange }) {
    const update = (id, partial) => {
        const updated = fields.map((f) => (f.id === id ? { ...f, ...partial } : f));
        const last = updated[updated.length - 1];
        if (last.key || last.value || last.fileName) {
            updated.push(createFormField());
        }
        onChange(updated);
    };
    const remove = (id) => {
        const updated = fields.filter((f) => f.id !== id);
        if (updated.length === 0)
            updated.push(createFormField());
        onChange(updated);
    };
    const handleTypeChange = (id, type) => {
        update(id, { type, value: '', fileName: undefined, fileData: undefined, fileMimeType: undefined });
    };
    const handleFile = (id, file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            update(id, {
                fileName: file.name,
                fileData: e.target.result,
                fileMimeType: file.type || 'application/octet-stream',
            });
        };
        reader.readAsDataURL(file);
    };
    return (_jsxs("div", { className: "kv-table", children: [_jsxs("div", { className: "kv-header", children: [_jsx("span", { className: "kv-check" }), _jsx("span", { className: "kv-key", children: "Key" }), _jsx("span", { className: "form-type-col", children: "Type" }), _jsx("span", { className: "kv-val", children: "Value" }), _jsx("span", { className: "kv-del" })] }), fields.map((field) => (_jsxs("div", { className: "kv-row", children: [_jsx("input", { type: "checkbox", className: "kv-check", checked: field.enabled, onChange: (e) => update(field.id, { enabled: e.target.checked }) }), _jsx("input", { className: "kv-input kv-key", type: "text", placeholder: "key", value: field.key, onChange: (e) => update(field.id, { key: e.target.value }) }), _jsxs("select", { className: "form-type-select", value: field.type, onChange: (e) => handleTypeChange(field.id, e.target.value), children: [_jsx("option", { value: "text", children: "Text" }), _jsx("option", { value: "file", children: "File" })] }), field.type === 'text' ? (_jsx("input", { className: "kv-input kv-val", type: "text", placeholder: "value", value: field.value, onChange: (e) => update(field.id, { value: e.target.value }) })) : (_jsxs("label", { className: "file-pick-btn", children: [_jsx("input", { type: "file", hidden: true, onChange: (e) => {
                                    const f = e.target.files?.[0];
                                    if (f)
                                        handleFile(field.id, f);
                                } }), _jsx(Paperclip, { size: 11, strokeWidth: 2 }), _jsx("span", { className: field.fileName ? '' : 'file-placeholder', children: field.fileName ?? 'Choose file' })] })), _jsx("button", { className: "kv-del icon-btn", onClick: () => remove(field.id), title: "Remove", children: _jsx(X, { size: 11, strokeWidth: 2.5 }) })] }, field.id)))] }));
}
