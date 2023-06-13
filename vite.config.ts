import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";

export default defineConfig({
  plugins: [glsl()],

  root: "src/",
  publicDir: "public",
  base: "./",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    sourcemap: true,
  },
});
