import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Dribbble,
  Globe2,
  Heart,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import "./footer-pixel-perfect.css";
import { Github, Linkedin, Mail } from "lucide-react";

const NAVIGATION = [
  { label: "Home", href: "#home" },
  { label: "About Me", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Projects", href: "#projects" },
  { label: "Tech Stack", href: "#technical-proof" },
  { label: "Achievements", href: "#achievements" },
  { label: "Contact", href: "#contact" },
];

const SERVICES = [
  { label: "Web Development", href: "#contact" },
  { label: "UI/UX Design", href: "#contact" },
  { label: "Web Applications", href: "#contact" },
  { label: "Frontend Development", href: "#contact" },
  { label: "Backend Development", href: "#contact" },
  { label: "API Development", href: "#contact" },
];

const RESOURCES = [
  { label: "Technical Proof", href: "#technical-proof" },
  { label: "Resume", href: "/resume.pdf" },
];

const SOCIALS = [
  {
    label: "GitHub",
    href: "https://github.com/eru-z",
    icon: Github,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/erudita-zilbeari/",
    icon: Linkedin,
  },
  {
    label: "Email",
    href: "mailto:eruditazilbearids@gmail.com", 
    icon: Mail,
  },
];

const TECHNOLOGIES = [
  [
    "React JS",
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
  ],
  [
    "Node.js",
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg",
  ],
  [
    "React Native",
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
  ],
  [
    "PHP",
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg",
  ],
  [
    "MySQL",
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg",
  ],
  [
    "PostgreSQL",
    "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",
  ],
];

function FooterLinks({ title, links }) {
  return (
    <nav className="footer-pp__links" aria-label={title}>
      <h3><span />{title}</h3>
      <ul>
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href}>
              <ChevronRight size={14} />
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Footer() {
  const reduceMotion = useReducedMotion();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-pp">
      <div className="footer-pp__background" aria-hidden="true">
        <span className="footer-pp__glow footer-pp__glow--one" />
        <span className="footer-pp__glow footer-pp__glow--two" />
      </div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="footer-pp__shell"
      >
        <div className="footer-pp__decor" aria-hidden="true">
          <span className="footer-pp__dots" />
          <span className="footer-pp__orbit footer-pp__orbit--one" />
          <span className="footer-pp__orbit footer-pp__orbit--two" />
          <span className="footer-pp__sphere" />
          <Sparkles className="footer-pp__spark" size={17} />
        </div>

        <div className="footer-pp__main">
          <section className="footer-pp__brand">
<div className="footer-pp__brand-title">
  <div className="footer-pp__logo-image">
    <img
      src="/images/ez-logo-blue.png"
      alt="Erudita Zilbeari logo"
    />
  </div>

  <div className="footer-pp__brand-name">
    <h2>Erudita Zilbeari</h2>
    <span>Full-Stack + UI/UX</span>
  </div>
</div>

            <p>
              Software developer building full-stack systems,
              admin workflows and polished product interfaces.
            </p>

            <div className="footer-pp__socials">
              {SOCIALS.map(({ label, href, icon: Icon }) => (
                <motion.a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  aria-label={label}
                  whileHover={reduceMotion ? {} : { y: -3 }}
                  whileTap={reduceMotion ? {} : { scale: 0.96 }}
                >
                  <Icon size={20} />
                </motion.a>
              ))}
            </div>

            <div className="footer-pp__availability">
              <div>
                <strong><span />Available for new projects</strong>
                <p>Let's build something amazing together.</p>
                <a href="#contact">Let's talk <ArrowRight size={13} /></a>
              </div>
              <span className="footer-pp__availability-icon">
                <Zap size={25} />
              </span>
            </div>
          </section>

          <FooterLinks title="Navigation" links={NAVIGATION} />
          <FooterLinks title="Services" links={SERVICES} />
          <FooterLinks title="Resources" links={RESOURCES} />

          <section className="footer-pp__contact">
            <h3><span />Get in touch</h3>

            <div className="footer-pp__contact-list">
              <a href="mailto:eruditazilbearids@gmail.com">
                <span><Mail size={18} /></span>
                <div>
                  <strong>eruditazilbearids@gmail.com</strong>
                  <small>Send me an email</small>
                </div>
              </a>

              <a href="tel:+38970902183">
                <span><Phone size={18} /></span>
                <div>
                  <strong>+389 70 902 183</strong>
                  <small>Call me directly</small>
                </div>
              </a>

              <div>
                <span><MapPin size={18} /></span>
                <div>
                  <strong>Tetovo, North Macedonia</strong>
                  <small>Open to remote work</small>
                </div>
              </div>

              <a href="#contact">
                <span><CalendarDays size={18} /></span>
                <div>
                  <strong>Schedule a call</strong>
                  <small>Book a 30min meeting</small>
                </div>
              </a>
            </div>
          </section>
        </div>

        <div className="footer-pp__tech-row">
          <article className="footer-pp__trust-card">
            <span><ShieldCheck size={24} /></span>
            <div>
              <h3>Trusted &amp; Professional</h3>
              <p>Committed to quality, performance and long-term partnerships.</p>
            </div>
          </article>

          <section className="footer-pp__technologies">
            <h3>Technologies I work with</h3>
            <div>
              {TECHNOLOGIES.map(([label, logo]) => (
                <span key={label}>
                  <img src={logo} alt="" />
                  {label}
                </span>
              ))}
            </div>
          </section>

          <article className="footer-pp__trust-card">
            <span><ShieldCheck size={24} /></span>
            <div>
              <h3>Secure &amp; Reliable</h3>
              <p>Your data and project ideas are always safe with me.</p>
            </div>
          </article>
        </div>

        <div className="footer-pp__bottom">
          <p>© {currentYear} Erudita. All rights reserved.</p>

          <div>
            <a href="#privacy">Privacy Policy</a>
            <span>•</span>
            <a href="#terms">Terms of Service</a>
          </div>

          <p>
            Designed &amp; built with
            <Heart size={15} fill="currentColor" />
            by Erudita
          </p>
        </div>
      </motion.div>
    </footer>
  );
}

