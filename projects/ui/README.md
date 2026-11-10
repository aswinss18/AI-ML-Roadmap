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

Run the FastAPI app from `projects/sales-brochure-generator` and start this
Next.js app on port 3000. The API allows browser requests from the local Next.js
development origins.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
