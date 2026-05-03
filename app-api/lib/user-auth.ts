import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { sendError } from "@/lib/api-response";
import { getUserSessionSecret } from "@/lib/secure-credentials";
import type { SubscriptionPlan, AccountStatus, UserAuthSession } from "@/types";

const COOKIE_NAME = "user_session";
const SESSION_DAYS = 30;

function hashToken(token: string) {
  return crypto
    .createHmac("sha256", getUserSessionSecret())
    .update(token)
    .digest("hex");
}

function sessionExpiry() {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

function cookieOptions(maxAge: number) {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge};${secure}`;
}

export async function createUserSession(userId: string, res: NextApiResponse) {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);

  await prisma.userSession.create({
    data: { userId, tokenHash, expiresAt: sessionExpiry() },
  });

  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; ${cookieOptions(SESSION_DAYS * 24 * 60 * 60)}`,
  );
}

export async function clearUserSession(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const token = req.cookies[COOKIE_NAME];
  if (token) {
    await prisma.userSession.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; ${cookieOptions(0)}`);
}

export async function getUserSession(
  req: NextApiRequest,
): Promise<UserAuthSession | null> {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return null;

  const session = await prisma.userSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (
    !session ||
    session.expiresAt < new Date() ||
    session.user.status !== "active"
  ) {
    if (session) {
      await prisma.userSession.deleteMany({
        where: { tokenHash: hashToken(token) },
      });
    }
    return null;
  }

  return {
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      status: session.user.status as AccountStatus,
      plan: session.user.plan as SubscriptionPlan,
      subscriptionEnds: session.user.subscriptionEnds,
    },
  };
}

export async function requireUser(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<UserAuthSession | null> {
  const session = await getUserSession(req);

  if (!session) {
    sendError(res, "Authentication required.", 401);
    return null;
  }

  return session;
}
