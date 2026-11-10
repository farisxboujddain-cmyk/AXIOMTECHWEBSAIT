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

GitHub Actions deploys the `dist` directory to GitHub Pages when changes are pushed to `main`. The workspace includes a separately hosted server-side API for in-site AI features. Never put provider API keys in client-side code.


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


## Hybrid local + cloud chat

The AI Chat workspace now has two independent routes:

- **Cloud AI** uses the existing Vercel `/api/chat` endpoint and the server-side OpenRouter key. The browser never receives that key.
- **Local AI** connects directly from the user's browser to an Ollama instance (default: `http://localhost:11434`). It discovers installed models through `/api/tags` and sends chat requests to `/api/chat`.

### Local setup

1. Install and start Ollama on the computer that will run the local models.
2. Download at least one model using Ollama, then keep the Ollama service running.
3. In AXIOMTECH AI Hub, select **Local AI**, confirm the Ollama address, and choose **Connect & refresh**.
4. If the browser blocks the request, configure Ollama's `OLLAMA_ORIGINS` environment variable to allow the exact origin of the AXIOMTECH site (and the local development origin if needed), then restart Ollama. Do not use a wildcard origin on a shared or untrusted network.

Local inference is performed on the user's computer; it is not hosted by Vercel. Performance depends on the installed model and available hardware. The local endpoint setting is stored only in that browser's local storage. Local mode does not require an OpenRouter key, while cloud mode continues to require the server-side OpenRouter configuration.

This change does not remove or replace the existing cloud model catalogue, chat API, or Research Agent. The Research Agent remains a cloud-backed workflow in this phase.
