// Vercel serverless function entry point
// Builds the TanStack Start app and serves it via Vercel Node runtime
import { createServer } from "node:http";

let handler;

async function getHandler() {
  if (!handler) {
    try {
      // Try to import the built server output
      const mod = await import("../dist/server/index.mjs");
      handler = mod.default || mod;
    } catch {
      // Fallback: serve a simple HTML page
      handler = (req, res) => {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FolioCV</title>
<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#fff}</style>
</head>
<body><div style="text-align:center"><h1>FolioCV</h1><p>Building...</p></div></body>
</html>`);
      };
    }
  }
  return handler;
}

export default async function (req, res) {
  const h = await getHandler();
  return h(req, res);
}
