import { useState } from "react";
import { Plus, Pencil, Trash2, Wrench } from "lucide-react";
import { useData } from "../utils/storage.js";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Modal from "../components/ui/Modal.jsx";

const empty = { id: "", title: "", description: "", icon: "Code2" };
const ICONS = ["Code2", "Smartphone", "Palette", "Server", "Sparkles"];

export default function ServicesManager() {
  const [data, update] = useData();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [confirm, setConfirm] = useState(null);

  const open = (s) => {
    setEditing(s ? s.id : "new");
    setForm(s ? { ...s } : { ...empty, id: "s_" + Date.now() });
  };
  const close = () => setEditing(null);

  const save = (e) => {
    e?.preventDefault();
    update((d) => {
      const exists = d.services.find((s) => s.id === form.id);
      const services = exists
        ? d.services.map((s) => (s.id === form.id ? form : s))
        : [...d.services, form];
      return { ...d, services };
    });
    close();
  };

  const remove = (id) => {
    update((d) => ({ ...d, services: d.services.filter((s) => s.id !== id) }));
    setConfirm(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Services</h2>
          <p className="text-sm text-neutral-500">Showcase what you offer to clients.</p>
        </div>
        <Button onClick={() => open(null)}><Plus size={16}/> Add service</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {data.services.length === 0 && (
          <Card className="col-span-full p-12 text-center text-neutral-500">
            <Wrench className="mx-auto mb-3" size={26} />
            No services yet.
          </Card>
        )}
        {data.services.map((s) => (
          <Card key={s.id} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-neutral-600">{s.description}</p>
                <div className="mt-2 text-xs text-neutral-400">Icon: {s.icon}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => open(s)} className="rounded-lg p-2 hover:bg-neutral-100"><Pencil size={15}/></button>
                <button onClick={() => setConfirm(s)} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={15}/></button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!editing} onClose={close} title={editing === "new" ? "Add service" : "Edit service"}
        footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        <form className="space-y-4" onSubmit={save}>
          <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
          <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea />
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Icon</label>
            <select value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}
              className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black">
              {ICONS.map((i) => <option key={i}>{i}</option>)}
            </select>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete service?"
        footer={<><Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button><Button variant="danger" onClick={() => remove(confirm.id)}>Delete</Button></>}>
        <p className="text-sm text-neutral-600">Delete <strong>{confirm?.title}</strong>?</p>
      </Modal>
    </div>
  );
}

function Field({ label, value, onChange, textarea = false }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</label>
      {textarea ? (
        <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black" />
      ) : (
        <input value={value || ""} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black" />
      )}
    </div>
  );
}
