import { X } from 'lucide-react';
import { KeyValue } from '../../types';

interface KeyValueTableProps {
  items: KeyValue[];
  onChangeField: (id: string, key: keyof KeyValue, value: string | boolean) => void;
  onRemove: (id: string) => void;
  keyPlaceholder: string;
}

export function KeyValueTable({ items, onChangeField, onRemove, keyPlaceholder }: KeyValueTableProps) {
  return (
    <div className="kv-table">
      <div className="kv-header">
        <span className="kv-check" />
        <span className="kv-key">Key</span>
        <span className="kv-val">Value</span>
        <span className="kv-del" />
      </div>
      {items.map((item) => (
        <div key={item.id} className="kv-row">
          <input
            type="checkbox"
            className="kv-check"
            checked={item.enabled}
            onChange={(e) => onChangeField(item.id, 'enabled', e.target.checked)}
          />
          <input
            className="kv-input kv-key"
            type="text"
            placeholder={keyPlaceholder}
            value={item.key}
            onChange={(e) => onChangeField(item.id, 'key', e.target.value)}
          />
          <input
            className="kv-input kv-val"
            type="text"
            placeholder="value"
            value={item.value}
            onChange={(e) => onChangeField(item.id, 'value', e.target.value)}
          />
          <button
            className="kv-del icon-btn"
            onClick={() => onRemove(item.id)}
            title="Remove"
          >
            <X size={11} strokeWidth={2.5} />
          </button>
        </div>
      ))}
    </div>
  );
}
