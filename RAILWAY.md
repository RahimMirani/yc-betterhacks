# Railway deployment (monorepo)

If Railway builds from the **repo root**, you get:

```text
Script start.sh not found
✖ Railpack could not determine how to build the app.
```

Use **Option A** (Root Directory) or **Option B** (root Dockerfile) below.

---

## Option A: Set Root Directory (recommended)

### Where to find it

**Root Directory** is under **Source** (where your repo is connected), not under Build or General:

1. Click your **service** on the project canvas.
2. Open the **Settings** tab.
3. Find the **"Source"** or **"Service Source"** section (where the connected GitHub repo is shown).
4. In that section, look for **Root Directory** — or an **Edit** / **Configure** link next to the repo.
5. Set it to `backend` or `frontend`, save, then **Redeploy**.

If you don’t see it: scroll the whole Settings page; it can be near the top or under a “Repository” / “Source” area.

### Values

| Service  | Root Directory |
|----------|----------------|
| Backend  | `backend`      |
| Frontend | `frontend`     |

---

## Option B: No Root Directory — build from repo root

If your Railway UI doesn’t show Root Directory, you can still deploy by pointing the **backend** at a Dockerfile under the repo root.

### Backend (one service) — build from repo root

A **`Dockerfile`** at the repo root builds the backend (copies from `backend/`). Railway will pick it up when the build context is the repo root:

1. In the **backend** service: **Settings** → **Build**.
2. **Builder:** **Dockerfile**.
3. **Dockerfile Path:** leave **empty** or set to **`Dockerfile`** (so Railway uses the root `Dockerfile`).
4. **Settings** → **Deploy** → **Start Command:** `node dist/index.js`.
5. Save and **Redeploy**.

### Frontend (second service) — same repo, root Dockerfile

A **`Dockerfile.frontend`** at the repo root builds and serves the UI. Use it for a second service:

1. In your Railway **project**, click **+ New** → **GitHub Repo** and select the **same repo** again (or **Empty Service** then connect the same repo).
2. Open the new service → **Settings** → **Build**.
3. **Builder:** **Dockerfile**.
4. **Dockerfile Path:** **`Dockerfile.frontend`**.
5. **Settings** → **Deploy** → **Start Command:** leave empty (the Dockerfile already has `CMD ["serve", "-s", "build"]`).
6. Open the **Variables** tab and add:
   - **`REACT_APP_API_URL`** = your backend URL, e.g. `https://your-backend.up.railway.app`  
   (Use the backend service’s public URL from **Settings → Networking → Domain**.)
7. Save and **Deploy** (or trigger a redeploy).
8. In **Settings → Networking**, generate a **public domain** for this service so you can open the UI in the browser.

**Important:** `REACT_APP_API_URL` is used at **build time**. If you change it later, redeploy so the app is rebuilt with the new URL.

---

## Summary

| Service  | Root Directory (Option A) | Fallback (Option B)                    |
|----------|---------------------------|----------------------------------------|
| Backend  | `backend`                 | Root `Dockerfile` (builds from `backend/`) |
| Frontend | `frontend`                | Root `Dockerfile.frontend` (builds from `frontend/`) |
