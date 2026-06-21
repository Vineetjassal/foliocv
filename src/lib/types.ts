export type TemplateId = 'centered' | 'split' | 'editorial';

export interface Project {
  name: string;
  description: string;
  url: string;
  githubUrl?: string;
  language?: string;
  stars?: number;
  image?: string;       // first/primary image (legacy)
  images?: string[];    // carousel images (can be base64 or URLs)
  videos?: string[];    // video URLs (mp4/webm/youtube)
  include?: boolean;
}

export interface PortfolioData {
  name: string;
  title: string;
  bio: string;
  about: string;
  avatar: string;
  location: string;
  email: string;
  website: string;
  github: string;
  skills: string[];
  experience: { role: string; company: string; period: string; description: string }[];
  education: { degree: string; school: string; period: string }[];
  projects: Project[];
  links: { label: string; url: string }[];
}
