import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createFormField } from '../../types';
import { FormDataTable } from './FormDataTable';
export function BodyTab({ bodyType, body, formFields, onBodyTypeChange, onBodyChange, onFormFieldsChange, name = 'bodyType', }) {
    const safeFormFields = formFields?.length ? formFields : [createFormField()];
    return (_jsxs("div", { className: "body-tab", children: [_jsx("div", { className: "body-type-row", children: ['none', 'json', 'text', 'form'].map((type) => (_jsxs("label", { className: "radio-label", children: [_jsx("input", { type: "radio", name: name, value: type, checked: bodyType === type, onChange: () => onBodyTypeChange(type) }), type === 'none' ? 'None' : type === 'json' ? 'JSON' : type === 'text' ? 'Text' : 'Form'] }, type))) }), bodyType === 'none' && (_jsx("div", { className: "body-none-msg", children: "No body for this request." })), (bodyType === 'json' || bodyType === 'text') && (_jsx("textarea", { className: "body-editor", value: body, onChange: (e) => onBodyChange(e.target.value), placeholder: bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Request body...', spellCheck: false })), bodyType === 'form' && (_jsx(FormDataTable, { fields: safeFormFields, onChange: onFormFieldsChange }))] }));
}
