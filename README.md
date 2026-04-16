# Transcript Name Replacer

A simple web tool to find and replace names in transcripts.

## Run locally

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

1. Create a new repo on GitHub (e.g. `name-replacer`)
2. Open `vite.config.js` and update `base` to match your repo name:
   ```js
   base: "/your-repo-name/",
   ```
3. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```
4. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**
5. Wait ~1 minute. Site goes live at `https://YOUR-USERNAME.github.io/YOUR-REPO/`

After that, every `git push` to `main` automatically rebuilds and redeploys the site.
