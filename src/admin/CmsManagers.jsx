import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Download, FileText, Image, Plus, Save, Trash2, Upload } from "lucide-react";
import { savePortfolioData, uploadMediaFiles, useData } from "../utils/storage.js";

const panel =
  "rounded-2xl border border-white/80 bg-white/62 p-4 shadow-[0_12px_34px_rgba(30,41,59,0.055),inset_0_1px_0_rgba(255,255,255,0.96)] backdrop-blur-2xl";

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
}

function setPath(data, path, value) {
  const next = structuredClone(data || {});
  let target = next;
  path.slice(0, -1).forEach((key) => {
    target[key] = target[key] || {};
    target = target[key];
  });
  target[path[path.length - 1]] = value;
  return next;
}

function getPath(data, path, fallback) {
  return path.reduce((target, key) => target?.[key], data) ?? fallback;
}

export function CollectionManager({
  title,
  description,
  path,
  emptyText = "No entries yet.",
  createItem,
  fields,
}) {
  const [data] = useData();
  const [items, setItems] = useState(() => getPath(data, path, []));
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const pathKey = path.join(".");
  useEffect(() => setItems(getPath(data, pathKey.split("."), [])), [data, pathKey]);

  const persist = async (nextItems, message = "Saved.") => {
    setSaving(true);
    setStatus("");
    try {
      await savePortfolioData(setPath(data, path, nextItems));
      setItems(nextItems);
      setStatus(message);
    } catch (error) {
      setStatus(error.message || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  const updateItem = (id, key, value) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };

  const moveItem = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    setItems((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((item, order) => ({ ...item, order }));
    });
  };
  const uploadForItem = async (id, key, files) => {
    const file = files?.[0];
    if (!file) return;
    setSaving(true);
    setStatus("");
    try {
      const [uploaded] = await uploadMediaFiles([file]);
      const nextItems = items.map((item) => (item.id === id ? { ...item, [key]: uploaded.url } : item));
      await persist(nextItems, "File uploaded and saved.");
    } catch (error) {
      setStatus(error.message || "Could not upload file.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className={panel}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
          </div>
          <button
            type="button"
            onClick={() => setItems((current) => [createItem(), ...current])}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2563eb] px-4 text-xs font-black text-white shadow-[0_12px_26px_rgba(37,99,235,.24)]"
          >
            <Plus size={15} />
            Add
          </button>
        </div>
        {status && <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">{status}</p>}
      </section>

      {items.length ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <article className={panel} key={item.id || index}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">
                  Item {index + 1}
                </span>
                <div className="flex items-center gap-2">
                  <button type="button" disabled={index === 0} onClick={() => moveItem(index, -1)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 disabled:opacity-35" aria-label={`Move ${title} item earlier`}><ArrowUp size={14} /></button>
                  <button type="button" disabled={index === items.length - 1} onClick={() => moveItem(index, 1)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 disabled:opacity-35" aria-label={`Move ${title} item later`}><ArrowDown size={14} /></button>
                  <button type="button" onClick={() => window.confirm(`Delete this ${title.toLowerCase()} item? This updates the live portfolio.`) && persist(items.filter((entry) => entry.id !== item.id), "Deleted.")} className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-500/15 bg-red-50 px-3 text-xs font-bold text-red-600"><Trash2 size={14} />Delete</button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {fields.map((field) => (
                  <label className={field.type === "textarea" ? "md:col-span-2" : ""} key={field.key}>
                    <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{field.label}</span>
                    {field.type === "textarea" ? (
                      <textarea
                        value={item[field.key] || ""}
                        onChange={(event) => updateItem(item.id, field.key, event.target.value)}
                        rows={4}
                        className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                      />
                    ) : field.type === "checkbox" ? (
                      <input
                        type="checkbox"
                        checked={Boolean(item[field.key])}
                        onChange={(event) => updateItem(item.id, field.key, event.target.checked)}
                        className="h-5 w-5 accent-blue-600"
                      />
                    ) : field.type === "file" ? (
                      <div className="rounded-xl border border-slate-200 bg-white/70 p-3">
                        {item[field.key] && (
                          <a className="mb-3 block break-all text-xs font-bold text-blue-600" href={item[field.key]} target="_blank" rel="noreferrer">
                            {item[field.key]}
                          </a>
                        )}
                        <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#2563eb] px-4 text-xs font-black text-white">
                          <Upload size={14} />
                          Choose file
                          <input
                            type="file"
                            accept={field.accept || "image/*"}
                            hidden
                            onChange={(event) => uploadForItem(item.id, field.key, event.target.files)}
                          />
                        </label>
                      </div>
                    ) : (
                      <input
                        value={item[field.key] || ""}
                        onChange={(event) => updateItem(item.id, field.key, event.target.value)}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white/70 px-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                      />
                    )}
                  </label>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={panel}>
          <p className="text-sm font-semibold text-slate-500">{emptyText}</p>
        </div>
      )}

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={() => persist(items)}
          className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#2563eb] px-5 text-sm font-black text-white shadow-[0_14px_34px_rgba(37,99,235,.28)] disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}

export function AchievementsManager() {
  return (
    <CollectionManager
      title="Achievements"
      description="Recognition cards shown on the public portfolio."
      path={["achievements", "recognitions"]}
      createItem={() => ({ id: uid("achievement"), title: "", subtitle: "", description: "", year: "", tags: "", published: true })}
      fields={[
        { key: "title", label: "Main title" },
        { key: "subtitle", label: "Competition / placement" },
        { key: "year", label: "Date / year" },
        { key: "tags", label: "Tags (comma separated)" },
        { key: "description", label: "Description", type: "textarea" },
        { key: "published", label: "Published", type: "checkbox" },
      ]}
    />
  );
}

export function CertificatesManager() {
  return (
    <CollectionManager
      title="Certificates"
      description="Certificates that power the public recognition slider."
      path={["achievements", "certificates"]}
      createItem={() => ({ id: uid("certificate"), title: "", issuer: "", image: "", credentialUrl: "", featured: false, published: true })}
      fields={[
        { key: "title", label: "Certificate title" },
        { key: "issuer", label: "Issuer" },
        { key: "image", label: "Certificate image", type: "file", accept: "image/*,.pdf,application/pdf" },
        { key: "credentialUrl", label: "Credential URL" },
        { key: "featured", label: "Featured", type: "checkbox" },
        { key: "published", label: "Published", type: "checkbox" },
      ]}
    />
  );
}

export function TestimonialsManager() {
  return (
    <CollectionManager
      title="Testimonials"
      description="Client testimonials and the featured hero quote."
      path={["testimonials"]}
      createItem={() => ({ id: uid("testimonial"), clientName: "", role: "", company: "", testimonial: "", rating: "5", featured: false, published: true })}
      fields={[
        { key: "clientName", label: "Client name" },
        { key: "role", label: "Role" },
        { key: "company", label: "Company" },
        { key: "rating", label: "Rating" },
        { key: "testimonial", label: "Testimonial", type: "textarea" },
        { key: "featured", label: "Hero testimonial", type: "checkbox" },
        { key: "published", label: "Published", type: "checkbox" },
      ]}
    />
  );
}

export function TechStackManager() {
  return (
    <CollectionManager
      title="Tech Stack"
      description="Technologies grouped by category for the public tech-stack section."
      path={["techStack"]}
      createItem={() => ({ id: uid("tech"), name: "", category: "Frontend", logo: "", description: "", published: true })}
      fields={[
        { key: "name", label: "Name" },
        { key: "category", label: "Category" },
        { key: "logo", label: "Logo file", type: "file", accept: "image/*" },
        { key: "description", label: "Short description" },
        { key: "published", label: "Published", type: "checkbox" },
      ]}
    />
  );
}

export function HomepageManager() {
  const [data] = useData();
  const [draft, setDraft] = useState(data);
  const [status, setStatus] = useState("");

  useEffect(() => setDraft(data), [data]);

  const update = (section, key, value) => {
    setDraft((current) => ({
      ...current,
      [section]: { ...(current?.[section] || {}), [key]: value },
    }));
  };

  const uploadHomepageFile = async (section, key, files) => {
    const file = files?.[0];
    if (!file) return;
    setStatus("");
    try {
      const [uploaded] = await uploadMediaFiles([file]);
      const next = {
        ...draft,
        [section]: { ...(draft?.[section] || {}), [key]: uploaded.url },
      };
      setDraft(next);
      await savePortfolioData(next);
      setStatus("File uploaded and saved.");
    } catch (error) {
      setStatus(error.message || "Could not upload file.");
    }
  };

  const save = async () => {
    setStatus("");
    try {
      await savePortfolioData(draft);
      setStatus("Homepage content saved.");
    } catch (error) {
      setStatus(error.message || "Could not save homepage content.");
    }
  };

  return (
    <div className="space-y-4">
      {status && <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">{status}</p>}
      {[
        ["profile", "Homepage / About / Footer", ["name", "role", "heroEyebrow", "heroTitle1", "heroAccent", "heroTitle2", "heroTitle3Lead", "heroTitle3", "heroDescription", "aboutHeading", "aboutAccent", "aboutQuote", "about", "footerDescription", "footerAvailability", "portraitUrl"]],
        ["contact", "Contact", ["email", "phone", "location", "availability"]],
      ].map(([section, title, keys]) => (
        <section className={panel} key={section}>
          <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">{title}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {keys.map((key) => (
              <label key={key} className={["heroDescription", "aboutQuote", "about", "footerDescription"].includes(key) ? "md:col-span-2" : ""}>
                <span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{key}</span>
                {key === "portraitUrl" ? (
                  <div className="rounded-xl border border-slate-200 bg-white/70 p-3">
                    {draft?.[section]?.[key] && (
                      <a className="mb-3 block break-all text-xs font-bold text-blue-600" href={draft[section][key]} target="_blank" rel="noreferrer">
                        {draft[section][key]}
                      </a>
                    )}
                    <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#2563eb] px-4 text-xs font-black text-white">
                      <Upload size={14} />
                      Choose file
                      <input type="file" accept="image/*" hidden onChange={(event) => uploadHomepageFile(section, key, event.target.files)} />
                    </label>
                  </div>
                ) : ["heroDescription", "aboutQuote", "about", "footerDescription"].includes(key) ? (
                  <textarea value={draft?.[section]?.[key] || ""} onChange={(event) => update(section, key, event.target.value)} rows={5} className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10" />
                ) : (
                  <input value={draft?.[section]?.[key] || ""} onChange={(event) => update(section, key, event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white/70 px-3 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10" />
                )}
              </label>
            ))}
          </div>
        </section>
      ))}
      <button type="button" onClick={save} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#2563eb] px-5 text-sm font-black text-white shadow-[0_14px_34px_rgba(37,99,235,.28)]">
        <Save size={16} />
        Save homepage
      </button>
    </div>
  );
}

export function ResumeManager() {
  const [data] = useData();
  const [status, setStatus] = useState("");
  const resume = data?.resume || {};

  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus("");
    try {
      const [uploaded] = await uploadMediaFiles([file]);
      await savePortfolioData({ ...data, resume: { fileName: uploaded.name, url: uploaded.url, uploadedAt: new Date().toISOString(), enabled: true } });
      setStatus("Resume replaced.");
    } catch (error) {
      setStatus(error.message || "Could not replace resume.");
    }
  };

  return (
    <section className={panel}>
      <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">Resume</h2>
      <p className="mt-1 text-sm text-slate-500">Replace the public resume file safely after upload succeeds.</p>
      {status && <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">{status}</p>}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white/60 p-4">
        <FileText className="text-blue-600" />
        <strong className="mt-2 block text-sm text-slate-900">{resume.fileName || "No resume uploaded"}</strong>
        {resume.url && <a className="mt-2 inline-flex text-xs font-bold text-blue-600" href={resume.url} target="_blank" rel="noreferrer"><Download size={14} /> Download</a>}
      </div>
      <label className="mt-4 inline-flex h-11 cursor-pointer items-center gap-2 rounded-2xl bg-[#2563eb] px-5 text-sm font-black text-white">
        <Upload size={16} />
        Replace resume
        <input type="file" accept=".pdf,application/pdf" hidden onChange={upload} />
      </label>
    </section>
  );
}

export function MediaLibraryManager() {
  const [data] = useData();
  const [status, setStatus] = useState("");
  const [uploaded, setUploaded] = useState([]);
  const media = [
    ...(data?.mediaLibrary || []).map((item) => item.url),
    ...(data?.projects || []).flatMap((project) => [project.coverImage, ...(project.screenshots || []), ...(project.mobileScreenshots || [])].filter(Boolean)),
    data?.profile?.portraitUrl,
    data?.resume?.url,
    ...uploaded.map((item) => item.url),
  ].filter(Boolean);

  const upload = async (event) => {
    const files = event.target.files;
    if (!files?.length) return;
    setStatus("");
    try {
      const uploads = await uploadMediaFiles(files);
      const nextMedia = [...(data?.mediaLibrary || []), ...uploads.map((item) => ({ ...item, uploadedAt: new Date().toISOString() }))];
      await savePortfolioData({ ...data, mediaLibrary: nextMedia });
      setUploaded((current) => [...uploads, ...current]);
      setStatus(`${uploads.length} file${uploads.length === 1 ? "" : "s"} uploaded.`);
    } catch (error) {
      setStatus(error.message || "Could not upload files.");
    }
  };

  return (
    <section className={panel}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">Media Library</h2>
          <p className="mt-1 text-sm text-slate-500">Upload files or review media currently referenced by portfolio content.</p>
        </div>
        <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#2563eb] px-4 text-xs font-black text-white">
          <Upload size={14} />
          Choose files
          <input type="file" multiple accept="image/*,video/mp4,.pdf,application/pdf" hidden onChange={upload} />
        </label>
      </div>
      {status && <p className="mt-3 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">{status}</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {media.length ? media.map((url, index) => (
          <a className="rounded-2xl border border-slate-200 bg-white/60 p-3 text-xs font-bold text-slate-600" href={url} target="_blank" rel="noreferrer" key={`${url}-${index}`}>
            <Image className="mb-2 text-blue-600" size={18} />
            <span className="break-all">{url}</span>
          </a>
        )) : <p className="text-sm font-semibold text-slate-500">No referenced media yet.</p>}
      </div>
    </section>
  );
}

export function AccountManager() {
  return (
    <section className={panel}>
      <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">Account</h2>
      <p className="mt-1 text-sm text-slate-500">Current admin account for this JSON-backed portfolio server.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white/60 p-4"><span className="text-xs text-slate-400">Username</span><strong className="block text-sm">eruadmin</strong></div>
        <div className="rounded-2xl border border-slate-200 bg-white/60 p-4"><span className="text-xs text-slate-400">Auth mode</span><strong className="block text-sm">Bearer token session</strong></div>
        <div className="rounded-2xl border border-slate-200 bg-white/60 p-4"><span className="text-xs text-slate-400">Storage</span><strong className="block text-sm">Local JSON backend</strong></div>
      </div>
    </section>
  );
}
