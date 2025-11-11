// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import node from "@astrojs/node";
import authproto from '@fujocoded/authproto';

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [
    authproto({
      driver: {
        name: "memory"
      },
      scopes: {
        genericData: true,
      }
    }),
  ],
  vite: {
    build: {
      rollupOptions: {
        external: "astro:db"
      }
    }
  },
  experimental: {
    fonts: [
      {
        provider: fontProviders.fontsource(),
        name: "DotGothic16",
        cssVariable: "--dotgothic",
        fallbacks: ["ui-rounded", "Hiragino Maru Gothic ProN", "Quicksand", "Comfortaa", "Manjari", "Arial Rounded MT", "Arial Rounded MT Bold", "Calibri", "source-sans-pro", "sans-serif"],
      },
      {
        provider: "local",
        name: "Galmuri",
        cssVariable: "--galmuri",
        variants: [{
          weight: 400,
          src: ["./src/assets/fonts/Galmuri9.woff2"],
        }],
        fallbacks: ["Unifont EX", "Unifont", "system-ui", "sans-serif"],
      },
      {
        provider: "local",
        name: "Galmuri Mono",
        cssVariable: "--galmurimono",
        variants: [{
          weight: 400,
          src: ["./src/assets/fonts/GalmuriMono9.woff2"],
        }],
        fallbacks: ["Dank Mono", "Operator Mono", "Inconsolata", "Fira Mono", "ui-monospace", "SF Mono", "Monaco", "Droid Sans Mono", "Source Code Pro", "Cascadia Code", "Menlo", "Consolas", "DejaVu Sans Mono", "monospace"],      }
    ]
  }
});