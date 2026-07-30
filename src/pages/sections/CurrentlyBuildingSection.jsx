import SectionShell from "./SectionShell.jsx";

const currentlyBuilding = null;

export default function CurrentlyBuildingSection() {
  if (!currentlyBuilding) return null;

  return (
    <SectionShell id="currently-building" title="Currently Building">
      <article className="ep-glass ep-current-card">
        <span className="ep-status-dot" />
        <h3>{currentlyBuilding.name}</h3>
      </article>
    </SectionShell>
  );
}
