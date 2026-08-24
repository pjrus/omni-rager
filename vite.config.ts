import { defineConfig } from "vite";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/").pop();

export default defineConfig({
  // GitHub Pages serves project sites below the repository name.
  base: process.env.GITHUB_ACTIONS && repositoryName ? `/${repositoryName}/` : "/",
});
