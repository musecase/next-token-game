# Next Token

An interactive game about what it feels like to be a language model: answer a question by choosing one probable next token at a time.

**Play it:** [next-token-game.vercel.app](https://next-token-game.vercel.app)

## How it works

- A small Qwen3 0.6B model runs locally in the browser and generates the token cloud.
- A stronger OpenAI model prepares a concise reference answer and fact packet for custom questions.
- Replays reuse the original reference answer, so the local paths can diverge without another cloud call.
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

## Current status

This is an experimental playable prototype. The local model works best in current Chrome or Edge on newer devices.
