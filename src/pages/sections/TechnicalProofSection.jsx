import {
  Braces,
  Database,
  MonitorSmartphone,
  ServerCog,
  ShieldCheck,
  Star,
  Wrench,
  Zap,
} from "lucide-react";
import "./technical-proof.css";

const techGroups = [
  {
    side: "left",
    key: "frontend",
    title: "FRONTEND",
    icon: MonitorSmartphone,
    items: [
      { label: "HTML", tone: "html", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" },
      { label: "CSS", tone: "css", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" },
      { label: "Bootstrap", tone: "bootstrap", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg" },
      { label: "Tailwind CSS", tone: "tailwind", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" },
      { label: "JavaScript", tone: "js", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" },
      { label: "React JS", tone: "react", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" },
    ],
  },
  {
    side: "left",
    key: "mobile",
    title: "MOBILE",
    icon: MonitorSmartphone,
    items: [
      { label: "React Native", tone: "react", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" },
    ],
  },
  {
    side: "left",
    key: "cms",
    title: "CMS",
    icon: MonitorSmartphone,
    items: [
      { label: "WordPress", tone: "wordpress", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/wordpress/wordpress-plain.svg" },
    ],
  },
  {
    side: "right",
    key: "backend",
    title: "BACKEND",
    icon: ServerCog,
    items: [
      { label: "Node.js", tone: "node", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" },
      { label: "Python", tone: "python", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" },
      { label: "PHP", tone: "php", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg" },
    ],
  },
  {
    side: "right",
    key: "databases",
    title: "DATABASES",
    icon: Database,
    items: [
      { label: "MySQL", tone: "mysql", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg" },
      { label: "PostgreSQL", tone: "postgres", logo: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" },
    ],
  },
  {
    side: "right",
    key: "tools",
    title: "TOOLS & OTHERS",
    icon: Wrench,
    items: [
      { label: "GitHub", tone: "github", logo: "https://cdn.simpleicons.org/github/181717" },
      { label: "Vercel", tone: "vercel", logo: "https://cdn.simpleicons.org/vercel/000000" },
      { label: "Supabase", tone: "supabase", logo: "https://cdn.simpleicons.org/supabase/3FCF8E" },
      { label: "Expo", tone: "expo", logo: "https://cdn.simpleicons.org/expo/000000" },
      { label: "Hosting/Domains", tone: "hosting", logo: "https://cdn.simpleicons.org/cloudflare/F38020" },
    ],
  },
];

const proofPoints = [
  {
    icon: Star,
    title: "Curated & Purposeful",
    text: "Every technology I use serves a real purpose.",
  },
  {
    icon: Zap,
    title: "Always Evolving",
    text: "I keep learning and adapting to build what's next.",
  },
  {
    icon: ShieldCheck,
    title: "Problem Solver",
    text: "I choose the right tools to solve real problems.",
  },
  {
    icon: Braces,
    title: "Clean Code First",
    text: "Readable, maintainable and scalable by default.",
  },
];

function TechGroup({ group }) {
  const Icon = group.icon;

  return (
    <article className={`tp-group tp-group--${group.side} tp-group--${group.key}`}>
      <div className="tp-group__label">
        <Icon size={16} strokeWidth={1.9} />
        <span>{group.title}</span>
      </div>

      <div className="tp-group__card">
        {group.items.map((item) => (
          <div className="tp-tech" key={`${group.key}-${item.label}`}>
            <span className={`tp-tech__mark tp-tech__mark--${item.tone}`}>
              <img src={item.logo} alt="" aria-hidden="true" />
            </span>
            <span className="tp-tech__name">{item.label}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function TechnicalProofSection() {
  return (
    <section className="technical-proof" id="stack">
      <div className="technical-proof__grid" aria-hidden="true" />
      <div className="technical-proof__glow technical-proof__glow--left" aria-hidden="true" />
      <div className="technical-proof__glow technical-proof__glow--right" aria-hidden="true" />

      <div className="technical-proof__crystal technical-proof__crystal--left" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="technical-proof__crystal technical-proof__crystal--right" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="technical-proof__inner">
        <header className="technical-proof__header">
          <h2>
            Technologies I <em>work</em> with
          </h2>
          <p>
            A curated set of technologies that I use to design, build
            <br />
            and ship reliable web &amp; mobile applications.
          </p>
          <span className="technical-proof__header-line" />
        </header>

        <div className="technical-proof__map">
          <svg
            className="technical-proof__connectors"
            viewBox="0 0 1400 620"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M500 116 H555 Q585 116 585 148 V185 Q585 210 620 210 H640" />
            <path d="M370 300 H510 Q535 300 535 318 V330 Q535 347 575 347 H640" />

            <path d="M1030 116 H890 Q860 116 860 148 V185 Q860 210 825 210 H760" />
            <path d="M1030 300 H890 Q865 300 865 318 V330 Q865 347 825 347 H760" />
            <path d="M1030 482 H890 Q865 482 865 445 V410 Q865 388 825 388 H760" />

            <circle cx="500" cy="116" r="5" />
            <circle cx="370" cy="300" r="5" />
            <circle cx="1030" cy="116" r="5" />
            <circle cx="1030" cy="300" r="5" />
            <circle cx="1030" cy="482" r="5" />

            <circle cx="640" cy="210" r="7" />
            <circle cx="640" cy="347" r="7" />
            <circle cx="760" cy="210" r="7" />
            <circle cx="760" cy="347" r="7" />
            <circle cx="760" cy="388" r="7" />
          </svg>

          <div className="technical-proof__column technical-proof__column--left">
            {techGroups
              .filter((group) => group.side === "left")
              .map((group) => (
                <TechGroup group={group} key={group.key} />
              ))}
          </div>

          <div className="technical-proof__hub-wrap">
            <div className="technical-proof__orbit technical-proof__orbit--outer" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <i />
              <i />
              <i />
              <i />
            </div>

            <div className="technical-proof__orbit technical-proof__orbit--middle" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>

            <div className="technical-proof__hub">
              <div className="technical-proof__hub-logo">ez.</div>
              <strong>FULL-STACK<br />ENGINEERING</strong>
              <p>Design. Code. Deploy.<br />Repeat.</p>
            </div>
          </div>

          <div className="technical-proof__column technical-proof__column--right">
            {techGroups
              .filter((group) => group.side === "right")
              .map((group) => (
                <TechGroup group={group} key={group.key} />
              ))}
          </div>
        </div>

        <div className="technical-proof__proofs">
          {proofPoints.map(({ icon: Icon, title, text }) => (
            <article className="technical-proof__proof" key={title}>
              <span className="technical-proof__proof-icon">
                <Icon size={19} strokeWidth={1.9} />
              </span>
              <div>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
