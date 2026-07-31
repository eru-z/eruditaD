import {
  ArrowLeft,
  ArrowRight,
  Award,
  BrainCircuit,
  Building2,
  Leaf,
  Medal,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

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

const fallbackCertificates = [
  {
    title: "Science Fair - 1st Place",
    issuer: "Information Technology",
    image: "/images/certificates/science-fair.jpg",
  },
  {
    title: "SpringCodeFest - 1st Place",
    issuer: "Coding Competition",
    image: "/images/certificates/spring-code-fest.jpg",
  },
  {
    title: "JunctionX Tirana 2026",
    issuer: "Certificate of Participation",
    image: "/images/certificates/junctionx-tirana.jpg",
  },
  {
    title: "Backend Developer - 3rd Place",
    issuer: "PHP & MySQL",
    image: "/images/certificates/backend-developer.jpg",
  },
  {
    title: "Summer School",
    issuer: "Certificate of Completion",
    image: "/images/certificates/summer-school.jpg",
  },
];


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


  const certificates = useMemo(
    () => Array.isArray(data?.achievements?.certificates) ? data.achievements.certificates.filter((item) => item?.published !== false) : fallbackCertificates,
    [data],
  );const [activeCertificate, setActiveCertificate] = useState(
    Math.min(2, certificates.length - 1),
  );

  const moveCertificate = (direction) => {
    setActiveCertificate((current) => {
      const next = current + direction;

      if (next < 0) return certificates.length - 1;
      if (next >= certificates.length) return 0;

      return next;
    });
  };

  const getCertificatePosition = (index) => {
    const total = certificates.length;
    let offset = index - activeCertificate;

    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;

    return offset;
  };

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
              Titles, certificates, clients, and technologies that represent my
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


        <section className="certificates-showcase ep-achievement-glass">
          <div className="achievement-panel-heading certificate-heading">
            <div className="achievement-heading-copy">
              <span className="achievement-heading-icon">
                <Medal size={16} />
              </span>

              <div>
                <h3>Certificates</h3>
                <p>Horizontal previews of my awards and course certificates.</p>
              </div>
            </div>

          </div>

          <div className="certificate-stage">
            <button
              className="certificate-arrow certificate-arrow-left"
              type="button"
              aria-label="Previous certificate"
              onClick={() => moveCertificate(-1)}
            >
              <ArrowLeft size={16} />
            </button>

            <div className="certificate-track">
              {certificates.map((certificate, index) => {
                const position = getCertificatePosition(index);
                const isVisible = Math.abs(position) <= 2;

                return (
                  <button
                    className={`certificate-card ${
                      position === 0 ? "is-active" : ""
                    } ${isVisible ? "is-visible" : "is-hidden"}`}
                    style={{
                      "--certificate-position": position,
                      "--certificate-distance": Math.abs(position),
                    }}
                    type="button"
                    key={`${certificate.title}-${index}`}
                    onClick={() => setActiveCertificate(index)}
                    aria-label={`Show ${certificate.title}`}
                  >
                    <span className="certificate-image-frame">
                      <img
                        src={certificate.image}
                        alt={certificate.title}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                          event.currentTarget
                            .closest(".certificate-image-frame")
                            ?.classList.add("certificate-image-missing");
                        }}
                      />

                      <span className="certificate-placeholder">
                        <Award size={22} />
                        <small>Certificate</small>
                        <strong>{certificate.title}</strong>
                        <em>{certificate.issuer}</em>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              className="certificate-arrow certificate-arrow-right"
              type="button"
              aria-label="Next certificate"
              onClick={() => moveCertificate(1)}
            >
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="certificate-dots" aria-label="Certificate selection">
            {certificates.map((certificate, index) => (
              <button
                type="button"
                className={index === activeCertificate ? "is-active" : ""}
                aria-label={`Open ${certificate.title}`}
                onClick={() => setActiveCertificate(index)}
                key={`${certificate.title}-dot`}
              />
            ))}
          </div>
        </section>


      </div>
    </SectionShell>
  );
}
