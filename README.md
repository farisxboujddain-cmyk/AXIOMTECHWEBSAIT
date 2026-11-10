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


## Research Agent (first release)

The Research Agent runs in Vercel Functions and uses LangChain.js with the
OpenRouter chat model integration. It plans a concise search phrase, calls a
bounded Wikipedia search tool, and synthesizes a research brief with source links.

- API route: `POST /api/research`
- Search source: English Wikipedia API (no separate search API key)
- Model route: `openrouter/free` or another explicitly free OpenRouter model
- Search scope: Wikipedia only in this first release; broader web search is not enabled.
- Safety limits: one bounded search, up to four source extracts, request-size limits,
  and a best-effort in-memory request limiter (not a durable global quota).

The Vercel project requires these server-side environment variables:
- `OPENROUTER_API_KEY`: your OpenRouter key (keep it server-side; never use a `VITE_` prefix).
- `ALLOWED_ORIGIN`: `https://farisxboujddain-cmyk.github.io`.

The GitHub Pages build uses the repository variable `VITE_API_BASE_URL` to point to the Vercel deployment's base URL (for example, `https://your-project.vercel.app`, with no trailing slash). The API is hosted separately from the Pages frontend. After deploying the Vercel project, update that GitHub Actions variable and rebuild Pages.
