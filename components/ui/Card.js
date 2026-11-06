/** Card family: surface container with optional title/description header. */

export function Card({ children, className = "", as: Tag = "div" }) {
  return (
    <Tag
      className={`rounded-xl border border-line bg-surface shadow-km-sm ${className}`}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, description, action = null, className = "" }) {
  return (
    <div className={`flex items-start justify-between gap-4 px-5 pt-5 ${className}`}>
      <div>
        <h3 className="text-base font-semibold text-content">{title}</h3>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className = "" }) {
  return <div className={`px-5 py-5 ${className}`}>{children}</div>;
}
