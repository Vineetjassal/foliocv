import { create } from 'zustand';
import type { PortfolioData, TemplateId } from './types';

export const emptyPortfolio: PortfolioData = {
  name: '',
  title: '',
  bio: '',
  about: '',
  avatar: '',
  location: '',
  email: '',
  website: '',
  github: '',
  skills: [],
  experience: [],
  education: [],
  projects: [],
  links: [],
};

/** Coerce skills to string[] defensively at store level */
function safeSkills(s: any): string[] {
  if (Array.isArray(s)) return s.map(String).filter(Boolean);
  if (typeof s === 'string') return s.split(',').map((x) => x.trim()).filter(Boolean);
  return [];
}

interface Store {
  data: PortfolioData | null;
  template: TemplateId;
  setData: (d: PortfolioData) => void;
  patch: (p: Partial<PortfolioData>) => void;
  setTemplate: (t: TemplateId) => void;
}

export const useStore = create<Store>((set) => ({
  data: null,
  template: 'centered',
  setData: (d) => set({ data: { ...d, skills: safeSkills(d.skills) } }),
  patch: (p) =>
    set((s) => ({
      data: s.data
        ? { ...s.data, ...p, skills: safeSkills(p.skills ?? s.data.skills) }
        : s.data,
    })),
  setTemplate: (t) => set({ template: t }),
}));
