interface ResponseHeadersProps {
  headers: Record<string, string>;
}

export function ResponseHeaders({ headers }: ResponseHeadersProps) {
  const entries = Object.entries(headers).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="response-headers">
      {entries.map(([key, value]) => (
        <div key={key} className="header-row">
          <span className="header-key">{key}</span>
          <span className="header-sep">:</span>
          <span className="header-value">{value}</span>
        </div>
      ))}
    </div>
  );
}
