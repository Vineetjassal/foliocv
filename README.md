# FolioCV

> Turn your résumé into a portfolio — in seconds.

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Open Source](https://img.shields.io/badge/Open%20Source-%F0%9F%9F%A2-brightgreen)](https://github.com/Vineetjassal/foliocv)
[![Built with React](https://img.shields.io/badge/built%20with-React%2019-61dafb?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)

**FolioCV** is a fully browser-based, open source portfolio generator. Drop a résumé JSON, paste your GitHub username, and get a beautiful, editable portfolio site you can download as clean HTML/CSS/JS. No signup, no server, no lock-in.

---

## ✨ Features

- **100% private** — everything runs in your browser, nothing is sent to a server
- **JSON Resume compatible** — supports the [jsonresume.org](https://jsonresume.org) schema out of the box
- **Live site screenshots** — project cards show real screenshots of your deployed sites
- **Inline editor** — tweak every field, toggle projects, rearrange sections in a live WYSIWYG editor
- **4 clean templates** — Ink (editorial), Sheet (sidebar), Mono (timeline), Ruled (minimal)
- **Teal + white design** — every generated portfolio ships with a light/dark toggle
- **Download clean code** — get a zip of HTML + CSS you own outright
- **Open Source & MIT licensed** — fork it, self-host it, contribute to it

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### Install & Run Locally

```bash
# Clone the repo
git clone https://github.com/Vineetjassal/foliocv.git
cd foliocv

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
foliocv/
├── src/
│   ├── routes/          # TanStack Router file-based routes
│   │   ├── index.tsx    # Landing page
│   │   ├── create.tsx   # Step 1 — upload JSON + GitHub
│   │   └── edit.tsx     # Step 2 — inline editor + preview
│   ├── components/      # Shared UI components
│   ├── lib/
│   │   ├── github.ts    # GitHub API fetching + screenshot URLs
│   │   ├── parseJson.ts # JSON Resume parser
│   │   ├── store.ts     # Zustand state store
│   │   ├── templates.ts # Portfolio HTML/CSS generators
│   │   └── types.ts     # TypeScript types
│   └── styles.css       # Global Tailwind styles
├── public/              # Static assets
├── LICENSE              # MIT License
├── vercel.json          # Vercel deployment config
└── vite.config.ts       # Vite + TanStack Start config
```

---

## 🛠 Tech Stack

| Layer         | Technology                                                                   |
| ------------- | ---------------------------------------------------------------------------- |
| Framework     | [TanStack Start](https://tanstack.com/start) + [React 19](https://react.dev) |
| Routing       | [TanStack Router](https://tanstack.com/router) (file-based)                  |
| Styling       | [Tailwind CSS v4](https://tailwindcss.com)                                   |
| State         | [Zustand](https://zustand-demo.pmnd.rs/)                                     |
| Animation     | [GSAP](https://gsap.com/)                                                    |
| Build         | [Vite 8](https://vite.dev/) + [Nitro](https://nitro.build/)                  |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)  |
| Zip output    | [JSZip](https://stuk.github.io/jszip/)                                       |

---

## 🤝 Contributing

Contributions are welcome! FolioCV is open source and built in the open.

1. Fork the repo
2. Create your feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feat/my-feature`
5. Open a Pull Request

For major changes, please open an issue first to discuss what you'd like to change.

---

## 👤 Author

**Vineet Jassal** — [@vineetjassal](https://github.com/vineetjassal)

---

## 📄 License

[MIT](./LICENSE) — free to use, modify, and distribute. See the [LICENSE](./LICENSE) file for full details.
