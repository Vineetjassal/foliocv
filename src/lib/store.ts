import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { PortfolioData, TemplateId } from "./types";

export const STORE_KEY = "foliocv_store";

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

interface Store {
  data: PortfolioData | null;
  template: TemplateId;
  savedAt: string | null;
  setData: (d: PortfolioData) => void;
  patch: (p: Partial<PortfolioData>) => void;
  setTemplate: (t: TemplateId) => void;
  clearDraft: () => void;
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      data: null,
      template: "centered",
      savedAt: null,
      setData: (d) => set({ data: d, savedAt: new Date().toISOString() }),
      // patch NEVER touches skills unless caller explicitly includes it
      patch: (p) =>
        set((s) => ({
          data: s.data ? { ...s.data, ...p } : s.data,
          savedAt: new Date().toISOString(),
        })),
      setTemplate: (t) => set({ template: t, savedAt: new Date().toISOString() }),
      clearDraft: () => set({ data: null, template: "centered", savedAt: null }),
    }),
    {
      name: STORE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Only persist the fields we care about; skip transient UI state
      partialize: (s) => ({ data: s.data, template: s.template, savedAt: s.savedAt }),
    },
  ),
);
