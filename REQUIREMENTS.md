Project requirements — what you need to provide before deploying

1) GitHub repository
   - A public or private GitHub repo containing this project. Example: https://github.com/youruser/neurolearn

2) Environment variables (minimum set)
   - DATABASE_URL
   - NEXTAUTH_URL
   - NEXTAUTH_SECRET
   - GEMINI_API_KEY
   - YOUTUBE_API_KEYS
   - RAZORPAY_KEY_ID
   - RAZORPAY_KEY_SECRET
   - RAZORPAY_WEBHOOK_SECRET
   - NEXT_PUBLIC_APP_URL
   - NODE_ENV=production

3) Accounts
   - Vercel account (connected to your GitHub) to deploy to Vercel
   - Render account (optional) to deploy using `render.yaml`

4) Database
   - PostgreSQL database (hosted on Supabase, Railway, or managed provider)
   - Run Prisma migrations after deployment (instructions in `DEPLOYMENT.md`)

5) Optional (for social login / email / AI features)
   - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (if using Google OAuth)
   - MAIL_HOST, MAIL_USER, MAIL_PASS (for password reset emails)

6) Local / CI requirements
   - Node.js 18+ (LTS recommended)
   - npm 9+
   - `npx prisma` available (installed via `npm install`)

If you want, paste your GitHub repo URL and tell me which provider you want first (Vercel or Render). I can then:
- Create a PR-ready branch with a minimal `render.yaml` and `vercel.json` (already added)
- Provide the exact env-vars list ready to copy-paste into Vercel/Render
- Walk through the deployment steps and run any migration commands you allow me to run locally
