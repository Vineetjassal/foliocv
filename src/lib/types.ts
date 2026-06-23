export type TemplateId = "centered" | "split" | "editorial" | "aurora" | "minimal";

export type FontFamily =
  | "inter"
  | "playfair"
  | "roboto-mono"
  | "syne"
  | "dm-sans";

export interface Project {
  name: string;
  description: string;
  url: string;
  githubUrl?: string;
  language?: string;
  stars?: number;
  image?: string; // first/primary image (legacy)
  images?: string[]; // carousel images (can be base64 or URLs)
  videos?: string[]; // video URLs (mp4/webm/youtube)
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
  /** Profile gallery — up to 15 images shown as a carousel on the profile */
  galleryImages?: string[];
  /** GitHub README sync — when true, portfolio.json is pushed to the user's GitHub profile repo */
  githubSync?: boolean;
  /** Custom accent color hex (e.g. "#7c3aed") applied across the generated portfolio */
  accentColor?: string;
  /** Font family choice for the generated portfolio */
  fontFamily?: FontFamily;
  /**
   * ORCID iD (e.g. "0000-0002-1825-0097").
   * Used to fetch publications list from the free ORCID public API.
   */
  orcid?: string;
  /**
   * Google Scholar user ID from the profile URL:
   *   https://scholar.google.com/citations?user=<THIS_PART>
   * Used (via /api/scholar serverless proxy) to display total citations,
   * h-index, and i10-index on the portfolio.
   */
  scholarId?: string;
}
