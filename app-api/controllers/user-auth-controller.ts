import type { NextApiRequest, NextApiResponse } from "next";
import { sendOk, sendError } from "@/lib/api-response";
import {
  createUserSession,
  clearUserSession,
  getUserSession,
} from "@/lib/user-auth";
import { userService } from "@/services/user-service";
import { checkRateLimit, USER_LOGIN_LIMIT } from "@/lib/rate-limiter";
import { logActivity } from "@/lib/activity-logger";

function getIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

export async function userLoginController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    sendError(res, "Method not allowed.", 405);
    return;
  }

  const ip = getIp(req);
  const limit = checkRateLimit(ip, "user.login", USER_LOGIN_LIMIT);
  if (!limit.allowed) {
    res.setHeader(
      "Retry-After",
      String(Math.ceil((limit.resetAt.getTime() - Date.now()) / 1000)),
    );
    sendError(res, "Too many login attempts. Please try again later.", 429);
    return;
  }

  const { email, password } = req.body ?? {};

  if (
    !email ||
    typeof email !== "string" ||
    !password ||
    typeof password !== "string"
  ) {
    sendError(res, "Email and password are required.", 400);
    return;
  }

  try {
    const user = await userService.authenticate(email, password);
    await createUserSession(user.id, res);
    await logActivity(req, "user.login", {
      actor: "user",
      actorId: user.id,
      actorEmail: user.email,
      resource: "user",
      resourceId: user.id,
    });
    sendOk(res, user);
  } catch (err) {
    await logActivity(req, "user.login_failed", {
      actor: "system",
      metadata: { email: String(email).toLowerCase().trim() },
    });
    sendError(res, "Invalid email or password.", 401);
  }
}

export async function userRegisterController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    sendError(res, "Method not allowed.", 405);
    return;
  }

  try {
    const user = await userService.register(req.body);
    if (!user) {
      sendError(res, "Registration failed.", 400);
      return;
    }
    await createUserSession(user.id, res);
    await logActivity(req, "user.register", {
      actor: "user",
      actorId: user.id,
      actorEmail: user.email,
      resource: "user",
      resourceId: user.id,
    });
    sendOk(res, user, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed.";
    sendError(res, message, 400);
  }
}

export async function userLogoutController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    sendError(res, "Method not allowed.", 405);
    return;
  }

  await logActivity(req, "user.logout", { resource: "user" });
  await clearUserSession(req, res);
  sendOk(res, null);
}

export async function userMeController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "GET") {
    sendError(res, "Method not allowed.", 405);
    return;
  }

  const session = await getUserSession(req);
  if (!session) {
    sendError(res, "Not authenticated.", 401);
    return;
  }

  sendOk(res, session.user);
}
