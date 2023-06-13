import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";

export default defineConfig({
  plugins: [glsl()],
  root: "src",
  build: {
    outDir: "../dist",
  },
});
