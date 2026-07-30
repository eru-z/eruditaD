import React, { Suspense, lazy } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Code2,
  Globe2,
  MapPin,
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
  { icon: UserRound, value: "2+", label: "Happy Clients" },
  { icon: Globe2, value: "3+", label: "Countries" },
  { icon: Code2, value: "48h+", label: "Concepts Delivered" },
];

const technologies = [
  { name: "React.js", logo: "https://cdn.simpleicons.org/react/61DAFB" },
  { name: "React Native", logo: "https://cdn.simpleicons.org/react/61DAFB" },
  { name: "Node.js", logo: "https://cdn.simpleicons.org/nodedotjs/5FA04E" },
  { name: "Python", logo: "https://cdn.simpleicons.org/python/3776AB" },
  { name: "MySQL", logo: "https://cdn.simpleicons.org/mysql/4479A1" },
  { name: "PHP", logo: "https://cdn.simpleicons.org/php/777BB4" },
];

const clientLogos = [
  { name: "Pizzeria Paradiso", image: "/images/logos/pizzeria-paradiso.png" },
  { name: "Pyramid Backstage", image: "/images/logos/pyramid-backstage.png" },
  { name: "Marcia Freitas", text: "MARCIA\nFREITAS", subtext: "BEAUTY ACADEMY" },
  { name: "SciMaster AI", image: "/images/logos/scimaster-ai.png" },
  { name: "Velon Development", text: "Velon", subtext: "DEVELOPMENT" },
];

const particles = Array.from({ length: 14 }, (_, index) => index);

export default function Home() {
  const [data] = useData();

  return (
    <>
      <section className="home-hero" id="home">
        <div className="home-hero__grid" aria-hidden="true" />
        <div className="home-hero__blueprint" aria-hidden="true">
          <span>41.608&deg; N</span>
          <span>21.745&deg; E</span>
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
              BUILDING DIGITAL EXPERIENCES THAT MATTER
            </div>

            <h1 className="home-title">
              <span>Engineering</span>
              <span>
                <em>digital</em> products
              </span>
              <span>
                that <strong>make impact.</strong>
              </span>
            </h1>

            <p className="home-description">
              I design and build fast, scalable and beautiful web &amp; mobile
              <br />
              applications that solve real problems and drive results.
            </p>

            <div className="home-actions">
              <a className="home-btn home-btn--primary" href="#projects">
                Explore My Work
                <ArrowUpRight size={14} strokeWidth={2.2} />
              </a>
              <a className="home-btn home-btn--secondary" href="#projects" aria-label="View projects">
                <span className="home-play-icon" aria-hidden="true">
                  <ArrowUpRight size={12} strokeWidth={2.2} />
                </span>
                View Projects
              </a>
            </div>

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
              <p>TECHNOLOGIES I WORK WITH</p>
              <div className="home-tools__dock">
                {technologies.map((tool) => (
                  <span className="home-tool" key={tool.name}>
                    <img src={tool.logo} alt="" aria-hidden="true" />
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
            <span className="home-micro home-micro--coords" aria-hidden="true">
              41.608 N / 21.745 E
            </span>
            <span className="home-micro home-micro--tag" aria-hidden="true">
              FULL-STACK / UI ENGINEERING
            </span>

            <img className="home-portrait" src="/images/MEE.png" alt="Erudita Zilbeari" />

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
  passion: "Building meaningful digital experiences",
  focus: ["Clean Code", "Great UX", "Performance"],
  mission: "Solve problems. Create impact."
};`}</pre>
            </article>
          </div>
        </div>

        <div className="home-mini-orbit" aria-hidden="true">
          <span />
          <i />
        </div>

        <div className="home-meta-pills">
          <span>
            <MapPin size={13} />
            <small>Based in</small>
            North Macedonia
          </span>
          <span>
            <Globe2 size={13} />
            <small>Available</small>
            Worldwide
          </span>
        </div>

        <a className="home-scroll" href="#about" aria-label="Scroll to About section">
          <ArrowDown size={15} />
          <span>Scroll to explore</span>
        </a>
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
