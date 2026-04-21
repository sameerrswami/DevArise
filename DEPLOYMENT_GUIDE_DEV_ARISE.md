# 🚀 DevArise AI - Deployment Guide

This guide contains everything you need to finish deploying **DevArise AI** (formerly NeuroLearn AI) to Vercel, Render, and GitHub.

## 🔗 GitHub status
- ✅ Repository created and renamed to: **DevArise**
- ✅ URL: [https://github.com/sameerrswami/DevArise](https://github.com/sameerrswami/DevArise)
- ✅ Latest code pushed with "DevArise" name updates.

---

## ⚡ Vercel Deployment
1. **Import Project**: Go to [vercel.com/new](https://vercel.com/new) and select the `DevArise` repository.
2. **Framework**: Ensure **Next.js** is selected.
3. **Environment Variables**: Add the following (Copy-Paste them):

| Key | Value |
| :--- | :--- |
| `DATABASE_URL` | `your_database_url_from_env_local` |
| `NEXTAUTH_SECRET` | `your_nextauth_secret_from_env_local` |
| `GOOGLE_CLIENT_ID` | `your_google_client_id_from_env_local` |
| `GOOGLE_CLIENT_SECRET` | `your_google_client_secret_from_env_local` |
| `GEMINI_API_KEY` | `your_gemini_api_key_from_env_local` |
| `YOUTUBE_API_KEYS` | `your_youtube_api_keys_from_env_local` |
| `NEXTAUTH_URL` | `https://devarise-ai.vercel.app` (Or your Vercel URL) |
| `NEXT_PUBLIC_APP_URL` | `https://devarise-ai.vercel.app` (Or your Vercel URL) |

4. **Deploy**: Click **Deploy**.

---

## ☁️ Render Deployment
1. **Create Web Service**: Go to [dashboard.render.com/web/new](https://dashboard.render.com/web/new).
2. **Connect Repo**: Select `DevArise`.
3. **Settings**:
   - **Name**: `devarise`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
4. **Env Vars**: Add the same variables as above. Note that `NEXTAUTH_URL` should be `https://devarise.onrender.com`.
5. **Create**: Click **Create Web Service**.

---

## 📝 Post-Deployment Tasks
- After Vercel gives you a URL, update your **Google Cloud Console** authorized redirect URIs to include `<YOUR_VERCEL_URL>/api/auth/callback/google`.
- Update `NEXTAUTH_URL` in your Vercel/Render settings if the automatic one is different.
