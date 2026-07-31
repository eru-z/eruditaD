import { Suspense, lazy } from "react";
import {
  ArrowUpRight,
  Code2,
  Globe2,
  Rocket,
  UserRound,
} from "lucide-react";
import { useData } from "../utils/storage.js";
import "./home-pixel-perfect.css";

const About = lazy(() => import("./About.jsx"));
const Contact = lazy(() => import("./Contact.jsx"));
const ProjectsIndex = lazy(() => import("./ProjectsIndex.jsx"));
const AchievementsSection = lazy(() => import("./sections/AchievementsSection.jsx"));
const ExperienceSection = lazy(() => import("./sections/ExperienceSection.jsx"));
const TechnicalProofSection = lazy(() => import("./sections/TechnicalProofSection.jsx"));

const metrics = [
  { icon: Rocket, value: "20+", label: "Projects" },
  { icon: UserRound, value: "2", label: "Happy Clients" },
  { icon: Globe2, value: "3+", label: "Countries" },
  { icon: Code2, value: "48h", label: "Rapid Prototypes" },
];


const technologies = [
  { name: "React.js", logo: "https://cdn.simpleicons.org/react/61DAFB" },
  { name: "React Native", logo: "https://cdn.simpleicons.org/react/61DAFB" },
  { name: "Node.js", logo: "https://cdn.simpleicons.org/nodedotjs/5FA04E" },
  { name: "Python", logo: "https://cdn.simpleicons.org/python/3776AB" },
  { name: "MySQL", logo: "https://cdn.simpleicons.org/mysql/4479A1" },
  { name: "PHP", logo: "https://cdn.simpleicons.org/php/777BB4" },
];

const particles = Array.from({ length: 14 }, (_, index) => index);

export default function Home() {
  const [data] = useData();
  const profile = data?.profile || {};

  const handlePointerMove = (event) => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--pointer-x", `${event.clientX - bounds.left}px`);
    event.currentTarget.style.setProperty("--pointer-y", `${event.clientY - bounds.top}px`);
    event.currentTarget.style.setProperty("--pointer-opacity", "1");
  };

  return (
    <>
      <section className="home-hero" id="home" onPointerMove={handlePointerMove} onPointerLeave={(event) => event.currentTarget.style.setProperty("--pointer-opacity", "0")}>
        <div className="home-pointer-light" aria-hidden="true" />
        <div className="home-hero__grid" aria-hidden="true" />
        <div className="home-hero__blueprint" aria-hidden="true">
          <strong>BUILD</strong>
        </div>
        <div className="home-vector-paths" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="home-particles" aria-hidden="true">
          {particles.map((item) => (
            <i key={item} style={{ "--i": item }} />
          ))}
        </div>

        <div className="home-hero__content">
          <div className="home-copy" aria-label="Portfolio introduction">
            <div className="home-eyebrow">
              <span className="home-eyebrow__dot" />
              FULL-STACK DEVELOPMENT · UI ENGINEERING
            </div>

            <h1 className="home-title">
  <span>Engineering</span>
  <span>
    <em>digital</em> products
  </span>
  <span>
    people <strong>remember.</strong>
  </span>
</h1>

            <p className="home-description">
  I design and engineer fast, scalable web &amp; mobile experiences that combine thoughtful design, clean code and real business value.
</p>

            <div className="home-actions">
              <a className="home-btn home-btn--primary" href="#contact">
                Start a Project
                <ArrowUpRight size={14} strokeWidth={2.2} />
              </a>
              <a className="home-btn home-btn--secondary" href="/projects" aria-label="View projects">
                <span className="home-play-icon" aria-hidden="true">
                  <ArrowUpRight size={12} strokeWidth={2.2} />
                </span>
                View Projects
              </a>
            </div>

<p className="home-availability">
  <span aria-hidden="true" />
  Available for freelance projects <i>·</i> Europe <i>·</i> Remote
</p>

            <div className="home-metrics-rail" aria-label="Portfolio statistics">
              {metrics.map(({ icon: Icon, value, label }) => (
                <article className="home-stat" key={label}>
                  <span className="home-stat__icon">
                    <Icon size={15} strokeWidth={1.9} />
                  </span>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </article>
              ))}
            </div>

            <div className="home-tools" aria-label="Trusted modern technologies">
              <p>CORE TECHNOLOGIES</p>
              <div className="home-tools__dock">
                {technologies.map((tool) => (
                  <span className="home-tool" key={tool.name}>
                    <img src={tool.logo} alt="" width="28" height="28" loading="lazy" decoding="async" />
                    <small>{tool.name}</small>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="home-visual" aria-label="Erudita Zilbeari portrait engineering visual">
            <div className="home-portal" aria-hidden="true">
              <span className="home-portal__halo" />
              <span className="home-portal__disc" />
              <span className="home-portal__blue" />
              <span className="home-portal__glass" />
              <span className="home-portal__ticks" />
            </div>

            <div className="home-platform" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>

            <div className="home-orbit home-orbit--chrome" aria-hidden="true" />
            <div className="home-orbit home-orbit--glass" aria-hidden="true" />
            <div className="home-orbit home-orbit--cobalt" aria-hidden="true" />
            <div className="home-orbit home-orbit--thin" aria-hidden="true" />
            <span className="home-orbit__node home-orbit__node--one" />
            <span className="home-orbit__node home-orbit__node--two" />
            <span className="home-orbit__node home-orbit__node--three" />
            <span className="home-orbit__node home-orbit__node--four" />

            <span className="home-micro home-micro--status" aria-hidden="true" />
            <span className="home-micro home-micro--tag" aria-hidden="true">
              FULL-STACK / UI ENGINEERING
            </span>

            <img className="home-portrait" src={profile.portraitUrl || "/images/MEE.png"} alt={profile.name || "Erudita Zilbeari"} width="768" height="1024" loading="eager" decoding="async" fetchPriority="high" />

            <div className="home-mobile-badges" aria-hidden="true">
              <span className="home-mobile-badge home-mobile-badge--code">
  <Code2 size={13} />
  <b>Clean Engineering</b>
  <small>Scalable · Maintainable</small>
</span>

<span className="home-mobile-badge home-mobile-badge--stack">
  <Globe2 size={13} />
  <b>Full-Stack</b>
  <small>Web · Mobile · APIs</small>
</span>

<span className="home-mobile-badge home-mobile-badge--design">
  <Rocket size={13} />
  <b>Product Focused</b>
  <small>Intuitive · Performance-led</small>
</span>
            </div>

            <article className="home-code-card" aria-label="Developer code preview">
              <div className="home-code-card__bar">
                <span>
                  <i />
                  <i />
                </span>
                <strong>ERUDITA.ZILBEARI</strong>
              </div>
              <pre>{`const developer = {
  name: "Erudita Zilbeari",
  role: "Full-Stack Developer & UI Engineer",
  focus: ["Scalable Products", "Thoughtful UX", "Performance"],
  mission: "Turn ambitious ideas into products people remember."
};`}</pre>
            </article>
          </div>
        </div>


      </section>

      <Suspense fallback={null}>
        <About />
        <ExperienceSection experience={data?.experience} />
        <ProjectsIndex />
        <TechnicalProofSection data={data} />
        <AchievementsSection data={data} />
        <Contact />
      </Suspense>
    </>
  );
}
