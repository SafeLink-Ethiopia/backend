import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Advisor from "../models/Advisor";
import Conversation from "../models/Conversation";

export type Actor =
  | { role: "user"; session_id: string }
  | { role: "advisor"; advisor_id: string };

export interface AccessRequest extends Request {
  actor?: Actor;
}

// Returns the advisor_id from a valid advisor JWT, otherwise null.
function advisorIdFromToken(req: Request): string | null {
  const secret = process.env.JWT_SECRET;
  const header = req.header("authorization");
  if (!secret || !header?.startsWith("Bearer ")) return null;
  try {
    const p = jwt.verify(header.slice(7), secret) as {
      advisor_id?: string;
      role?: string;
    };
    return p.role === "advisor" && p.advisor_id ? p.advisor_id : null;
  } catch {
    return null;
  }
}

/**
 * Guards /conversation/:id routes.
 *
 * - advisor: valid advisor JWT, advisor still active, and the conversation is
 *   assigned to THIS advisor (so one advisor can't open another's threads).
 * - user: x-session-id header must match the conversation's session_id and the
 *   thread must not be hidden_for_user.
 *
 * Failures return 404 (not 403) so IDs can't be probed for existence.
 * Handlers should take the sender from req.actor.role, never from the body.
 *
 * NOTE: the user side is only as strong as the SafeLink ID. For real protection,
 * have session create/login issue a signed JWT { session_id, role: "user" } and
 * verify it here instead of trusting the header.
 */
export const conversationAccess =
  (allow: Array<"user" | "advisor">) =>
  async (req: AccessRequest, res: Response, next: NextFunction) => {
    try {
      const conversation_id = String(req.params.id);

      const advisor_id = allow.includes("advisor")
        ? advisorIdFromToken(req)
        : null;
      if (advisor_id) {
        const stillActive = await Advisor.exists({ advisor_id, active: true });
        if (!stillActive)
          return res.status(401).json({ error: "Not authorized." });

        const owns = await Conversation.exists({ conversation_id, advisor_id });
        if (!owns)
          return res.status(404).json({ error: "Conversation not found." });

        req.actor = { role: "advisor", advisor_id };
        return next();
      }

      const session_id = req.header("x-session-id");
      if (allow.includes("user") && session_id) {
        const owns = await Conversation.exists({
          conversation_id,
          session_id,
          hidden_for_user: { $ne: true },
        });
        if (!owns)
          return res.status(404).json({ error: "Conversation not found." });

        req.actor = { role: "user", session_id };
        return next();
      }

      return res.status(401).json({ error: "Not authorized." });
    } catch (err) {
      next(err);
    }
  };
