import { motion, useReducedMotion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: "easeOut" } },
};

export default function SectionShell({ id, eyebrow, title, children, className = "" }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      id={id}
      className={`ep-section ${className}`}
      variants={fadeUp}
      initial={reduceMotion ? false : "hidden"}
      whileInView={reduceMotion ? undefined : "show"}
      viewport={{ once: true, amount: 0.14 }}
    >
      {(eyebrow || title) && (
        <div className="ep-section-head">
          {eyebrow && <span>{eyebrow}</span>}
          {title && <h2>{title}</h2>}
        </div>
      )}
      {children}
    </motion.section>
  );
}
