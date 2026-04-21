# NeuroLearn AI - Setup & Configuration Guide

## 📋 Overview
This guide walks you through setting up all required APIs and fixing any issues in the NeuroLearn AI platform.

---

## 🔧 Quick Start - 3 Steps

### Step 1: Copy Environment File
```bash
cp .env.example .env.local
```

### Step 2: Fill in Required API Keys (See Below)
Edit `.env.local` and fill in all `REQUIRED-FILL-HERE` values

### Step 3: Install & Run
```bash
npm install
npm run dev
```

---

## 📌 Required APIs to Configure

### 1️⃣ DATABASE (PostgreSQL) ⭐ CRITICAL
**Why:** All user data, courses, problems, and profiles stored here

```env
DATABASE_URL="postgresql://username:password@localhost:5432/neurolearn_db"
```

**Setup Steps:**
- Install PostgreSQL locally or use a cloud provider (Supabase, Railway, Vercel Postgres)
- Create a database
- Update the connection string
- Run migrations: `npx prisma migrate dev`

---

### 2️⃣ NEXTAUTH (Authentication) ⭐ CRITICAL
**Why:** User login, session management, JWT tokens

```env
NEXTAUTH_URL="http://localhost:3000"  # Change to your domain in production
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
```

**Generate Secret:**
```bash
openssl rand -base64 32
# Or use Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 3️⃣ GOOGLE OAUTH (Sign in with Google) 
**Why:** Social login - easier registration

**Get Credentials:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable "Google+ API" and "People API"
4. Create OAuth 2.0 credentials (Web Application)
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google` (production)

```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

---

### 4️⃣ LINKEDIN OAUTH (Sign in with LinkedIn)
**Why:** Professional social login

**Get Credentials:**
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create new app
3. Get Client ID & Secret
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/linkedin`
   - `https://yourdomain.com/api/auth/callback/linkedin` (production)

```env
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"
```

---

### 5️⃣ FACEBOOK OAUTH (Sign in with Facebook)
**Why:** Additional social login option

**Get Credentials:**
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create new app
3. Add Facebook Login product
4. Get App ID & Secret
5. Add Valid OAuth Redirect URIs:
   - `http://localhost:3000/api/auth/callback/facebook`
   - `https://yourdomain.com/api/auth/callback/facebook` (production)

```env
FACEBOOK_CLIENT_ID="your-facebook-client-id"
FACEBOOK_CLIENT_SECRET="your-facebook-client-secret"
```

---

### 6️⃣ GEMINI API (AI Tutor, Roadmap, Interview) ⭐ CRITICAL
**Why:** Powers all AI features - AI Tutor, Placement Roadmaps, Interview Prep

**Get API Key:**
1. Go to [Google AI Studio](https://ai.google.dev/)
2. Click "Create API Key"
3. Copy and save

```env
GEMINI_API_KEY="your-gemini-api-key"
```

**Features Using Gemini:**
- AI Tutor explanations
- Placement roadmap generation
- Interview question generation
- Resume analysis
- Code explanation

---

### 7️⃣ YOUTUBE API (Video Integration)
**Why:** Fetch educational videos, summaries, quizzes

**Get API Keys:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable "YouTube Data API v3"
3. Create API key (in "Credentials")
4. You can create multiple keys for load balancing

```env
YOUTUBE_API_KEYS="key1,key2,key3"
```

**Note:** Comma-separated for load balancing. Use at least 1, preferably 2-3 keys to avoid rate limits.

---

### 8️⃣ STRIPE (Premium Subscriptions) 
**Why:** Payment processing, subscription plans

**Get Credentials:**
1. Sign up at [Stripe](https://stripe.com)
2. Go to [Dashboard](https://dashboard.stripe.com/)
3. Find API keys under "Developers" → "API Keys"
4. Use **Test Keys** for development

```env
STRIPE_SECRET_KEY="sk_test_YOUR_SECRET_KEY"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET"
```

**Create Price IDs:**
1. In Stripe Dashboard → Products
2. Create 3 products:
   - Monthly Premium ($9.99/month)
   - Yearly Premium ($99.99/year)
   - Lifetime ($199.99 one-time)
3. Each product should have a Price ID (starts with `price_`)

```env
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID="price_ABC123XYZ"
NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID="price_DEF456UVW"
NEXT_PUBLIC_STRIPE_LIFETIME_PRICE_ID="price_GHI789RST"
```

**Set Up Webhook:**
1. In Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Subscribe to events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
4. Copy Signing Secret to `STRIPE_WEBHOOK_SECRET`

---

### 9️⃣ APPLICATION URLs
**Why:** For proper redirects and WebSocket connections

```env
NEXTAUTH_URL="http://localhost:3000"  # For NextAuth callbacks
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # For frontend, WebSockets
```

**In Production:**
```env
NEXTAUTH_URL="https://www.yourdomain.com"
NEXT_PUBLIC_APP_URL="https://www.yourdomain.com"
```

---

### 🔟 OPTIONAL - Email Configuration
**Why:** Password reset emails, notifications

Using Gmail with App Password:
1. Enable 2-Factor Authentication on Google Account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate password for "Mail"

```env
MAIL_HOST="smtp.gmail.com"
MAIL_PORT="587"
MAIL_USER="your-email@gmail.com"
MAIL_PASS="app-password-from-google"
FROM_EMAIL="noreply@neurolearn.com"
```

---

## ✅ Checklist Before Running

- [ ] `.env.local` created with all required values
- [ ] PostgreSQL database set up and connection string added
- [ ] NEXTAUTH_URL and NEXTAUTH_SECRET configured
- [ ] Google OAuth credentials filled
- [ ] Gemini API key added
- [ ] YouTube API keys added
- [ ] (Optional) Stripe keys and price IDs added
- [ ] (Optional) LinkedIn OAuth configured
- [ ] (Optional) Facebook OAuth configured
- [ ] (Optional) Email configuration done

---

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev

# Open in browser
# http://localhost:3000
```

---

## 🐛 Common Issues & Fixes

### Issue: "Error: Missing required environment variable: GEMINI_API_KEY"
**Fix:** Add `GEMINI_API_KEY` to `.env.local`

### Issue: "Invalid OAuth configuration"
**Fix:** Ensure OAuth redirect URIs in provider settings include `http://localhost:3000/api/auth/callback/[provider]`

### Issue: "No YouTube API keys configured"
**Fix:** Add at least one YouTube API key to `YOUTUBE_API_KEYS`

### Issue: "Stripe webhook signature verification failed"
**Fix:** Make sure `STRIPE_WEBHOOK_SECRET` is set correctly and webhook endpoint is accessible

### Issue: Database connection error
**Fix:** Verify PostgreSQL is running and `DATABASE_URL` is correct

### Issue: NextAuth session not working
**Fix:** Ensure `NEXTAUTH_SECRET` is set to a 32-character random string

---

## 📞 Support

For API-specific documentation:
- **Google APIs:** https://developers.google.com/
- **Stripe:** https://stripe.com/docs
- **NextAuth.js:** https://next-auth.js.org/
- **Gemini API:** https://ai.google.dev/docs

---

## 🔒 Security Tips

1. **Never commit `.env.local` to Git** - Add to `.gitignore`
2. **Rotate secrets regularly** - Especially `NEXTAUTH_SECRET` and webhook secrets
3. **Use test keys in development** - Never use production Stripe keys in dev
4. **Restrict API key usage** - Set API restrictions in cloud console
5. **Monitor API quotas** - Watch YouTube and Gemini API usage

---

Generated: April 21, 2026
