export interface Project {
  name: string;
  description: string;
  url: string;
  githubUrl?: string;
  stars?: number;
  language?: string;
  image?: string;
  images?: string[]; // carousel
  include?: boolean;
}

export interface PortfolioData {
  name: string;
  title: string;
  location: string;
  bio: string;
  about: string;
  email: string;
  website: string;
  github: string;
  avatar?: string;
  skills: string[];
  experience: { role: string; company: string; period: string; description: string }[];
  education: { degree: string; school: string; period: string }[];
  projects: Project[];
  links: { label: string; url: string }[];
}

export type TemplateId = "centered" | "split" | "editorial";
