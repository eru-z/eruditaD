import { useState } from "react";
import { Plus, Trash2, Pencil, Sparkles } from "lucide-react";
import { useData } from "../utils/storage.js";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Modal from "../components/ui/Modal.jsx";
import Badge from "../components/ui/Badge.jsx";

const empty = { name: "", level: 80, group: "Frontend" };

export default function SkillsManager() {
  const [data, update] = useData();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [confirm, setConfirm] = useState(null);

  const open = (s) => {
    setEditing(s ? s.name : "new");
    setForm(s ? { ...s } : { ...empty });
  };
  const close = () => setEditing(null);

  const save = (e) => {
    e?.preventDefault();
    update((d) => {
      const exists = d.skills.find((s) => s.name === editing);
      const skills = exists
        ? d.skills.map((s) => (s.name === editing ? form : s))
        : [...d.skills, form];
      return { ...d, skills };
    });
    close();
  };

  const remove = (name) => {
    update((d) => ({ ...d, skills: d.skills.filter((s) => s.name !== name) }));
    setConfirm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Skills</h2>
          <p className="text-sm text-neutral-500">Add the tools and technologies you work with.</p>
        </div>
        <Button onClick={() => open(null)}><Plus size={16}/> Add skill</Button>
      </div>

      <Card className="p-6">
        {data.skills.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-neutral-500">
            <Sparkles size={28} /><p>No skills yet.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.skills.map((s) => (
              <div key={s.name} className="rounded-xl border border-black/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{s.name}</div>
                  <Badge>{s.group}</Badge>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full rounded-full bg-black" style={{ width: `${s.level}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                  <span>{s.level}%</span>
                  <div className="flex gap-1">
                    <button onClick={() => open(s)} className="rounded-md p-1.5 hover:bg-neutral-100"><Pencil size={14}/></button>
                    <button onClick={() => setConfirm(s)} className="rounded-md p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={14}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={!!editing} onClose={close} title={editing === "new" ? "Add skill" : "Edit skill"}
        footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        <form className="space-y-4" onSubmit={save}>
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Group" value={form.group} onChange={(v) => setForm({ ...form, group: v })} />
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Level: {form.level}%</label>
            <input type="range" min={0} max={100} value={form.level} onChange={(e) => setForm({ ...form, level: Number(e.target.value) })} className="mt-2 w-full" />
          </div>
        </form>
      </Modal>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete skill?"
        footer={<><Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button><Button variant="danger" onClick={() => remove(confirm.name)}>Delete</Button></>}>
        <p className="text-sm text-neutral-600">Remove <strong>{confirm?.name}</strong> from your skills?</p>
      </Modal>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</label>
      <input value={value || ""} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black" />
    </div>
  );
}
