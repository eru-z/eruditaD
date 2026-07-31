import { useState, useEffect } from "react";
import { Save, Check } from "lucide-react";
import { useData } from "../utils/storage.js";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";

function Field({ label, value, onChange, type = "text", textarea = false }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{label}</label>
      {textarea ? (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black"
        />
      ) : (
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-black"
        />
      )}
    </div>
  );
}

export default function ProfileManager() {
  const [data, update] = useData();
  const [form, setForm] = useState(data.profile);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm(data.profile); }, [data.profile]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setStat = (i, k, v) => setForm((f) => {
    const stats = [...f.stats];
    stats[i] = { ...stats[i], [k]: v };
    return { ...f, stats };
  });
  const setSocial = (k, v) => setForm((f) => ({ ...f, socials: { ...f.socials, [k]: v } }));

  const save = (e) => {
    e?.preventDefault();
    update((d) => ({ ...d, profile: form }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold">Profile</h2>
        <Button type="submit">{saved ? <><Check size={16}/> Saved</> : <><Save size={16}/> Save changes</>}</Button>
      </div>

      <Card className="grid gap-5 p-6 md:grid-cols-2">
        <Field label="Name" value={form.name} onChange={(v) => setField("name", v)} />
        <Field label="Role" value={form.role} onChange={(v) => setField("role", v)} />
        <Field label="Location" value={form.location} onChange={(v) => setField("location", v)} />
        <Field label="Email" value={form.email} onChange={(v) => setField("email", v)} />
        <Field label="Phone" value={form.phone} onChange={(v) => setField("phone", v)} />
        <Field label="Portrait URL" value={form.portraitUrl} onChange={(v) => setField("portraitUrl", v)} />
        <div className="md:col-span-2">
          <Field label="Headline" value={form.headline} onChange={(v) => setField("headline", v)} textarea />
        </div>
        <div className="md:col-span-2">
          <Field label="About" value={form.about} onChange={(v) => setField("about", v)} textarea />
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-display text-lg font-semibold">Hero stats</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {form.stats.map((s, i) => (
            <div key={i} className="space-y-2">
              <Field label="Value" value={s.value} onChange={(v) => setStat(i, "value", v)} />
              <Field label="Label" value={s.label} onChange={(v) => setStat(i, "label", v)} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-display text-lg font-semibold">Socials</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Field label="LinkedIn" value={form.socials?.linkedin} onChange={(v) => setSocial("linkedin", v)} />
        </div>
      </Card>
    </form>
  );
}
