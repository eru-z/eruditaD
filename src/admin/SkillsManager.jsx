import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ImageIcon, Pencil, Plus, Sparkles, Trash2, Upload } from "lucide-react";
import { savePortfolioData, uploadMediaFiles, useData } from "../utils/storage.js";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Modal from "../components/ui/Modal.jsx";
import Badge from "../components/ui/Badge.jsx";

const categories = ["Frontend", "Mobile", "Backend", "Databases", "Tools & Others"];
const allowedSkills = ["React.js", "Node.js", "Python", "HTML", "CSS", "JS", "WordPress", "Bootstrap", "git/GitHub", "Expo", "Vercel", "Hosting/Domains", "Supabase", "React Native", "Tailwind", "PHP", "PostgreSQL", "MySQL"];
const skillCategories = {
  "React.js": "Frontend", HTML: "Frontend", CSS: "Frontend", JS: "Frontend", WordPress: "Frontend", Bootstrap: "Frontend", Tailwind: "Frontend",
  "React Native": "Mobile", Expo: "Tools & Others", "Node.js": "Backend", Python: "Backend", PHP: "Backend",
  PostgreSQL: "Databases", MySQL: "Databases", "git/GitHub": "Tools & Others", Vercel: "Tools & Others", "Hosting/Domains": "Tools & Others", Supabase: "Tools & Others",
};
const skillAliases = { "React JS": "React.js", JavaScript: "JS", "Tailwind CSS": "Tailwind", Git: "git/GitHub", GitHub: "git/GitHub", Hosting: "Hosting/Domains" };
const empty = { id: "", name: "", level: 80, group: "Frontend", logo: "", published: true };
const uid = () => `skill-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;

export default function SkillsManager() {
  const [data] = useData();
  const [skills, setSkills] = useState(() => normalizeSkills(data?.skills));
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => setSkills(normalizeSkills(data?.skills)), [data?.skills]);

  const grouped = useMemo(() => {
    const result = new Map();
    skills.filter((skill) => categoryFilter === "All" || skill.group === categoryFilter).forEach((skill) => {
      const group = skill.group || "Tools & Others";
      if (!result.has(group)) result.set(group, []);
      result.get(group).push(skill);
    });
    return [...result.entries()];
  }, [categoryFilter, skills]);

  function open(skill) {
    setEditing(skill?.id || "new");
    setForm(skill ? { ...skill } : { ...empty, id: uid() });
    setStatus("");
  }

  async function persist(next, message) {
    const previous = skills;
    const ordered = next.map((skill, order) => ({ ...skill, order }));
    setSkills(ordered);
    setSaving(true);
    setStatus("");
    try {
      const saved = await savePortfolioData({ ...data, skills: ordered });
      setSkills(normalizeSkills(saved.skills));
      setStatus(message);
      return true;
    } catch (error) {
      setSkills(previous);
      setStatus(error.message || "Could not save skills.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function save(event) {
    event?.preventDefault();
    const name = String(form.name || "").trim();
    const group = String(form.group || "").trim();
    if (!name || !group) return setStatus("Skill name and category are required.");
    if (!allowedSkills.includes(name)) return setStatus("Choose a skill from the approved technology list.");
    const duplicate = skills.some((skill) => skill.id !== form.id && skill.name.toLowerCase() === name.toLowerCase());
    if (duplicate) return setStatus("A skill with this name already exists.");
    const item = { ...form, name, group, level: Math.max(0, Math.min(100, Number(form.level) || 0)), published: form.published !== false };
    const exists = skills.some((skill) => skill.id === item.id);
    const ok = await persist(exists ? skills.map((skill) => skill.id === item.id ? item : skill) : [...skills, item], exists ? "Skill updated on the live portfolio." : "Skill added to the live portfolio.");
    if (ok) setEditing(null);
  }

  async function remove() {
    if (!confirm) return;
    const ok = await persist(skills.filter((skill) => skill.id !== confirm.id), "Skill removed from the live portfolio.");
    if (ok) setConfirm(null);
  }

  async function move(skill, direction) {
    const index = skills.findIndex((item) => item.id === skill.id);
    const sameGroup = skills.map((item, itemIndex) => ({ item, itemIndex })).filter(({ item }) => item.group === skill.group);
    const position = sameGroup.findIndex(({ item }) => item.id === skill.id);
    const target = sameGroup[position + direction]?.itemIndex;
    if (index < 0 || target === undefined) return;
    const next = [...skills];
    [next[index], next[target]] = [next[target], next[index]];
    await persist(next, "Skill order updated on the live portfolio.");
  }

  async function moveGroup(group, direction) {
    const groupNames = grouped.map(([name]) => name);
    const index = groupNames.indexOf(group);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= groupNames.length) return;
    [groupNames[index], groupNames[target]] = [groupNames[target], groupNames[index]];
    const next = groupNames.flatMap((name) => skills.filter((skill) => skill.group === name));
    await persist(next, "Category order updated on the live portfolio.");
  }
  async function uploadLogo(files) {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setStatus("Skill logos must be image files.");
    setUploading(true);
    setStatus("");
    try {
      const [uploaded] = await uploadMediaFiles([file]);
      if (uploaded) setForm((current) => ({ ...current, logo: uploaded.url }));
    } catch (error) {
      setStatus(error.message || "Could not upload the skill logo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-display text-2xl font-semibold">Skills</h2><p className="text-sm text-neutral-500">Manage the live Technical Proof section by category and saved order.</p></div>
        <div className="flex items-center gap-2"><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold" aria-label="Filter skills by category"><option value="All">All categories</option>{categories.map((category) => <option value={category} key={category}>{category}</option>)}</select><Button onClick={() => open(null)}><Plus size={16}/> Add skill</Button></div>
      </div>
      {status && <p role="status" className={`rounded-xl px-3 py-2 text-sm font-semibold ${/could not|required|exists|must/i.test(status) ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>{status}</p>}

      {!grouped.length ? <Card className="flex flex-col items-center gap-3 p-12 text-center text-neutral-500"><Sparkles size={28}/><p>No skills yet. Add your first skill.</p></Card> : grouped.map(([group, items]) => (
        <Card className="p-5" key={group}>
          <div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-2"><h3 className="font-display text-lg font-semibold">{group}</h3><Badge>{items.length} skills</Badge></div><div className="flex gap-1"><button disabled={saving || grouped[0]?.[0] === group} onClick={() => moveGroup(group, -1)} className="rounded-lg p-2 hover:bg-neutral-100 disabled:opacity-30" aria-label={`Move ${group} category earlier`}><ArrowUp size={15}/></button><button disabled={saving || grouped[grouped.length - 1]?.[0] === group} onClick={() => moveGroup(group, 1)} className="rounded-lg p-2 hover:bg-neutral-100 disabled:opacity-30" aria-label={`Move ${group} category later`}><ArrowDown size={15}/></button></div></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((skill, index) => (
              <article key={skill.id} className="rounded-xl border border-black/5 bg-white/70 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-white">{skill.logo ? <img src={skill.logo} alt={`${skill.name} logo`} className="h-8 w-8 object-contain"/> : <ImageIcon size={19} className="text-slate-400"/>}</span>
                  <div className="min-w-0 flex-1"><strong className="block truncate">{skill.name}</strong><span className="text-xs text-neutral-500">{skill.published ? "Live" : "Hidden"} - {skill.level}%</span></div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${skill.level}%` }}/></div>
                <div className="mt-3 flex justify-end gap-1">
                  <button disabled={saving || index === 0} onClick={() => move(skill, -1)} className="rounded-lg p-2 hover:bg-neutral-100 disabled:opacity-30" aria-label={`Move ${skill.name} earlier`}><ArrowUp size={14}/></button>
                  <button disabled={saving || index === items.length - 1} onClick={() => move(skill, 1)} className="rounded-lg p-2 hover:bg-neutral-100 disabled:opacity-30" aria-label={`Move ${skill.name} later`}><ArrowDown size={14}/></button>
                  <button onClick={() => open(skill)} className="rounded-lg p-2 hover:bg-neutral-100" aria-label={`Edit ${skill.name}`}><Pencil size={14}/></button>
                  <button onClick={() => setConfirm(skill)} className="rounded-lg p-2 text-red-600 hover:bg-red-50" aria-label={`Delete ${skill.name}`}><Trash2 size={14}/></button>
                </div>
              </article>
            ))}
          </div>
        </Card>
      ))}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === "new" ? "Add skill" : "Edit skill"} footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button disabled={saving || uploading} onClick={save}>{saving ? "Saving..." : "Save skill"}</Button></>}>
        <form className="space-y-4" onSubmit={save}>
          <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Technology</span><select value={form.name} onChange={(event) => { const name = event.target.value; setForm({ ...form, name, group: skillCategories[name] || form.group }); }} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black"><option value="">Select a technology</option>{allowedSkills.map((name) => <option key={name} value={name} disabled={skills.some((skill) => skill.name === name && skill.id !== form.id)}>{name}</option>)}</select></label>
          <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Category</span><input list="skill-categories" value={form.group} onChange={(event) => setForm({ ...form, group: event.target.value })} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black"/><datalist id="skill-categories">{categories.map((category) => <option value={category} key={category}/>)}</datalist></label>
          <div><label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Level: {form.level}%</label><input type="range" min="0" max="100" value={form.level} onChange={(event) => setForm({ ...form, level: Number(event.target.value) })} className="mt-2 w-full"/></div>
          <Field label="Logo URL" value={form.logo} onChange={(value) => setForm({ ...form, logo: value })}/>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50 p-4 text-sm font-bold text-blue-700"><Upload size={16}/>{uploading ? "Uploading..." : "Upload logo image"}<input hidden type="file" accept="image/*" disabled={uploading} onChange={(event) => uploadLogo(event.target.files)}/></label>
          {form.logo && <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><img src={form.logo} alt="Skill logo preview" className="h-12 w-12 object-contain"/><button type="button" onClick={() => setForm({ ...form, logo: "" })} className="text-xs font-bold text-red-600">Remove logo</button></div>}
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.published !== false} onChange={(event) => setForm({ ...form, published: event.target.checked })} className="h-4 w-4 accent-blue-600"/> Show on live portfolio</label>
        </form>
      </Modal>

      <Modal open={Boolean(confirm)} onClose={() => setConfirm(null)} title="Delete skill?" footer={<><Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button><Button variant="danger" disabled={saving} onClick={remove}>{saving ? "Deleting..." : "Delete"}</Button></>}><p className="text-sm text-neutral-600">Remove <strong>{confirm?.name}</strong> from the live Technical Proof section?</p></Modal>
    </div>
  );
}

function normalizeSkills(items) {
  return (Array.isArray(items) ? items : []).map((skill, order) => ({ ...empty, ...skill, name: skillAliases[skill.name] || skill.name, id: skill.id || `skill-${String(skill.name || "item").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${order}`, group: skill.group || skill.category || "Tools & Others", logo: skill.logo || skill.image || "", published: skill.published !== false, order }));
}

function Field({ label, value, onChange }) {
  return <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</span><input value={value || ""} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black"/></label>;
}