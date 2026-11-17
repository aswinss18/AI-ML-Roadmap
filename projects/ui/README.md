This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

## Sales brochure generator

The app's `/sales-brochure-generator` page sends website URLs and a selected
Ollama model to the FastAPI `/generate-brochure` endpoint. The model selector
includes `meditron:latest`, `deepseek-r1:1.5b`, `llama3.2:latest`,
`gpt-oss:latest`, `phi3:latest`, and `gemma3:270m`. By default, the API is
expected at `http://localhost:8000`. Set `NEXT_PUBLIC_API_BASE_URL` before
starting Next.js to use a different API base URL.

## Genie assistant

Open `/ai-assistant`, or choose **Genie assistant** in the sidebar. Genie loads
installed models from `GET /models` and streams replies from `POST /chat-assistant`.
The page supports suggested prompts, Markdown, copying replies, and stopping a reply.

With Ollama running, start the assistant API from `projects/ai-assistant`:

```bash
uv run --locked uvicorn main:app --port 8000
```

Run `npm run dev` from `projects/ui` and visit
[Genie](http://localhost:3000/ai-assistant). Set
`NEXT_PUBLIC_GENIE_API_BASE_URL` in `projects/ui/.env.local` to use another API
address, then restart Next.js. The default is `http://localhost:8000`.
The API currently permits the frontend origin `http://localhost:3000`.

The existing API keeps one shared conversation in server memory. The visible
transcript lasts until the page is reloaded; reloading does not reset the API's
history. Stop cancels receiving the reply, but does not guarantee that model
generation on the server stops. Independent chats need backend session support.

## AI tutor

The `/ai-tutor` page sends a question and the selected Ollama model to the
FastAPI `POST /teach-stream` endpoint. Answers stream into the page as they are
generated and are rendered as formatted Markdown, including headings, lists,
tables, and code. The tutor uses the same model choices and
`NEXT_PUBLIC_API_BASE_URL` setting as the brochure generator.

Start the matching FastAPI app under `projects/` on port 8000, then start this
Next.js app on port 3000. Use `projects/ai-tutor` for the tutor and
`projects/sales-brochure-generator` for brochures. The shared
`NEXT_PUBLIC_API_BASE_URL` setting points to one backend at a time.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Multi-model chat

Open `/multi-model-chat` from the workspace sidebar. Enter a topic and choose
an installed Ollama model for Liz and Jarviz. They trade short replies and
decide when the discussion is complete. Use **Stop** to end the stream at
any time.

With Ollama running, start the chat API from `projects/multi-chat-bots`:

```bash
uv run --locked uvicorn main:app --port 8000
```

The chat page uses `http://localhost:8000` by default. Set
`NEXT_PUBLIC_MULTI_CHAT_API_BASE_URL` before starting Next.js to override it.
If the UI runs on a different origin, set `MULTI_CHAT_UI_ORIGINS` on the API
to a comma-separated list of allowed frontend origins.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Interface and design system

The four tools share shadcn/ui components, responsive navigation, and light, dark,
and system appearance. Appearance is saved in the browser. Use Ctrl+K (or Cmd+K)
to switch tools. The brochure supports preview, copy, and Markdown download.

`design.md` records the visual direction. Semantic theme tokens live in
`app/globals.css`. Shared components live in `components/studio-ui.jsx`; model
names and provider logo mappings live in `components/model-identity.jsx`.
The original studio logo is available in `public/brand/ai-studio-mark.svg`.
Provider asset sources and licenses are retained in `public/brands/`.

To add a shadcn component, run `npx shadcn@latest add <component>` from this folder.
The app uses the Radix Nova preset with JavaScript and Tailwind 4.

### Verify the UI

```bash
npm run lint
npm run build
npm run test:ui
```

Browser tests start a production preview on port 3100 and use controlled API
responses, so they do not require model inference. Coverage includes themes,
mobile navigation, keyboard dialogs, model selection and logos, copy/download,
stream formats, error handling, cancellation, and automated accessibility checks.
Windows uses installed Microsoft Edge. On other platforms, run
`npx playwright install chromium` first, or set `PLAYWRIGHT_CHANNEL` to an installed
browser channel. Screenshots and traces are written under `test-results/`.
