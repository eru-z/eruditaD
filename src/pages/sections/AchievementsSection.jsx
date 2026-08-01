import {
  Award,
  BrainCircuit,
  Building2,
  Leaf,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { useMemo } from "react";

import SectionShell from "./SectionShell.jsx";
import "./achievements-section.css";

const fallbackRecognitions = [
  {
    title: "SciMaster AI",
    subtitle: "1st Place - Science Fair - Information Technology",
    description:
      "AI-powered learning platform recognized for product thinking, technical execution, and practical education impact.",
  },
  {
    title: "SpringCodeFest",
    subtitle: "1st Place",
    description:
      "Competition-winning solution built under time pressure with clear UI, code quality, and focused execution.",
  },
  {
    title: "Summer Code Fest - Green Travel Guide",
    subtitle: "3rd Place",
    description:
      "Sustainable travel concept combining product strategy, design, and fast technical prototyping.",
  },
  {
    title: "Eco Innovation Project",
    subtitle: "3rd Place",
    description:
      "Technology concept focused on environmental awareness, usability, and practical digital communication.",
  },
  {
    title: "JunctionX Tirana",
    subtitle: "Two-Time Hackathon Participant",
    description:
      "International hackathon participation delivering working concepts with teams, mentors, and tight deadlines.",
  },
  {
    title: "Smart Tetova",
    subtitle: "Municipal Technology Competition",
    description:
      "Local innovation competition exploring civic technology, digital services, and community impact.",
  },
  {
    title: "MindFlow OS",
    subtitle: "Champion Trials",
    description:
      "Productivity and focus-system concept shaped around digital wellbeing, intelligent flows, and polished UX.",
  },
];

const recognitionIconMap = {
  ai: BrainCircuit,
  first: Trophy,
  third: Medal,
  eco: Leaf,
  hackathon: Zap,
  municipal: Building2,
  default: Award,
};

function getRecognitionMeta(item, index) {
  const text = `${item?.title || ""} ${item?.subtitle || ""}`.toLowerCase();

  if (text.includes("scimaster") || text.includes("science fair")) {
    return {
      icon: recognitionIconMap.ai,
      label: "Featured achievement",
      tone: "featured",
      rank: "01",
    };
  }

  if (text.includes("springcodefest") || text.includes("1st place")) {
    return {
      icon: recognitionIconMap.first,
      label: "1st place",
      tone: "winner",
      rank: String(index + 1).padStart(2, "0"),
    };
  }

  if (text.includes("summer code") || text.includes("green travel")) {
    return {
      icon: recognitionIconMap.eco,
      label: "3rd place - 48h",
      tone: "podium",
      rank: String(index + 1).padStart(2, "0"),
    };
  }

  if (text.includes("eco") || text.includes("europe house")) {
    return {
      icon: recognitionIconMap.third,
      label: "3rd place",
      tone: "podium",
      rank: String(index + 1).padStart(2, "0"),
    };
  }

  if (text.includes("junction")) {
    return {
      icon: recognitionIconMap.hackathon,
      label: "2x international hackathon",
      tone: "hackathon",
      rank: String(index + 1).padStart(2, "0"),
    };
  }

  if (
    text.includes("tetova") ||
    text.includes("municipal") ||
    text.includes("smart city")
  ) {
    return {
      icon: recognitionIconMap.municipal,
      label: "Municipal innovation",
      tone: "municipal",
      rank: String(index + 1).padStart(2, "0"),
    };
  }

  return {
    icon: recognitionIconMap.default,
    label: "Recognition",
    tone: "default",
    rank: String(index + 1).padStart(2, "0"),
  };
}

function sortRecognitions(items) {
  return [...items].sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0));
}

export default function AchievementsSection({ data = {} }) {
  const recognitions = useMemo(
    () => {
      const adminRecognitions = Array.isArray(data?.achievements?.recognitions)
        ? data.achievements.recognitions.filter((item) => item?.published !== false)
        : [];

      return sortRecognitions(Array.isArray(data?.achievements?.recognitions) ? adminRecognitions : fallbackRecognitions);
    },
    [data],
  );


  return (
    <SectionShell
      id="achievements"
      className="achievements-section"
      eyebrow={null}
      title={null}
    >
      <div className="achievements-shell">
        <header className="achievements-intro achievements-intro-wide">
          <span className="achievements-kicker">
            <Sparkles size={13} />
            Achievements
          </span>

          <div className="achievements-intro-row">
            <h2>
              Recognitions that <em>reflect</em> my journey.
            </h2>

            <p>
              Competition wins and milestones that represent my
              experience building polished digital products.
            </p>
          </div>
        </header>

        <section className="achievements-recognition ep-achievement-glass">
          <div className="achievement-panel-heading recognition-panel-heading">
            <div className="achievement-heading-copy">
              <span className="achievement-heading-icon">
                <Award size={16} />
              </span>

              <div>
                <h3>Titles &amp; Recognition</h3>
                <p>
                  Competition wins, international hackathons, and selected
                  innovation milestones.
                </p>
              </div>
            </div>

            <span className="recognition-count">
              {String(recognitions.length).padStart(2, "0")} milestones
            </span>
          </div>

          <div className="recognition-grid recognition-grid-editorial">
            {recognitions.map((item, index) => {
              const meta = getRecognitionMeta(item, index);
              const Icon = meta.icon;
              const isFeatured = meta.tone === "featured";

              return (
                <article
                  className={`recognition-item recognition-item-${meta.tone} ${
                    isFeatured ? "recognition-item-featured" : ""
                  }`}
                  key={`${item.title}-${index}`}
                >
                  <div className="recognition-card-topline">
                    <span className="recognition-status">
                      <Icon size={15} />
                      {meta.label}
                    </span>

                    <span className="recognition-index" aria-hidden="true">
                      {meta.rank}
                    </span>
                  </div>

                  <div className="recognition-copy">
                    <h4>{item.title}</h4>
                    <strong>{item.subtitle}</strong>
                    {String(Array.isArray(item.tags) ? item.tags.join(",") : item.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean).length > 0 && (
                      <div className="recognition-tags" aria-label="Achievement tags">
                        {String(Array.isArray(item.tags) ? item.tags.join(",") : item.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean).map((tag) => <span key={tag}>{tag}</span>)}
                      </div>
                    )}
                    <p>{item.description}</p>
                  </div>

                  <div className="recognition-card-footer" aria-hidden="true">
                    <span />
                    <Sparkles size={14} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>





      </div>
    </SectionShell>
  );
}
