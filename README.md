# AXIOMTECH AI Hub

A modern free-first AI discovery workspace built with React, TypeScript, Vite and Tailwind CSS.

## Features

- Responsive dashboard and navigation
- Curated AI tool directory with search and category filters
- Prompt Studio with local prompt generation and copy
- Multi-model AI chat interface
- Cloudflare Worker API proxy for OpenRouter
- Free-model-only routing in the Worker
- No provider API keys or secrets shipped to the browser

## Architecture

- Frontend: GitHub Pages
- API: Cloudflare Worker in `worker/index.ts`
- Provider: OpenRouter
- Frontend API URL: `VITE_API_BASE_URL` (public URL, not a secret)
- Provider API key: Worker secret `OPENROUTER_API_KEY`

## Configure the API (manual setup required)

1. Create a Worker using `wrangler.toml` and `worker/index.ts`.
2. Add `OPENROUTER_API_KEY` as a Worker secret in Cloudflare. Never add this key to GitHub, Vite variables, or frontend source.
3. Set `ALLOWED_ORIGIN` to the exact website origin. For the standard GitHub Pages domain this is `https://farisxboujddain-cmyk.github.io` (scheme + hostname only; no repository path).
4. Deploy the Worker and copy its `workers.dev` URL.
5. In GitHub repository Settings → Secrets and variables → Actions → Variables, create `VITE_API_BASE_URL` with the Worker URL.
6. Run the feature-branch build workflow and test the chat.

The chat interface will show a connection notice until these external settings are configured. This repository change does not create a Cloudflare account, add secrets, or deploy the Worker.

## Free model behavior

The Worker only accepts `openrouter/free` and model IDs ending in `:free`. Free model availability and rate limits can change. The Worker does not intentionally fall back to paid models.

## Security notes

- The OpenRouter key is read only from the Cloudflare Worker secret.
- Request bodies and conversation lengths are limited.
- The Worker checks the configured browser Origin. CORS is not authentication or complete abuse protection; configure Cloudflare rate limiting before opening the API to broad public use.
- No API credentials are committed to this repository.

## Development

Run `npm install`, then `npm run dev`. Run `npm run build` to validate the frontend.
