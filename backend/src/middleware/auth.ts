import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Attach session to request for downstream handlers
    (req as any).user = session.user;
    (req as any).session = session.session;

    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
