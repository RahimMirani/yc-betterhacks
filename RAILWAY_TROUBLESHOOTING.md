# Railway: Why It Works Locally But Not When Deployed

Use this checklist when the app works locally but fails on Railway.

---

## 1. Frontend is calling the wrong URL (most common)

**Symptom:** "Unexpected token '<'" or API calls return HTML instead of JSON.

**Cause:** The built frontend has the wrong API URL (e.g. still `localhost:3001` or the frontend’s own URL).

**Fix:**

- In Railway → **Frontend** service → **Variables**, set:
  - **`REACT_APP_API_URL`** = your **backend’s public URL**  
    Example: `https://your-backend-name.up.railway.app` (no trailing slash).
- Get the backend URL from: **Backend** service → **Settings** → **Networking** → Domain.
- **Redeploy the frontend** after changing this (it’s used at **build** time).  
  If you only change the variable and don’t redeploy, the old wrong URL stays in the build.

---

## 2. Backend env vars missing on Railway

**Symptom:** Backend starts (e.g. `/health` works) but upload/explain/DB features fail or 500 errors.

**Cause:** Required env vars are set in local `.env` but not in Railway.

**Fix:**

- In Railway → **Backend** service → **Variables**, ensure you have:
  - **`DATABASE_URL`** – Neon (or other) Postgres connection string.
  - **`ANTHROPIC_API_KEY`** – Claude API key.
  - **`OPENAI_API_KEY`** – OpenAI API key (for embeddings).
- Optional: `GITHUB_TOKEN`, `GITHUB_USERNAME`, `FRONTEND_URL` (or `ALLOWED_ORIGINS`).
- Check **Backend** → **Deployments** → **View logs** for errors mentioning missing config or DB/API failures.

---

## 3. CORS blocking the frontend

**Symptom:** API requests from the frontend fail with CORS errors in the browser console.

**Cause:** Backend is only allowing certain origins and the frontend’s Railway URL isn’t included.

**Fix:**

- Either leave CORS open (default):
  - In **Backend** → **Variables**, do **not** set `ALLOWED_ORIGINS` or `FRONTEND_URL`  
    (backend defaults to `*` and allows all origins).
- Or restrict to your frontend:
  - In **Backend** → **Variables**, set:
    - **`FRONTEND_URL`** = your frontend’s public URL  
      Example: `https://your-frontend-name.up.railway.app`
  - Or **`ALLOWED_ORIGINS`** = same URL (or comma‑separated list).
- Redeploy the backend after changing variables.

---

## 4. Backend has no public URL

**Symptom:** Frontend can’t reach the API; requests fail or time out.

**Cause:** Backend service has no public domain, only an internal hostname (e.g. `*.railway.internal`).

**Fix:**

- In Railway → **Backend** service → **Settings** → **Networking** → **Public networking**.
- Click **Generate domain** (or use the one shown).
- Use that **public** URL (e.g. `https://….up.railway.app`) as:
  - **`REACT_APP_API_URL`** in the **frontend** service (then redeploy frontend), and
  - When testing in the browser (e.g. `https://that-url/health`).

---

## 5. Database / Neon connection issues

**Symptom:** Errors in backend logs about DB connection, timeouts, or SSL.

**Fix:**

- Use the **pooler** connection string from Neon (often `…-pooler.…` and port 5432).
- Ensure **`DATABASE_URL`** in Railway matches what works locally (same host, user, password, `?sslmode=require`).
- Neon usually allows connections from anywhere; if you have IP allowlisting, add Railway’s egress IPs or allow all for this DB.

---

## 6. Quick checks

| Check | How |
|-------|-----|
| Backend reachable | Open `https://<backend-public-url>/health` in browser; should return JSON `{"status":"ok",…}`. |
| Frontend API URL | After deploy, in browser DevTools → Network, click an API request and confirm Request URL is `https://<backend-public-url>/api/...`. |
| Backend errors | Railway → Backend → Deployments → latest → **View logs**. |
| Frontend build env | Redeploy frontend after changing `REACT_APP_API_URL`; consider a small code change + push to force a new build. |

---

## Summary

Most “works locally, fails on Railway” issues are:

1. **Wrong or missing `REACT_APP_API_URL`** → set to backend **public** URL and **redeploy frontend**.
2. **Missing backend env vars** on Railway → set `DATABASE_URL`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` (and optionally CORS) on the backend service.
3. **CORS** → leave default `*` or set `FRONTEND_URL` / `ALLOWED_ORIGINS` to the frontend’s public URL.
4. **No public domain for backend** → generate a domain for the backend and use it everywhere as the API URL.
