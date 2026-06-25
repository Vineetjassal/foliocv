import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { PortfolioData, TemplateId } from "./types";

export const STORE_KEY = "foliocv_store";
export const HISTORY_KEY = "foliocv_history";
export const MAX_SNAPSHOTS = 10;

export interface Snapshot {
  id: string;
  label: string;
  savedAt: string;
  data: PortfolioData;
  template: TemplateId;
}

export const emptyPortfolio: PortfolioData = {
  name: "",
  title: "",
  bio: "",
  about: "",
  avatar: "",
  location: "",
  email: "",
  website: "",
  github: "",
  skills: [],
  experience: [],
  education: [],
  projects: [],
  links: [],
  galleryImages: [],
  githubSync: false,
  accentColor: "#7c3aed",
  fontFamily: "inter",
};

// ── History helpers (pure localStorage, outside Zustand) ─────────────────────
export function getSnapshots(): Snapshot[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveSnapshot(data: PortfolioData, template: TemplateId, label?: string): void {
  const snapshots = getSnapshots();
  const now = new Date().toISOString();
  const snap: Snapshot = {
    id: `snap_${Date.now()}`,
    label: label ?? (data.name ? `${data.name}'s portfolio` : "Portfolio snapshot"),
    savedAt: now,
    data,
    template,
  };
  // Prepend newest, keep max 10
  const updated = [snap, ...snapshots].slice(0, MAX_SNAPSHOTS);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function deleteSnapshot(id: string): void {
  const updated = getSnapshots().filter((s) => s.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function clearAllSnapshots(): void {
  localStorage.removeItem(HISTORY_KEY);
}

interface Store {
  data: PortfolioData | null;
  template: TemplateId;
  savedAt: string | null;
  setData: (d: PortfolioData) => void;
  patch: (p: Partial<PortfolioData>) => void;
  setTemplate: (t: TemplateId) => void;
  clearDraft: () => void;
  restoreSnapshot: (snap: Snapshot) => void;
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      data: null,
      template: "centered",
      savedAt: null,
      setData: (d) => set({ data: d, savedAt: new Date().toISOString() }),
      patch: (p) =>
        set((s) => ({
          data: s.data ? { ...s.data, ...p } : s.data,
          savedAt: new Date().toISOString(),
        })),
      setTemplate: (t) => set({ template: t, savedAt: new Date().toISOString() }),
      clearDraft: () => set({ data: null, template: "centered", savedAt: null }),
      restoreSnapshot: (snap) =>
        set({ data: snap.data, template: snap.template, savedAt: new Date().toISOString() }),
    }),
    {
      name: STORE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ data: s.data, template: s.template, savedAt: s.savedAt }),
    },
  ),
);
