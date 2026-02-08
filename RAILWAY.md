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

### Frontend (second service)

For the frontend you still need the build to run inside `frontend/`. Options:

- Use **Root Directory** = `frontend` if it appears anywhere (e.g. under Source after a UI update), or
- Create a **second service**, connect the same repo, and try again for Root Directory or a root Dockerfile for the frontend (e.g. `Dockerfile.frontend` at root).

---

## Summary

| Service  | Root Directory (Option A) | Fallback (Option B)                    |
|----------|---------------------------|----------------------------------------|
| Backend  | `backend`                 | Dockerfile path: `backend/Dockerfile` or root `Dockerfile.backend` |
| Frontend | `frontend`                | Set Root Directory when available      |
