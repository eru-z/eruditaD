import {
  Atom,
  CalendarDays,
  Code2,
  Cuboid,
  Globe2,
  Sparkles,
  Rocket,
  UserRound,
  Zap,
} from "lucide-react";
import { publicSkills, skillLogo } from "../utils/skills.js";
import "./about-pixel-perfect.css";

const stats = [
  { icon: CalendarDays, value: "4+", label: "Years\nCoding" },
  { icon: Code2, value: "20+", label: "Projects\nBuilt" },
  { icon: Globe2, value: "3+", label: "Countries\nWorked" },
  { icon: UserRound, value: "2+", label: "Happy\nClients" },
];

const services = [
  { icon: Atom, title: "Clean Engineering", text: "Writing maintainable, scalable and efficient code following best practices and modern standards.", tone: "blue" },
  { icon: Cuboid, title: "Problem Solver", text: "Turning complex problems into simple, elegant and user-centered solutions.", tone: "blue" },
  { icon: Zap, title: "UI/UX Focused", text: "Designing intuitive interfaces that provide exceptional user experience and engagement.", tone: "violet" },
  { icon: Rocket, title: "Always Improving", text: "Continuously learning, exploring new technologies and pushing boundaries every day.", tone: "violet" },
];

const stack = [
  "React.js",
  "Node.js",
  "Tailwind",
  "Supabase",
  "PostgreSQL",
  "MySQL",
  "git/GitHub",
].map((name) => ({
  type: "managed",
  label: name,
  node: <img src={skillLogo(name)} alt={`${name} logo`} />,
}));

const verifiedImpact = [
  { icon: Code2, value: '20+', label: 'Projects Built', tone: 'blue' },
  { icon: CalendarDays, value: '4+', label: 'Years Coding', tone: 'blue' },
  { icon: Globe2, value: '3+', label: 'Countries Worked', tone: 'violet' },
];

export default function About({ data = {}, portraitSrc }) {
  const profile = data?.profile || {};
  const aboutPortrait = profile.portraitUrl || portraitSrc || "/images/MEE.png";
  const aboutSkills = publicSkills(data?.skills).slice(0, 7);
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
                {profile.aboutQuote || "Great software isn't just built. It's engineered with purpose, precision and people in mind."}
              </p>
              <div className="about-signature">{profile.name || "Erudita Z."}</div>
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
              <img src={aboutPortrait} alt={profile.name || "Erudita Zilbeari"} />
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
              {(aboutSkills.length ? aboutSkills.map((skill) => ({ type: "managed", label: skill.name, node: <img src={skillLogo(skill.name, skill.logo)} alt={`${skill.name} logo`} /> })) : stack).map((item) => (
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
              {profile.aboutHeading || "I turn ideas into"}
              <em>{profile.aboutAccent || <>meaningful<br />digital solutions.</>}</em>
            </h2>
            <div className="about-heading-rule" />
            <p className="about-intro">{profile.about || "I build modern web and mobile applications that combine clean engineering, scalable architecture and thoughtful design."}</p>
          </div>

          <div className="about-services">
            {services.map(({ icon: Icon, title, text, tone }) => (
              <article className={`about-service-card is-${tone}`} key={title}>
                <div className="about-service-card__icon"><Icon /></div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>

          <div className="about-impact-rail" aria-label="Professional impact">
            {verifiedImpact.map(({ icon: Icon, value, label, tone }) => (
              <article className={`about-impact-item is-${tone}`} key={label}>
                <span><Icon /></span>
                <div>
                  <strong>{value}</strong>
                  <small>{label}</small>
                </div>
              </article>
            ))}
          </div>        </div>
      </div>
    </section>
  );
}
