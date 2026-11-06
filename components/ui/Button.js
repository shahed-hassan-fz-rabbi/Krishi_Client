import Link from "next/link";

/**
 * Krishi Mama Button.
 * Variants: primary (emerald), forest (deep green), outline, ghost, danger.
 * Sizes: sm | md | lg. Renders <Link> when `href` is set.
 */
const variantClasses = {
  primary:
    "bg-emerald text-white hover:bg-emerald-strong shadow-km-sm disabled:opacity-50 disabled:hover:bg-emerald",
  forest: "bg-forest text-white hover:brightness-110 shadow-km-sm",
  outline:
    "border border-line bg-transparent text-content hover:bg-surface-2 hover:border-emerald/40",
  ghost: "bg-transparent text-content hover:bg-surface-2",
  danger: "bg-danger text-white hover:brightness-95",
};

export function Button({
  as = "button",
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed";
  const sizes = { sm: "h-9 px-3 text-sm", md: "h-10 px-4 text-sm", lg: "h-12 px-6 text-base" };
  const cls = `${base} ${variantClasses[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button type={as} className={cls} {...props}>
      {children}
    </button>
  );
}
