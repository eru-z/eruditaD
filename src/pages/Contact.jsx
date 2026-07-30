import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Github,
  Lightbulb,
  Linkedin,
  LockKeyhole,
  Mail,
  MapPin,
  MessageSquare,
  Send,
  ShieldCheck,
  Target,
  UserRound,
  XCircle,
  Zap,
} from "lucide-react";

import { sendContactMessage, useData } from "../utils/storage.js";
import { fadeUp, stagger } from "../utils/animations.js";
import { getBookingUrl } from "../utils/booking.js";
import "./contact-pixel-perfect.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FEATURES = [
  {
    icon: Zap,
    title: "Fast Response",
    desc: "I typically reply within 24 hours.",
  },
  {
    icon: ShieldCheck,
    title: "Private & Secure",
    desc: "Your information is always protected.",
  },
  {
    icon: Target,
    title: "Goal Focused",
    desc: "Focused on delivering the right solution.",
  },
  {
    icon: Lightbulb,
    title: "Open to Ideas",
    desc: "I'm always excited about new projects.",
  },
];

function Field({
  id,
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  large = false,
}) {
  return (
    <div className={`contact-field${large ? " contact-field--large" : ""}`}>
      <label htmlFor={id}>
        {Icon && <Icon size={15} />}
        {label}
      </label>

      <div className="contact-field__control">
        {large ? (
          <textarea
            id={id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            aria-invalid={Boolean(error)}
          />
        ) : (
          <input
            id={id}
            type={type}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            aria-invalid={Boolean(error)}
          />
        )}

        {!large && Icon && <Icon size={16} className="contact-field__end-icon" />}
      </div>

      {error && <p className="contact-field__error">{error}</p>}
    </div>
  );
}

export default function Contact() {
  const [data] = useData();
  const contact = data?.contact || {};
  const bookingUrl = getBookingUrl(data);
  const reduceMotion = useReducedMotion();

  const motionProps = reduceMotion
    ? { initial: false, animate: false }
    : {
        initial: "hidden",
        whileInView: "show",
        viewport: { once: true, amount: 0.12 },
      };

  const [form, setForm] = useState({
    name: "",
    email: "",
    projectType: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const timer = useRef(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));

    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  const validate = () => {
    const next = {};

    if (!form.name.trim()) next.name = "Please enter your name.";

    if (!form.email.trim()) {
      next.email = "Please enter your email.";
    } else if (!EMAIL_RE.test(form.email.trim())) {
      next.email = "Please enter a valid email.";
    }

    if (!form.projectType) next.projectType = "Please choose a project type.";
    if (!form.subject.trim()) next.subject = "Please enter a subject.";
    if (!form.message.trim()) next.message = "Please tell me about your project.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setStatus("sending");

    try {
      await sendContactMessage(form);
      setStatus("success");
      setForm({
        name: "",
        email: "",
        projectType: "",
        subject: "",
        message: "",
      });
    } catch {
      setStatus("error");
    } finally {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setStatus("idle"), 5000);
    }
  };

  const email = contact.email || "eruditazilbearids@gmail.com";
  const phone = contact.phone || "+389 70 902 183";
  const location = contact.location || "Tetovo, North Macedonia";

  return (
    <section id="contact" className="contact-pp" aria-label="Contact">
      <div className="contact-pp__bg" aria-hidden="true">
        <span className="contact-pp__wash contact-pp__wash--one" />
        <span className="contact-pp__wash contact-pp__wash--two" />
        <span className="contact-pp__grid" />
        <span className="contact-pp__dots" />
      </div>

      <div className="contact-pp__shell">
        <div className="contact-pp__layout">
          <motion.div
            variants={stagger}
            {...motionProps}
            className="contact-pp__left"
          >
            <motion.div variants={fadeUp} className="contact-pp__eyebrow">
              <i />
              LET&apos;S CONNECT
            </motion.div>

            <motion.h2 variants={fadeUp}>
              Great ideas start
              <br />
              with a <em>conversation.</em>
            </motion.h2>

            <motion.div variants={fadeUp} className="contact-pp__headline-rule">
              <span />
              <i />
            </motion.div>

            <motion.p variants={fadeUp} className="contact-pp__intro">
              Have a project, opportunity or just want to say hi?
              <br />
              I&apos;d love to hear from you. Let&apos;s build something
              <br />
              amazing together!
            </motion.p>

            <motion.div variants={stagger} {...motionProps} className="contact-pp__feature-list">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <motion.article key={title} variants={fadeUp} className="contact-feature">
                  <span className="contact-feature__line" />
                  <span className="contact-feature__icon">
                    <Icon size={18} />
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                </motion.article>
              ))}
            </motion.div>

            <motion.div variants={fadeUp} {...motionProps} className="contact-orbit" aria-hidden="true">
              <span className="contact-orbit__ring contact-orbit__ring--one" />
              <span className="contact-orbit__ring contact-orbit__ring--two" />
              <span className="contact-orbit__ring contact-orbit__ring--three" />
              <span className="contact-orbit__node contact-orbit__node--one" />
              <span className="contact-orbit__node contact-orbit__node--two" />
              <span className="contact-orbit__node contact-orbit__node--three" />
              <span className="contact-orbit__node contact-orbit__node--four" />

              <span className="contact-orbit__cube">
                <b>ez.</b>
              </span>

              <span className="contact-orbit__platform contact-orbit__platform--one" />
              <span className="contact-orbit__platform contact-orbit__platform--two" />
              <span className="contact-orbit__platform contact-orbit__platform--three" />
            </motion.div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            {...motionProps}
            className="contact-form-card"
          >
            <div className="contact-form-card__header">
              <div className="contact-form-card__title">
                <span className="contact-form-card__code">&lt;/&gt;</span>
                <div>
                  <h3>Send a Message</h3>
                  <p>Tell me about your project or idea.</p>
                </div>
              </div>

              <div className="contact-form-card__status">
                <i />
                <div>
                  <span>Available for new projects</span>
                  <small>Let&apos;s create impact together.</small>
                </div>
              </div>
            </div>

            <form className="contact-form-card__form" onSubmit={onSubmit} noValidate>
              <div className="contact-form-card__row">
                <Field
                  id="contact-name"
                  label="Your Name"
                  icon={UserRound}
                  value={form.name}
                  onChange={(value) => updateField("name", value)}
                  placeholder="Ada Lovelace"
                  error={errors.name}
                />

                <Field
                  id="contact-email"
                  label="Your Email"
                  icon={Mail}
                  type="email"
                  value={form.email}
                  onChange={(value) => updateField("email", value)}
                  placeholder="you@example.com"
                  error={errors.email}
                />
              </div>

              <div className="contact-form-card__row">
                <div className="contact-field">
                  <label htmlFor="contact-project-type">
                    <MessageSquare size={15} />
                    Project Type
                  </label>
                  <div className="contact-field__control">
                    <select
                      id="contact-project-type"
                      value={form.projectType}
                      onChange={(event) =>
                        updateField("projectType", event.target.value)
                      }
                      aria-invalid={Boolean(errors.projectType)}
                    >
                      <option value="">Select a project type</option>
                      <option value="Website">Website</option>
                      <option value="Web Application">Web application</option>
                      <option value="Mobile Application">Mobile application</option>
                      <option value="UI/UX Design">UI/UX design</option>
                      <option value="Collaboration">Collaboration</option>
                      <option value="Other">Other</option>
                    </select>
                    <ChevronDown size={17} className="contact-field__end-icon" />
                  </div>
                  {errors.projectType && (
                    <p className="contact-field__error">{errors.projectType}</p>
                  )}
                </div>

                <Field
                  id="contact-subject"
                  label="Subject"
                  icon={MessageSquare}
                  value={form.subject}
                  onChange={(value) => updateField("subject", value)}
                  placeholder="What's this about?"
                  error={errors.subject}
                />
              </div>

              <Field
                id="contact-message"
                label="Message"
                icon={MessageSquare}
                value={form.message}
                onChange={(value) => updateField("message", value)}
                placeholder="Tell me about your idea, goals, and what you need..."
                error={errors.message}
                large
              />

              <AnimatePresence mode="wait">
                {status === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="contact-form-card__notice is-success"
                  >
                    <Check size={15} />
                    Message sent successfully.
                  </motion.div>
                )}

                {status === "error" && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="contact-form-card__notice is-error"
                  >
                    <XCircle size={15} />
                    Something went wrong. Please try again.
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={status === "sending"}
                whileTap={reduceMotion ? undefined : { scale: 0.988 }}
                className="contact-form-card__submit"
              >
                {status === "sending" ? (
                  <>
                    <span className="contact-form-card__spinner" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <Send size={18} />
                  </>
                )}
              </motion.button>

              <div className="contact-form-card__privacy">
                <LockKeyhole size={14} />
                Your details are private and only used to reply to your message.
              </div>
            </form>
          </motion.div>
        </div>

        <motion.div variants={fadeUp} {...motionProps} className="contact-info-bar">
          <div className="contact-info">
            <span className="contact-info__icon"><Mail size={22} /></span>
            <div>
              <small>EMAIL</small>
              <a href={`mailto:${email}`}>{email}</a>
              <p>Let&apos;s talk via email</p>
            </div>
          </div>

          <div className="contact-info">
            <span className="contact-info__icon">⌕</span>
            <div>
              <small>PHONE</small>
              <a href={`tel:${phone.replace(/\s+/g, "")}`}>{phone}</a>
              <p>Mon – Fri, 9AM – 6PM CET</p>
            </div>
          </div>

          <div className="contact-info">
            <span className="contact-info__icon"><MapPin size={22} /></span>
            <div>
              <small>LOCATION</small>
              <strong>{location}</strong>
              <p>Available worldwide</p>
            </div>
          </div>

          <div className="contact-info contact-info--connect">
            <div>
              <small>CONNECT</small>
              <div className="contact-socials">
                <a href="https://github.com/eru-z" target="_blank" rel="noreferrer" aria-label="GitHub">
                  <Github size={20} />
                </a>
                <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                  <Linkedin size={20} />
                </a>
                <a href={`mailto:${email}`} aria-label="Email">
                  <Mail size={20} />
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} {...motionProps} className="contact-call">
          <a href={bookingUrl} target="_blank" rel="noreferrer">
            Schedule a call
            <CalendarDays size={17} />
            <ArrowRight size={15} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}