# FolioCV

> Turn your résumé into a portfolio — in seconds.

**FolioCV** is a fully browser-based portfolio generator. Drop a résumé JSON, paste your GitHub username, and get a beautiful, editable portfolio site you can download as clean HTML/CSS/JS. No signup, no server, no lock-in.

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/vineetjassal/skill-builder-express)

---

## ✨ Features

- **100% private** — everything runs in your browser, nothing is sent to a server
- **JSON Resume compatible** — supports the [jsonresume.org](https://jsonresume.org) schema out of the box
- **Live site screenshots** — project cards show real screenshots of your deployed sites, not GitHub social previews
- **Inline editor** — tweak every field, toggle projects, rearrange sections in a live WYSIWYG editor
- **3 minimal templates** — Quiet (centered), Studio (sidebar), Editorial (bold serif)
- **Dark mode native** — every generated portfolio ships with a light/dark toggle
- **Download clean code** — get a zip of HTML + CSS you own outright

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### Install & Run Locally

```bash
# Clone the repo
git clone https://github.com/vineetjassal/skill-builder-express.git
cd skill-builder-express

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

Output will be in the `.output/` directory.

---

## 🗂 Project Structure

```
skill-builder-express/
├── src/
│   ├── routes/          # TanStack Router file-based routes
│   │   ├── index.tsx    # Landing page
│   │   ├── create.tsx   # Step 1 — upload JSON + GitHub
│   │   └── edit.tsx     # Step 2 — inline editor + preview
│   ├── components/      # Shared UI components (Logo, etc.)
│   ├── lib/
│   │   ├── github.ts    # GitHub API fetching + screenshot URLs
│   │   ├── parseJson.ts # JSON Resume parser
│   │   ├── store.ts     # Zustand state store
│   │   ├── templates.ts # Portfolio HTML/CSS generators
│   │   └── types.ts     # TypeScript types
│   └── styles.css       # Global Tailwind styles
├── public/              # Static assets
├── vercel.json          # Vercel deployment config
└── vite.config.ts       # Vite + TanStack Start config
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [TanStack Start](https://tanstack.com/start) + [React 19](https://react.dev) |
| Routing | [TanStack Router](https://tanstack.com/router) (file-based) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| State | [Zustand](https://zustand-demo.pmnd.rs/) |
| Animation | [GSAP](https://gsap.com/) |
| Build | [Vite 8](https://vite.dev/) + [Nitro](https://nitro.build/) |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) |
| Zip output | [JSZip](https://stuk.github.io/jszip/) |

---

## 📦 Deploying

### Vercel (recommended)

1. Push this repo to GitHub
2. Import it at [vercel.com/new](https://vercel.com/new)
3. Framework: **Other** (leave as default — `vercel.json` handles it)
4. Click **Deploy**

Vercel will automatically detect the `vercel.json` config and use the correct build output.

### Cloudflare Pages

```bash
npm run build
# Deploy .output/public as static + .output/server as a Worker
```

### Netlify

Set build command to `npm run build` and publish directory to `.output/public`, and add a `_redirects` file:

```
/* /index.html 200
```

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

1. Fork the repo
2. Create your feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feat/my-feature`
5. Open a Pull Request

---

## 👤 Author

**Vineet Jassal** — [@vineetjassal](https://github.com/vineetjassal)

---

## 📄 License

MIT — do whatever you want with it.
