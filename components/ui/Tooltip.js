"use client";

/** CSS-only tooltip: pure tailwind wrapper for hover/focus devices. */
export function Tooltip({ label, children, className = "" }) {
  return (
    <span className={`group relative inline-flex items-center ${className}`}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-forest px-2.5 py-1.5 text-xs text-white opacity-0 shadow-km-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 md:block"
      >
        {label}
      </span>
    </span>
  );
}
