export default function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-bold transition duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:opacity-50";
  const variants = {
    primary: "bg-black text-white shadow-soft",
    secondary: "luxury-glass text-slate-900 border border-black/10 hover:bg-white",
    ghost: "bg-transparent text-slate-900 hover:bg-blue-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return (
    <Tag className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </Tag>
  );
}
