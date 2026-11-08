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

export function CardHeader({ title, description, action = null, className = "", children = null }) {
  // Callers either set the `title` prop (rendered as an <h3>) or pass their own
  // header markup as children (e.g. the Handoff page renders <h2> + <p>).
  // Previously children were dropped silently, leaving empty <h3> headings on
  // the Handoff page and hide the real section titles from the DOM. Both usage
  // styles coexist so existing prop-style callers are unaffected.
  const hasTitle = typeof title === "string" && title.trim() !== "";
  return (
    <div className={`flex items-start justify-between gap-4 px-5 pt-5 ${className}`}>
      <div>
        {hasTitle ? (
          <>
            <h3 className="text-base font-semibold text-content">{title}</h3>
            {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
          </>
        ) : (
          children
        )}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className = "" }) {
  return <div className={`px-5 py-5 ${className}`}>{children}</div>;
}
