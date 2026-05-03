import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { sendError } from "@/lib/api-response";
import { getSessionSecret } from "@/lib/secure-credentials";
import type { Role, AuthSession } from "@/types";

export type { AuthUser, AuthSession } from "@/types";

const COOKIE_NAME = "admin_session";
const SESSION_DAYS = 7;

function hashToken(token: string) {
  return crypto
    .createHmac("sha256", getSessionSecret())
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

export async function createAdminSession(
  adminId: string,
  res: NextApiResponse,
) {
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);

  await prisma.adminSession.create({
    data: { adminId, tokenHash, expiresAt: sessionExpiry() },
  });

  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; ${cookieOptions(SESSION_DAYS * 24 * 60 * 60)}`,
  );
}

export async function clearAdminSession(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const token = req.cookies[COOKIE_NAME];
  if (token) {
    await prisma.adminSession.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; ${cookieOptions(0)}`);
}

export async function getAuthSession(
  req: NextApiRequest,
): Promise<AuthSession | null> {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { admin: true },
  });

  if (
    !session ||
    session.expiresAt < new Date() ||
    session.admin.status !== "active"
  ) {
    if (session) {
      await prisma.adminSession.deleteMany({
        where: { tokenHash: hashToken(token) },
      });
    }
    return null;
  }

  return {
    admin: {
      id: session.admin.id,
      name: session.admin.name,
      email: session.admin.email,
      role: session.admin.role as Role,
      status: session.admin.status,
    },
  };
}

export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedRoles: Role[] = ["admin", "editor"],
): Promise<AuthSession | null> {
  const session = await getAuthSession(req);

  if (!session) {
    sendError(res, "Authentication required.", 401);
    return null;
  }

  if (!allowedRoles.includes(session.admin.role)) {
    sendError(res, "You do not have permission to perform this action.", 403);
    return null;
  }

  return session;
}
