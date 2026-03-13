import { useRef } from 'react';
import { Environment } from '../../types';

interface VarHighlightInputProps {
  value: string;
  onChange: (val: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  activeEnv: Environment | null;
  variant?: 'url' | 'kv';
}

function renderHighlighted(value: string, activeEnv: Environment | null) {
  const parts = value.split(/({{[^}]*}})/g);
  return parts.map((part, i) => {
    if (/^{{[^}]*}}$/.test(part)) {
      const key = part.slice(2, -2).trim();
      const defined = activeEnv?.variables.some((v) => v.key === key) ?? false;
      return (
        <mark key={i} className={defined ? 'var-token var-defined' : 'var-token var-undefined'}>
          {part}
        </mark>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function VarHighlightInput({ value, onChange, onKeyDown, placeholder, activeEnv, variant = 'url' }: VarHighlightInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  const syncScroll = () => {
    if (inputRef.current && mirrorRef.current) {
      mirrorRef.current.scrollLeft = inputRef.current.scrollLeft;
    }
  };

  const isKv = variant === 'kv';

  return (
    <div className={isKv ? 'var-highlight-wrap-kv' : 'var-highlight-wrap'}>
      <div ref={mirrorRef} className={isKv ? 'var-highlight-mirror-kv' : 'var-highlight-mirror'} aria-hidden>
        {renderHighlighted(value, activeEnv)}
        <span> </span>
      </div>
      <input
        ref={inputRef}
        className={isKv ? 'kv-input var-highlight-input-kv' : 'url-input var-highlight-input'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onScroll={syncScroll}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
      />
    </div>
  );
}
