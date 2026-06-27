import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Logo } from "@/components/Logo";
import type { PortfolioData, TemplateId } from "@/lib/types";

export const Route = createFileRoute("/edit")({
  component: EditPage,
});

const TEMPLATES: { id: TemplateId; label: string; desc: string }[] = [
  { id: "centered",  label: "Quiet",     desc: "Centered & minimal" },
  { id: "split",     label: "Studio",    desc: "Sidebar + content" },
  { id: "editorial", label: "Editorial", desc: "Bold serif layout" },
  { id: "minimal",   label: "Minimal",   desc: "Clean & typographic" },
];

function Field({
  label,
  value,
  onChange,
  multiline = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</label>
      {multiline ? (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-foreground transition-colors resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-foreground transition-colors"
        />
      )}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <h3 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

export default function EditPage() {
  const navigate = useNavigate();
  const storeData = useStore((s) => s.data);
  const patch = useStore((s) => s.patch);
  const template = useStore((s) => s.template);
  const setTemplate = useStore((s) => s.setTemplate);
  const clearDraft = useStore((s) => s.clearDraft);

  const [local, setLocal] = useState<PortfolioData | null>(null);
  const [saved, setSaved] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  useEffect(() => {
    if (!storeData) {
      navigate({ to: "/create" });
      return;
    }
    setLocal(storeData);
  }, [storeData, navigate]);

  if (!local) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading editor…</div>
      </div>
    );
  }

  function set(key: keyof PortfolioData, value: any) {
    setLocal((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  function handleSave() {
    if (!local) return;
    patch(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleStartOver() {
    clearDraft();
    navigate({ to: "/create" });
  }

  function addSkill() {
    const s = newSkill.trim();
    if (!s || local.skills.includes(s)) return;
    set("skills", [...local.skills, s]);
    setNewSkill("");
  }

  function removeSkill(skill: string) {
    set("skills", local.skills.filter((s) => s !== skill));
  }

  function addExperience() {
    set("experience", [
      ...local.experience,
      { role: "", company: "", period: "", description: "" },
    ]);
  }

  function patchExp(i: number, key: string, val: string) {
    const updated = local.experience.map((e, idx) =>
      idx === i ? { ...e, [key]: val } : e
    );
    set("experience", updated);
  }

  function removeExp(i: number) {
    set("experience", local.experience.filter((_, idx) => idx !== i));
  }

  function addEducation() {
    set("education", [
      ...local.education,
      { degree: "", school: "", period: "" },
    ]);
  }

  function patchEdu(i: number, key: string, val: string) {
    const updated = local.education.map((e, idx) =>
      idx === i ? { ...e, [key]: val } : e
    );
    set("education", updated);
  }

  function removeEdu(i: number) {
    set("education", local.education.filter((_, idx) => idx !== i));
  }

  function toggleProject(i: number) {
    const updated = local.projects.map((p, idx) =>
      idx === i ? { ...p, include: !p.include } : p
    );
    set("projects", updated);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-6 py-4 backdrop-blur-sm sm:px-10">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={24} />
          <span className="font-serif text-lg">FolioCV</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleStartOver}
            className="rounded-full border border-border px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            Start over
          </button>
          <button
            onClick={handleSave}
            className="rounded-full bg-foreground px-5 py-1.5 text-xs font-medium text-background hover:opacity-90 transition-opacity"
          >
            {saved ? "✓ Saved" : "Save changes"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 pb-32 pt-10 space-y-6">
        <div>
          <div className="mb-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 2 of 2</div>
          <h1 className="font-serif text-4xl">Edit your portfolio</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            All fields are optional — fill in what you want to show.
          </p>
        </div>

        {/* Template picker */}
        <SectionCard title="Template">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplate(t.id)}
                className={`rounded-xl border p-3 text-left transition ${
                  template === t.id
                    ? "border-foreground bg-accent"
                    : "border-border hover:border-foreground/40"
                }`}
              >
                <div className="text-sm font-medium">{t.label}</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">{t.desc}</div>
              </button>
            ))}
          </div>
        </SectionCard>

        {/* Identity */}
        <SectionCard title="Identity">
          <Field label="Full name" value={local.name} onChange={(v) => set("name", v)} placeholder="Vineet Jassal" />
          <Field label="Title / tagline" value={local.title} onChange={(v) => set("title", v)} placeholder="Mathematics Researcher & Developer" />
          <Field label="Short bio" value={local.bio} onChange={(v) => set("bio", v)} multiline placeholder="One-liner that appears under your name." />
          <Field label="About" value={local.about} onChange={(v) => set("about", v)} multiline placeholder="A longer paragraph about your background and interests." />
          <Field label="Avatar URL" value={local.avatar} onChange={(v) => set("avatar", v)} placeholder="https://github.com/yourname.png" />
        </SectionCard>

        {/* Contact */}
        <SectionCard title="Contact & Links">
          <Field label="Location" value={local.location} onChange={(v) => set("location", v)} placeholder="New Delhi, India" />
          <Field label="Email" value={local.email} onChange={(v) => set("email", v)} placeholder="you@example.com" />
          <Field label="Website" value={local.website} onChange={(v) => set("website", v)} placeholder="https://yoursite.com" />
          <Field label="GitHub username" value={local.github} onChange={(v) => set("github", v)} placeholder="yourname" />
        </SectionCard>

        {/* Skills */}
        <SectionCard title="Skills">
          <div className="flex flex-wrap gap-2">
            {local.skills.map((s) => (
              <span key={s} className="flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-xs">
                {s}
                <button type="button" onClick={() => removeSkill(s)} className="ml-1 text-muted-foreground hover:text-destructive transition-colors">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              placeholder="Type a skill and press Enter"
              className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-foreground transition-colors"
            />
            <button
              type="button"
              onClick={addSkill}
              className="rounded-xl border border-border px-4 py-2.5 text-sm hover:bg-accent transition-colors"
            >
              Add
            </button>
          </div>
        </SectionCard>

        {/* Experience */}
        <SectionCard title="Experience">
          {local.experience.length === 0 && (
            <p className="text-xs text-muted-foreground">No experience added yet.</p>
          )}
          {local.experience.map((exp, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Entry {i + 1}</span>
                <button type="button" onClick={() => removeExp(i)} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Remove</button>
              </div>
              <Field label="Role" value={exp.role} onChange={(v) => patchExp(i, "role", v)} placeholder="Research Associate" />
              <Field label="Company / Institution" value={exp.company} onChange={(v) => patchExp(i, "company", v)} placeholder="University of Delhi" />
              <Field label="Period" value={exp.period} onChange={(v) => patchExp(i, "period", v)} placeholder="2022 – Present" />
              <Field label="Description" value={exp.description} onChange={(v) => patchExp(i, "description", v)} multiline placeholder="Brief summary of responsibilities or achievements." />
            </div>
          ))}
          <button
            type="button"
            onClick={addExperience}
            className="w-full rounded-xl border border-dashed border-border py-2.5 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
          >
            + Add experience
          </button>
        </SectionCard>

        {/* Education */}
        <SectionCard title="Education">
          {local.education.length === 0 && (
            <p className="text-xs text-muted-foreground">No education added yet.</p>
          )}
          {local.education.map((edu, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Entry {i + 1}</span>
                <button type="button" onClick={() => removeEdu(i)} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Remove</button>
              </div>
              <Field label="Degree" value={edu.degree} onChange={(v) => patchEdu(i, "degree", v)} placeholder="B.Sc. (Hons.) Mathematics" />
              <Field label="School" value={edu.school} onChange={(v) => patchEdu(i, "school", v)} placeholder="Kirori Mal College, University of Delhi" />
              <Field label="Period" value={edu.period} onChange={(v) => patchEdu(i, "period", v)} placeholder="2023 – 2026" />
            </div>
          ))}
          <button
            type="button"
            onClick={addEducation}
            className="w-full rounded-xl border border-dashed border-border py-2.5 text-sm text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
          >
            + Add education
          </button>
        </SectionCard>

        {/* Projects */}
        {local.projects.length > 0 && (
          <SectionCard title="Projects">
            <p className="text-xs text-muted-foreground">Toggle which projects appear on your portfolio.</p>
            <div className="space-y-2">
              {local.projects.map((p, i) => (
                <label key={i} className="flex cursor-pointer items-center justify-between rounded-xl border border-border px-4 py-3 hover:bg-accent transition-colors">
                  <div>
                    <div className="text-sm font-medium">{p.name || `Project ${i + 1}`}</div>
                    {p.description && (
                      <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{p.description}</div>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={p.include !== false}
                    onChange={() => toggleProject(i)}
                    className="h-4 w-4 accent-foreground"
                  />
                </label>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Save CTA */}
        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button
            onClick={handleSave}
            className="flex-1 rounded-full bg-foreground py-4 text-sm font-medium text-background hover:opacity-90 transition-opacity"
          >
            {saved ? "✓ Saved!" : "Save & preview →"}
          </button>
          <button
            onClick={handleStartOver}
            className="rounded-full border border-border px-6 py-4 text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            Start over
          </button>
        </div>
      </main>
    </div>
  );
}
