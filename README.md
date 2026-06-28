# ProCerix Platform

## Environment Setup

To run ProCerix locally or in production, you need to configure your environment variables. 
Copy the provided `.env.example` file to create your local environment configuration:

```bash
cp .env.example .env.local
```

### Environment Variables

#### App
- `NEXT_PUBLIC_APP_URL`: The base URL of the application (e.g., `http://localhost:3000` or `https://procerix.com`).

#### Supabase
Obtain these from your [Supabase Dashboard](https://supabase.com/dashboard) under Project Settings > API.
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase public anonymous key.
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase secret service role key (keep this secure, do not expose to the frontend).

#### Cashfree (Payments)
Obtain these from your [Cashfree Merchant Dashboard](https://merchant.cashfree.com).
- `CASHFREE_APP_ID`: Your Cashfree API App ID.
- `CASHFREE_SECRET_KEY`: Your Cashfree API Secret Key.
- `CASHFREE_ENV`: Set to `SANDBOX` for testing or `PRODUCTION` for live payments.

#### Gemini AI
Obtain this from [Google AI Studio](https://aistudio.google.com).
- `GEMINI_API_KEY`: API key for generating courses, resumes, and optimizing LinkedIn profiles.

#### Cron / AI Worker
- `CRON_SECRET`: A secure, randomly generated string used to authenticate automated cron job requests to the AI worker endpoints.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
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

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
