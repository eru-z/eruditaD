import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, CheckCircle2, Code2, Globe2, LayoutDashboard } from "lucide-react";

import SectionShell from "./SectionShell.jsx";

const caseStudyTabs = [
  {
    id: "problem",
    label: "Problem",
    text: "A restaurant website has to turn visitor interest into clear action: browse the offer, understand the business, and start contact without friction.",
  },
  {
    id: "architecture",
    label: "Architecture",
    text: "The public website, contact flow, reusable React sections, project data, and admin-managed content stay separated so the experience can grow without redesigning every section.",
  },
  {
    id: "decisions",
    label: "Decisions",
    text: "The project uses compact React components, responsive media, clear calls to action, and structured project fields so the portfolio can present the work consistently.",
  },
  {
    id: "challenge",
    label: "Challenge",
    text: "The hard part is balancing polished visuals with practical conversion: project media must stay dominant while forms, links, and content remain fast and usable.",
  },
  {
    id: "solution",
    label: "Solution",
    text: "I built a focused interface with responsive cards, reusable sections, contact handling, backend-managed project data, and media-ready portfolio presentation.",
  },
  {
    id: "outcome",
    label: "Outcome",
    text: "The result is a complete portfolio project entry with public presentation, live project linking when available, and admin-editable content for ongoing updates.",
  },
];

const architectureSteps = [
  { label: "Customer Website", icon: Globe2 },
  { label: "Contact Flow", icon: ArrowRight },
  { label: "Application Logic", icon: Code2 },
  { label: "Admin Content", icon: LayoutDashboard },
  { label: "Client Workflow", icon: CheckCircle2 },
];

export default function EngineeringCaseStudy({ projects = [] }) {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState("problem");
  const project =
    projects.find((item) => /pizzeria/i.test(item.title || "")) ||
    projects.find((item) => item.featured) ||
    projects[0];

  if (!project) return null;

  const tab = caseStudyTabs.find((item) => item.id === active) || caseStudyTabs[0];
  const tech = project.tech?.length ? project.tech : project.tags || [];

  return (
    <SectionShell id="case-study" eyebrow="Engineering Case Study" title="Pizzeria Paradiso">
      <div className="ep-case-grid">
        <article className="ep-glass ep-case-summary">
          <span className="ep-kicker">Selected Build</span>
          <h3>{project.title}</h3>
          <p>{project.description}</p>
          <dl>
            <div><dt>Role</dt><dd>Full-stack web development and interface design</dd></div>
            <div><dt>Type</dt><dd>{project.category || project.type}</dd></div>
            <div><dt>Status</dt><dd>{project.status}</dd></div>
          </dl>
          <div className="ep-badges">
            {tech.slice(0, 6).map((item) => <span key={item}>{item}</span>)}
          </div>
          <div className="ep-actions">
            {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer">View Live Project <ArrowUpRight size={13} /></a>}
            {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noreferrer">View GitHub <ArrowUpRight size={13} /></a>}
            {project.caseStudyUrl && <a href={project.caseStudyUrl}>View Full Case Study <ArrowRight size={13} /></a>}
          </div>
        </article>

        <article className="ep-glass ep-tabs-card">
          <CaseStudyTabs tabs={caseStudyTabs} active={active} onChange={setActive} />

          <motion.div
            key={tab.id}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="ep-tab-panel"
            role="tabpanel"
          >
            <h3>{tab.label}</h3>
            <p>{tab.text}</p>
          </motion.div>

          <ArchitectureFlow steps={architectureSteps} />
        </article>
      </div>
    </SectionShell>
  );
}

function CaseStudyTabs({ tabs, active, onChange }) {
  return (
    <div className="ep-tabs" role="tablist" aria-label="Case study details">
      {tabs.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={active === item.id}
          className={active === item.id ? "active" : ""}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function ArchitectureFlow({ steps }) {
  return (
    <div className="ep-flow" aria-label="Architecture flow">
      {steps.map(({ label, icon: Icon }, index) => (
        <div className="ep-flow-item" key={label}>
          <span><Icon size={15} /></span>
          <strong>{label}</strong>
          {index < steps.length - 1 && <i aria-hidden="true" />}
        </div>
      ))}
    </div>
  );
}
