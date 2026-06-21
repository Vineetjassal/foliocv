import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PortfolioData, TemplateId } from "./types";

interface State {
  data: PortfolioData | null;
  template: TemplateId;
  setData: (d: PortfolioData) => void;
  patch: (p: Partial<PortfolioData>) => void;
  setTemplate: (t: TemplateId) => void;
  reset: () => void;
}

export const emptyPortfolio: PortfolioData = {
  name: "",
  title: "",
  location: "",
  bio: "",
  about: "",
  email: "",
  website: "",
  github: "",
  avatar: "",
  skills: [],
  experience: [],
  education: [],
  projects: [],
  links: [],
};

export const useStore = create<State>()(
  persist(
    (set) => ({
      data: null,
      template: "centered",
      setData: (data) => set({ data }),
      patch: (p) =>
        set((s) => ({ data: s.data ? { ...s.data, ...p } : { ...emptyPortfolio, ...p } })),
      setTemplate: (template) => set({ template }),
      reset: () => set({ data: null }),
    }),
    { name: "monogram-portfolio" },
  ),
);
