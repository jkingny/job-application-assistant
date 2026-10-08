import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Update `base` to '/<your-repo-name>/' before deploying to GitHub Pages
// via a project site (e.g. https://username.github.io/repo-name/).
// Leave as '/' if deploying to a custom domain or a <username>.github.io repo.
export default defineConfig({
  plugins: [react()],
  base: './',
})
