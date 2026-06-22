import { create } from "zustand";
import type { PortfolioData, TemplateId } from "./types";

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
  setData: (d: PortfolioData) => void;
  patch: (p: Partial<PortfolioData>) => void;
  setTemplate: (t: TemplateId) => void;
}

export const useStore = create<Store>((set) => ({
  data: null,
  template: "centered",
  setData: (d) => set({ data: d }),
  // patch NEVER touches skills unless caller explicitly includes it
  patch: (p) =>
    set((s) => ({
      data: s.data ? { ...s.data, ...p } : s.data,
    })),
  setTemplate: (t) => set({ template: t }),
}));
