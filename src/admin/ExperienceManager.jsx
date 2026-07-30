import { useState } from "react";
import { ArrowDown, ArrowUp, Image as ImageIcon, Plus, Pencil, Trash2, GraduationCap, Upload } from "lucide-react";
import { uploadMediaFiles, useData } from "../utils/storage.js";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Modal from "../components/ui/Modal.jsx";
import Badge from "../components/ui/Badge.jsx";

const empty = { id: "", role: "", company: "", period: "", description: "", imageUrl: "" };

export default function ExperienceManager() {
  const [data, update] = useData();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [confirm, setConfirm] = useState(null);
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);

  const open = (e) => {
    setEditing(e ? e.id : "new");
    setForm(e ? { ...e } : { ...empty, id: "e_" + Date.now() });
    setStatus("");
  };
  const close = () => {
    setEditing(null);
    setStatus("");
  };

  const save = (ev) => {
    ev?.preventDefault();
    update((d) => {
      const exists = d.experience.find((x) => x.id === form.id);
      const experience = exists
        ? d.experience.map((x) => (x.id === form.id ? form : x))
        : [...d.experience, form];
      return { ...d, experience };
    });
    close();
  };

  const remove = (id) => {
    update((d) => ({ ...d, experience: d.experience.filter((x) => x.id !== id) }));
    setConfirm(null);
  };

  const move = (index, direction) => {
    update((d) => {
      const experience = [...(d.experience || [])];
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= experience.length) return d;
      const [item] = experience.splice(index, 1);
      experience.splice(nextIndex, 0, item);
      return { ...d, experience };
    });
  };

  const uploadImage = async (files) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    setStatus("");
    try {
      const [uploaded] = await uploadMediaFiles([file]);
      setForm((current) => ({ ...current, imageUrl: uploaded.url }));
      setStatus("Image uploaded. Save the entry to publish it.");
    } catch (error) {
      setStatus(error.message || "Could not upload image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Experience</h2>
          <p className="text-sm text-neutral-500">Your career timeline.</p>
        </div>
        <Button onClick={() => open(null)}><Plus size={16}/> Add experience</Button>
      </div>

      <div className="space-y-3">
        {data.experience.length === 0 && (
          <Card className="p-12 text-center text-neutral-500"><GraduationCap className="mx-auto mb-3" size={26}/>No experience yet.</Card>
        )}
        {data.experience.map((e, index) => (
          <Card key={e.id} className="flex flex-wrap items-start justify-between gap-3 p-6">
            {e.imageUrl && (
              <img src={e.imageUrl} alt="" className="h-24 w-36 rounded-2xl object-cover ring-1 ring-black/10" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-lg font-semibold">{e.role}</h3>
                <Badge>{e.period}</Badge>
              </div>
              <div className="text-sm text-neutral-500">{e.company}</div>
              <p className="mt-2 text-sm text-neutral-700">{e.description}</p>
            </div>
            <div className="flex gap-1">
              <button disabled={index === 0} onClick={() => move(index, -1)} className="rounded-lg p-2 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-35" title="Move up" aria-label="Move up"><ArrowUp size={15}/></button>
              <button disabled={index === data.experience.length - 1} onClick={() => move(index, 1)} className="rounded-lg p-2 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-35" title="Move down" aria-label="Move down"><ArrowDown size={15}/></button>
              <button onClick={() => open(e)} className="rounded-lg p-2 hover:bg-neutral-100"><Pencil size={15}/></button>
              <button onClick={() => setConfirm(e)} className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={15}/></button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!editing} onClose={close} title={editing === "new" ? "Add experience" : "Edit experience"} size="lg"
        footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button onClick={save} disabled={uploading}>{uploading ? "Uploading..." : "Save"}</Button></>}>
        <form className="space-y-4" onSubmit={save}>
          <Field label="Role" value={form.role} onChange={(v) => setForm({ ...form, role: v })} />
          <Field label="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
          <Field label="Period" value={form.period} onChange={(v) => setForm({ ...form, period: v })} />
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Experience image</label>
            <div className="mt-1 rounded-2xl border border-black/10 bg-white p-3">
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="" className="mb-3 h-40 w-full rounded-xl object-cover" />
              ) : (
                <div className="mb-3 grid h-32 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <ImageIcon size={28} />
                </div>
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-bold text-white">
                <Upload size={15} />
                {uploading ? "Uploading..." : "Choose image"}
                <input type="file" accept="image/*" hidden disabled={uploading} onChange={(event) => uploadImage(event.target.files)} />
              </label>
              {form.imageUrl && (
                <button type="button" onClick={() => setForm({ ...form, imageUrl: "" })} className="ml-2 rounded-full border border-black/10 px-4 py-2 text-sm font-bold text-slate-700">
                  Remove
                </button>
              )}
            </div>
            {status && <p className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">{status}</p>}
          </div>
          <Field label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea />
        </form>
      </Modal>

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Delete entry?"
        footer={<><Button variant="secondary" onClick={() => setConfirm(null)}>Cancel</Button><Button variant="danger" onClick={() => remove(confirm.id)}>Delete</Button></>}>
        <p className="text-sm text-neutral-600">Delete <strong>{confirm?.role}</strong> at <strong>{confirm?.company}</strong>?</p>
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
