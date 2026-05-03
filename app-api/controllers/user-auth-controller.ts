import type { NextApiRequest, NextApiResponse } from "next";
import { sendOk, sendError } from "@/lib/api-response";
import {
  createUserSession,
  clearUserSession,
  getUserSession,
} from "@/lib/user-auth";
import { userService } from "@/services/user-service";

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

  try {
    const { email, password } = req.body ?? {};
    const user = await userService.authenticate(email, password);
    await createUserSession(user.id, res);
    sendOk(res, user);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed.";
    sendError(res, message, 401);
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
