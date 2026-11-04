# AXIOMTECH AI Hub

A modern free-first AI discovery workspace built with React, TypeScript, Vite and Tailwind CSS.

## Features
- Responsive dashboard and navigation
- Curated AI tool directory with search and category filters
- Featured tools and provider access labels
- Prompt Studio with local prompt generation and copy
- No API keys or secrets shipped to the browser

## Development
Run `npm install`, then `npm run dev`.

## Production
Run `npm run build` and `npm run preview`.

GitHub Actions deploys the `dist` directory to GitHub Pages when changes are pushed to `main`. The initial release links to third-party AI providers. Free access, limits, sign-in and availability are controlled by each provider. A future in-site AI chat requires a secure server-side API layer; never put provider API keys in client-side code.
