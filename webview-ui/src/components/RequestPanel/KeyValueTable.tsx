import { X } from 'lucide-react';
import { KeyValue, Environment } from '../../types';
import { VarHighlightInput } from './VarHighlightInput';

interface KeyValueTableProps {
  items: KeyValue[];
  onChangeField: (id: string, key: keyof KeyValue, value: string | boolean) => void;
  onRemove: (id: string) => void;
  keyPlaceholder: string;
  activeEnv: Environment | null;
}

export function KeyValueTable({ items, onChangeField, onRemove, keyPlaceholder, activeEnv }: KeyValueTableProps) {
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
          <VarHighlightInput
            value={item.key}
            onChange={(val) => onChangeField(item.id, 'key', val)}
            placeholder={keyPlaceholder}
            activeEnv={activeEnv}
            variant="kv"
          />
          <div className="var-highlight-wrap-kv kv-val-wrap">
            <div className="var-highlight-mirror-kv" aria-hidden>
              {item.value.split(/({{[^}]*}})/g).map((part, i) =>
                /^{{[^}]*}}$/.test(part) ? (
                  <mark
                    key={i}
                    className={
                      activeEnv?.variables.some((v) => v.key === part.slice(2, -2).trim())
                        ? 'var-token var-defined'
                        : 'var-token var-undefined'
                    }
                  >
                    {part}
                  </mark>
                ) : (
                  <span key={i}>{part}</span>
                )
              )}
              <span> </span>
            </div>
            <input
              className="kv-input var-highlight-input-kv"
              type="text"
              placeholder="value"
              value={item.value}
              onChange={(e) => onChangeField(item.id, 'value', e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
          </div>
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
