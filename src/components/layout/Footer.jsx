import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUp,
  CalendarDays,
  ChevronRight,
  Cloud,
  Code2,
  Database,
  Heart,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Rocket,
  Smartphone,
} from "lucide-react";
import { publicSkills, skillLogo } from "../../utils/skills.js";
import { getBookingUrl } from "../../utils/booking.js";
import "./footer-pixel-perfect.css";

const NAVIGATION = [
  ["Home", "/#home"], ["About", "/#about"], ["Experience", "/#experience"],
  ["Projects", "/projects"], ["Stack", "/#stack"], ["Achievements", "/#achievements"], ["Contact", "/#contact"],
];

const SERVICES = [
  ["Web Development", Code2], ["Mobile Development", Smartphone], ["UI/UX Design", Rocket],
  ["Backend Development", Rocket], ["API Development", Cloud], ["Database Design", Database],
];

const DEFAULT_TECH = [
  "React.js", "React Native", "Node.js", "PostgreSQL", "Python",
  "MySQL", "Tailwind", "Supabase", "PHP", "git/GitHub",
];

function ColumnTitle({ children }) {
  return <h3 className="footer-pp__column-title"><span />{children}</h3>;
}

export default function Footer({ data = {} }) {
  const profile = data?.profile || {};
  const contact = data?.contact || {};
  const reduceMotion = useReducedMotion();
  const email = contact.email || profile.email || "eruditazilbearids@gmail.com";
  const phone = contact.phone || profile.phone || "+389 70 902 183";
  const location = contact.location || profile.location || "Tetovo, North Macedonia";
  const bookingUrl = getBookingUrl(data);
  const managedSkills = publicSkills(data?.skills).slice(0, 10);
  const technologies = managedSkills.length
    ? managedSkills.map((item) => ({ name: item.name, logo: skillLogo(item.name, item.logo) }))
    : DEFAULT_TECH.map((name) => ({ name, logo: skillLogo(name) }));

  const socials = [
    ["LinkedIn", "https://www.linkedin.com/in/erudita-zilbeari-273b7035a", Linkedin],
    ["Email", `mailto:${email}`, Mail],
  ];

  return (
    <footer className="footer-pp">
      <div className="footer-pp__space-art" aria-hidden="true">
        <span className="footer-pp__galaxy" /><span className="footer-pp__planet" />
        <span className="footer-pp__dots footer-pp__dots--left" /><span className="footer-pp__dots footer-pp__dots--right" />
      </div>

      <motion.div
        className="footer-pp__shell"
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.55 }}
      >
        <div className="footer-pp__main">
          <section className="footer-pp__brand">
            <img className="footer-pp__logo" src="/images/ez-logo-blue.png" alt="Erudita Zilbeari" />
            <h2>{profile.name || "Erudita Zilbeari"}</h2>
            <strong>{profile.role || "Full-Stack Developer"}</strong>
            <p>{profile.footerDescription || "Building fast, scalable and beautiful digital experiences that solve real problems and create impact."}</p>
            <div className="footer-pp__socials">
              {socials.map(([label, href, Icon]) => (
                <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" aria-label={label}><Icon size={16} /></a>
              ))}
            </div>
          </section>

          <nav className="footer-pp__nav" aria-label="Footer navigation">
            <ColumnTitle>Navigation</ColumnTitle>
            <ul>{NAVIGATION.map(([label, href]) => <li key={label}><a href={href}><ChevronRight size={13} />{label}</a></li>)}</ul>
          </nav>

          <nav className="footer-pp__services" aria-label="Services">
            <ColumnTitle>Services</ColumnTitle>
            <ul>{SERVICES.map(([label, Icon]) => <li key={label}><a href="/#contact"><Icon size={14} />{label}</a></li>)}</ul>
          </nav>

          <section className="footer-pp__technologies">
            <ColumnTitle>Technologies</ColumnTitle>
            <div>{technologies.map(({ name, logo }) => <span key={name}><img src={logo} alt="" />{name}</span>)}</div>
          </section>

          <section className="footer-pp__contact">
            <ColumnTitle>Let's Connect</ColumnTitle>
            <div className="footer-pp__contact-list">
              <a href={`mailto:${email}`}><Mail size={15} /><span>{email}</span></a>
              <a href={`tel:${String(phone).replace(/\s+/g, "")}`}><Phone size={15} /><span>{phone}</span></a>
              <div><MapPin size={15} /><span>{location}</span></div>
              <a href={bookingUrl} target="_blank" rel="noreferrer"><CalendarDays size={15} /><span>Schedule a 30 min Google Meet</span><ArrowRight size={13} /></a>
            </div>
          </section>
        </div>

        <div className="footer-pp__bottom">
          <p>&copy; {new Date().getFullYear()} Erudita. All rights reserved.</p>
          <button
            className="footer-pp__scroll-top"
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
            aria-label="Scroll back to the top"
            title="Back to top"
          >
            <ArrowUp size={15} />
            <span>Back to top</span>
          </button>
          <div><a href="/#contact">Privacy Policy</a><i aria-hidden="true">{"\u2022"}</i><a href="/#contact">Terms of Service</a><i aria-hidden="true">{"\u2022"}</i><span>Designed &amp; built with <Heart size={13} fill="currentColor" /> by Erudita</span></div>
        </div>
      </motion.div>
    </footer>
  );
}
