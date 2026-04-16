import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// IMPORTANT: change "name-replacer" below to match your GitHub repo name.
// If your repo URL is https://github.com/VeriteIgiraneza/my-cool-repo
// then base should be "/my-cool-repo/"
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/name-replacer/",
});
