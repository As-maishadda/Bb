# Deploy P-Stream on cPanel (Setup Node.js App)

1. On your computer: `pnpm install` then `pnpm run build` (creates `dist/`).
   Do NOT run npm install on cPanel (the `preinstall` script requires pnpm).
2. Upload to a folder OUTSIDE public_html, e.g. `/home/USER/pstream/`:
   - `server.js`
   - `cpanel/package.json` -> upload as `package.json` (replace the project one)
   - the whole `dist/` folder
   Do not upload `.env` or `src/`.
3. cPanel -> Setup Node.js App -> Create Application
   - Node version: 18 or 20, Mode: Production
   - Application root: `pstream`
   - Application URL: your domain
   - Startup file: `server.js`
4. Create, then Restart. Skip "Run NPM Install" (no dependencies).
5. After changing `dist/`, click Restart.

Note: all VITE_ variables in `.env` are baked into the public JS bundle. Never put real secrets there.

## Build dist online (no local setup)
1. Push this project to your own GitHub repo.
2. Repo -> Settings -> Secrets and variables -> Actions -> Variables: add VITE_APP_DOMAIN,
   VITE_TMDB_READ_API_KEY, VITE_CORS_PROXY_URL, VITE_M3U8_PROXY_URL, VITE_BACKEND_URL.
3. Actions tab -> "Build dist for cPanel" -> Run workflow.
4. When finished, open the run and download the `dist` artifact (zip), then upload/extract it in cPanel.
