# Case Coach

An AI coach that teaches consulting and product management case interview frameworks, drills you on them, and runs live mock interviews with rubric-based feedback. Built for MBA placement prep.

## Features

- **Two tracks:** consulting, product management, or both, with interviewer behaviour that changes to match.
- **Framework library:** 30 frameworks across core thinking, consulting, product management (including AI PM) and how the two tracks differ.
- **Socratic teaching:** each framework is taught one step at a time, ending in a drill you attempt before seeing the model answer.
- **Mock interviews:** interviewer-led, candidate-led, Indian campus style, or big tech PM style.
- **Scored feedback:** six dimensions scored 1–5, each with a specific fix.
- **Progress tracking:** tick frameworks as learned; the coach uses this to target weak areas.

## Deploy online

You need an Anthropic API key (console.anthropic.com). Always set `ACCESS_CODE` when hosting publicly, otherwise anyone with the link can use your API credits. Visitors enter the code once and their browser remembers it.

### Option A: Vercel (recommended, free tier)

1. Push this folder to a GitHub repo.
2. On vercel.com, choose **Add New → Project** and import the repo. Leave the framework as **Other**; `vercel.json` handles the rest.
3. Under **Environment Variables**, add `ANTHROPIC_API_KEY` and `ACCESS_CODE`.
4. Click **Deploy**. Your coach is live at `https://<project>.vercel.app`.

Or from a terminal, without GitHub:

```bash
npx vercel            # follow the prompts
npx vercel env add ANTHROPIC_API_KEY
npx vercel env add ACCESS_CODE
npx vercel --prod
```

### Option B: Render (free tier)

1. Push this folder to a GitHub repo.
2. On render.com, choose **New → Blueprint** and select the repo; `render.yaml` sets it up.
3. Enter `ANTHROPIC_API_KEY` and `ACCESS_CODE` when prompted.

Free Render instances sleep when idle, so the first load after a break takes about 30 seconds.

### Any other Node host (Railway, Fly.io, a VPS)

Set the environment variables and run `npm start`. Requires Node.js 20.6+.

## Run locally

```bash
cp .env.example .env      # add your API key and an access code
npm run dev
```

Open http://localhost:3000.

## Project structure

- `public/index.html` — the whole front end in one file (vanilla JS, no build step).
- `api/chat.js` — the chat endpoint. Proxies to the Anthropic Messages API with streaming, checks the access code, and caps conversation size. The API key never reaches the browser.
- `server.js` — a dependency-free Node server for local use and Node hosts. Serves `public/` and reuses `api/chat.js`.
- `vercel.json`, `render.yaml` — one-click hosting configs.

The coaching behaviour lives in the `RULES` constant in `public/index.html`; the server sends it as the system prompt. Progress is stored in each visitor's browser. The same `index.html` also runs as a published claude.ai artifact.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |
| `ACCESS_CODE` | Strongly recommended | Code visitors must enter before chatting |
| `ANTHROPIC_MODEL` | No | Defaults to `claude-sonnet-4-6` |
| `PORT` | No | Defaults to 3000 (Node hosts only) |

## Customising

- Edit `RULES` in `public/index.html` to change the learner profile, target companies or coaching style.
- Edit `LIB` to add or remove frameworks, and `CHIPS` to change the quick actions.

## License

MIT
