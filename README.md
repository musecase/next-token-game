# Token Tumble

An interactive game about what it feels like to be a language model: answer a question by choosing one probable next token at a time.

**Play it:** [next-token-game.vercel.app](https://next-token-game.vercel.app)

## How it works

- A small Qwen3 0.6B model runs locally in the browser and generates the token cloud.
- A stronger OpenAI model prepares a concise reference answer and fact packet for custom questions.
- Replays reuse the original reference answer, so the local paths can diverge without another cloud call.
- Daily Steer offers three target-token puzzles each day from a prebuilt 365-day bank. Winning one completes the day; each puzzle keeps its own best score.
- Past days can be reopened from the date archive. After day 365, the bank cycles with fresh date-specific scoreboards.
- Optional arcade-style top-10 boards use anonymous browser IDs and filtered 10-character names.
- The OpenAI API key stays on the server and is never sent to the browser.

The first real-model round downloads about 570 MB and requires a browser with WebGPU. A no-download curated round is also included.

## Run locally

Prerequisites: Node.js 22.13 or newer and an OpenAI API key.

1. Copy `.env.example` to `.env.local`.
2. Put your API key after `OPENAI_API_KEY=` in `.env.local`.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open `http://localhost:3000`.

The `.gitignore` prevents `.env.local` and its API key from being committed.

## Deploy on Vercel

Import this repository into Vercel, then add `OPENAI_API_KEY` as a sensitive environment variable for Production and Preview. The standard `npm run build` command produces the deployment.

To enable the Daily Steer scoreboards, add an Upstash Redis integration through the Vercel Marketplace. The app accepts either `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` or Vercel's compatible `KV_REST_API_URL` / `KV_REST_API_TOKEN`; without them, the game works normally and displays the leaderboard as not yet connected.

## Current status

This is an experimental playable prototype. The local model works best in current Chrome or Edge on newer devices.
