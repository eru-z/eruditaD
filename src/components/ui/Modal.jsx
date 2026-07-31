import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, footer, size = "md" }) {
  const sizes = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="admin-modal-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-[#020617]/60 p-3 backdrop-blur-md sm:p-5"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`admin-modal-shell flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden ${sizes[size]} rounded-2xl bg-white shadow-[0_32px_100px_-30px_rgba(2,6,23,.65)] sm:max-h-[calc(100dvh-2.5rem)]`}
          >
            <div className="admin-modal-head flex shrink-0 items-center justify-between border-b border-black/5 px-5 py-4 sm:px-6">
              <h3 className="font-display text-lg font-semibold">{title}</h3>
              <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-black/5" aria-label="Close modal">
                <X size={18} />
              </button>
            </div>
            <div className="admin-modal-body min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">{children}</div>
            {footer && (
              <div className="admin-modal-foot flex shrink-0 justify-end gap-2 border-t border-black/5 px-6 py-4">{footer}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
