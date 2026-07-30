import { useEffect, useState } from "react";
import { Save, Check } from "lucide-react";
import { useData } from "../utils/storage.js";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";

export default function ContactManager() {
  const [data, update] = useData();
  const [form, setForm] = useState(data.contact);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm(data.contact); }, [data.contact]);

  const save = (e) => {
    e.preventDefault();
    update((d) => ({ ...d, contact: form }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const set = (k, v) => setForm({ ...form, [k]: v });

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Contact</h2>
          <p className="text-sm text-neutral-500">How people can reach you.</p>
        </div>
        <Button type="submit">{saved ? <><Check size={16}/> Saved</> : <><Save size={16}/> Save</>}</Button>
      </div>

      <Card className="grid gap-5 p-6 md:grid-cols-2">
        <Field label="Email" value={form.email} onChange={(v) => set("email", v)} />
        <Field label="Phone" value={form.phone} onChange={(v) => set("phone", v)} />
        <Field label="Location" value={form.location} onChange={(v) => set("location", v)} />
        <Field label="Availability" value={form.availability} onChange={(v) => set("availability", v)} />
      </Card>
    </form>
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
