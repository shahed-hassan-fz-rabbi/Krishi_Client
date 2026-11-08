/** Minimal, consistent table primitives for dataset status & future results. */

export function Table({ children, className = "" }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full min-w-[520px] text-left text-sm">{children}</table>
    </div>
  );
}

export function THead({ columns, children }) {
  if (children) {
    return <thead>{children}</thead>;
  }
  return (
    <thead>
      <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
        {(columns || []).map((c, i) => (
          <th key={c || i} className="whitespace-nowrap px-5 py-3 font-medium">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function TBody({ children }) {
  return <tbody className="divide-y divide-(--km-border)">{children}</tbody>;
}

export function TR({ children, className = "" }) {
  return <tr className={`hover:bg-surface-2/60 transition-colors ${className}`}>{children}</tr>;
}

export function TD({ children, className = "" }) {
  return <td className={`px-5 py-3.5 align-middle text-content ${className}`}>{children}</td>;
}
