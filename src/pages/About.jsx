import React from "react";
import {
  Atom,
  Braces,
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  Code2,
  Compass,
  Cuboid,
  DatabaseZap,
  Globe2,
  Layers3,
  Network,
  Search,
  Sparkles,
  TrendingUp,
  UserRound,
  Zap,
} from "lucide-react";
import "./about-pixel-perfect.css";

const stats = [
  { icon: CalendarDays, value: "4+", label: "Years\nCoding" },
  { icon: Code2, value: "20+", label: "Projects\nBuilt" },
  { icon: Globe2, value: "3+", label: "Countries\nWorked" },
  { icon: UserRound, value: "2+", label: "Happy\nClients" },
];

const services = [
  {
    icon: Atom,
    title: "Frontend Engineering",
    text: "Building responsive, accessible and production-ready React applications with attention to every detail.",
  },
  {
    icon: CircleUserRound,
    title: "Backend Development",
    text: "Designing scalable APIs, databases and application logic that power reliable and secure digital products.",
  },
  {
    icon: Zap,
    title: "UI Engineering",
    text: "Transforming interfaces into polished experiences through motion, usability and performance optimization.",
  },
  {
    icon: TrendingUp,
    title: "Product Thinking",
    text: "Balancing business goals, user needs and technical decisions to build products that make a real impact.",
  },
];

const process = [
  {
    number: "01",
    title: "Discovery",
    text: "Research requirements and define clear technical goals.",
    progress: "72%",
    icon: Search,
  },
  {
    number: "02",
    title: "Architecture",
    text: "Plan scalable frontend, backend and data structures.",
    progress: "56%",
    icon: Cuboid,
  },
  {
    number: "03",
    title: "Engineering",
    text: "Develop clean, maintainable and production-ready software.",
    progress: "64%",
    icon: Braces,
  },
  {
    number: "04",
    title: "Optimization",
    text: "Test, refine and continuously improve performance.",
    progress: "37%",
    icon: Compass,
  },
];

const stack = [
  { type: "react", label: "React", node: <Atom /> },
  { type: "next", label: "Next.js", node: <span>N.</span> },
  { type: "ts", label: "TypeScript", node: <span>TS</span> },
  { type: "tailwind", label: "Tailwind CSS", node: <span className="about-tailwind-mark">≈</span> },
  { type: "node", label: "Node.js", node: <span>JS</span> },
  { type: "supabase", label: "Supabase", node: <DatabaseZap /> },
  { type: "more", label: "More", node: <span>•••</span> },
];

export default function About({
  portraitSrc = "/images/MEE.png",
}) {
  return (
    <section className="about-page" id="about">
      <div className="about-page__ambient about-page__ambient--left" />
      <div className="about-page__ambient about-page__ambient--right" />
      <div className="about-page__dot-field" aria-hidden="true" />
      <span className="about-page__spark about-page__spark--one">✦</span>
      <span className="about-page__spark about-page__spark--two">＋</span>
      <span className="about-page__spark about-page__spark--three">✦</span>

      <div className="about-layout">
        <div className="about-left">
          <div className="about-visual">
            <article className="about-quote-card">
              <div className="about-quote-mark">“</div>
              <p>
                Great software isn&apos;t just built.
                <strong> It&apos;s engineered with purpose, precision and people in mind.</strong>
              </p>
              <div className="about-signature">Erudita Z.</div>
            </article>

            <div className="about-orbits" aria-hidden="true">
              <span className="about-orbits__ring about-orbits__ring--one" />
              <span className="about-orbits__ring about-orbits__ring--two" />
              <span className="about-orbits__ring about-orbits__ring--three" />
              <span className="about-orbits__beam" />
              <span className="about-orbits__node" />
            </div>

            <div className="about-portrait-frame">
              <div className="about-portrait-frame__halo" />
              <img src={portraitSrc} alt="Erudita Zilbeari" />
            </div>
          </div>

          <div className="about-stats-card">
            <div className="about-stats-card__brand">
              <Sparkles />
            </div>
            {stats.map(({ icon: Icon, value, label }) => (
              <article className="about-stat" key={value}>
                <Icon />
                <strong>{value}</strong>
                <span>{label}</span>
              </article>
            ))}
          </div>

          <div className="about-stack-wrap">
            <div className="about-micro-title">
              <span /> TECHNOLOGIES I WORK WITH
            </div>
            <div className="about-stack">
              {stack.map((item) => (
                <article className="about-stack-item" key={item.label}>
                  <div className={`about-stack-icon about-stack-icon--${item.type}`}>
                    {item.node}
                  </div>
                  <span>{item.label}</span>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="about-right">
          <div className="about-heading-wrap">
            <div className="about-eyebrow"><span /> ABOUT ME</div>
            <h2>
              I turn ideas into
              <em>meaningful<br />digital solutions.</em>
            </h2>
            <div className="about-heading-rule" />
            <p className="about-intro">
              I build modern web and mobile applications that combine clean engineering,
              scalable architecture and thoughtful design. From concept to deployment,
              I focus on creating digital products that are fast, reliable and enjoyable to use.
            </p>
          </div>

          <div className="about-services">
            {services.map(({ icon: Icon, title, text }) => (
              <article className="about-service-card" key={title}>
                <div className="about-service-card__icon"><Icon /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>

          <div className="about-process-wrap">
            <div className="about-micro-title">
              <span /> ENGINEERING PROCESS
            </div>
            <div className="about-process">
              {process.map(({ number, title, text, progress, icon: Icon }) => (
                <article className="about-process-row" key={number}>
                  <span className="about-process-row__number">{number}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <div className="about-process-row__track">
                    <span style={{ width: progress }} />
                  </div>
                  <Icon className="about-process-row__icon" />
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}