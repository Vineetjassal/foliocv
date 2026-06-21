import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    nitro: {
      preset: "static",
      output: {
        dir: "dist",
        publicDir: "dist",
      },
    },
  },
});
