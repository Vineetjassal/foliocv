export interface PortfolioData {
  name: string;
  title: string;
  location: string;
  bio: string;
  email: string;
  website: string;
  github: string;
  avatar?: string;
  skills: string[];
  experience: { role: string; company: string; period: string; description: string }[];
  education: { degree: string; school: string; period: string }[];
  projects: { name: string; description: string; url: string; stars?: number; language?: string }[];
  links: { label: string; url: string }[];
}

export type TemplateId = "centered" | "split" | "editorial";
