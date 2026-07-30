export default function Card({ className = "", glass = false, children, ...props }) {
  return (
    <div
      className={`rounded-[1.5rem] ${
        glass ? "glass" : "luxury-glass"
      } shadow-glass ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
