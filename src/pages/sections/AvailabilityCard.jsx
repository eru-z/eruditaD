import { ArrowRight, ArrowUpRight } from "lucide-react";

export default function AvailabilityCard({ contact = {} }) {
  const email = contact.email || "hello@erudita.pro";

  return (
    <article className="ep-glass ep-availability-card" aria-label="Availability">
      <span className="ep-status-dot" />
      <div>
        <h3>Available for selected work</h3>
        <p>Open to freelance projects, junior software-engineering opportunities, agency collaboration, and technical hackathon work.</p>
      </div>
      <div className="ep-actions">
        <a href="#contact">Start a Project <ArrowRight size={13} /></a>
        <a href={`mailto:${email}`}>Email Me <ArrowUpRight size={13} /></a>
        <a href="/resume.pdf">View Resume <ArrowUpRight size={13} /></a>
      </div>
    </article>
  );
}
