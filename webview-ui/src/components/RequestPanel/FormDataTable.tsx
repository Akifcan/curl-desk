import { X, Paperclip } from 'lucide-react';
import { FormField, FormFieldType, createFormField } from '../../types';

interface FormDataTableProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

export function FormDataTable({ fields, onChange }: FormDataTableProps) {
  const update = (id: string, partial: Partial<FormField>) => {
    const updated = fields.map((f) => (f.id === id ? { ...f, ...partial } : f));
    const last = updated[updated.length - 1];
    if (last.key || last.value || last.fileName) {
      updated.push(createFormField());
    }
    onChange(updated);
  };

  const remove = (id: string) => {
    const updated = fields.filter((f) => f.id !== id);
    if (updated.length === 0) updated.push(createFormField());
    onChange(updated);
  };

  const handleTypeChange = (id: string, type: FormFieldType) => {
    update(id, { type, value: '', fileName: undefined, fileData: undefined, fileMimeType: undefined });
  };

  const handleFile = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      update(id, {
        fileName: file.name,
        fileData: e.target!.result as string,
        fileMimeType: file.type || 'application/octet-stream',
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="kv-table">
      <div className="kv-header">
        <span className="kv-check" />
        <span className="kv-key">Key</span>
        <span className="form-type-col">Type</span>
        <span className="kv-val">Value</span>
        <span className="kv-del" />
      </div>
      {fields.map((field) => (
        <div key={field.id} className="kv-row">
          <input
            type="checkbox"
            className="kv-check"
            checked={field.enabled}
            onChange={(e) => update(field.id, { enabled: e.target.checked })}
          />
          <input
            className="kv-input kv-key"
            type="text"
            placeholder="key"
            value={field.key}
            onChange={(e) => update(field.id, { key: e.target.value })}
          />
          <select
            className="form-type-select"
            value={field.type}
            onChange={(e) => handleTypeChange(field.id, e.target.value as FormFieldType)}
          >
            <option value="text">Text</option>
            <option value="file">File</option>
          </select>
          {field.type === 'text' ? (
            <input
              className="kv-input kv-val"
              type="text"
              placeholder="value"
              value={field.value}
              onChange={(e) => update(field.id, { value: e.target.value })}
            />
          ) : (
            <label className="file-pick-btn">
              <input
                type="file"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(field.id, f);
                }}
              />
              <Paperclip size={11} strokeWidth={2} />
              <span className={field.fileName ? '' : 'file-placeholder'}>
                {field.fileName ?? 'Choose file'}
              </span>
            </label>
          )}
          <button className="kv-del icon-btn" onClick={() => remove(field.id)} title="Remove">
            <X size={11} strokeWidth={2.5} />
          </button>
        </div>
      ))}
    </div>
  );
}
