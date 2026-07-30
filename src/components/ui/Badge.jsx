export default function Badge({ children, className = "", tone = "neutral" }) {
  const tones = {
    neutral: "luxury-glass text-slate-700 ring-1 ring-black/10",
    dark: "bg-black text-white",
    success: "bg-blue-100 text-blue-700",
    warning: "bg-blue-100 text-blue-700",
    danger: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}
