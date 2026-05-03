import crypto from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getAppEnv } from "@/lib/env";
import { sendError } from "@/lib/api-response";
import { getUserSessionSecret } from "@/lib/secure-credentials";
import { verifyClerkToken } from "@/lib/clerk-auth";
import { settingService } from "@/services/setting-service";
import type { AccountStatus, UserAuthSession } from "@/types";

const COOKIE_NAME = "user_session";
const SESSION_DAYS = 14;

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
  // Check auth provider config
  const authConfig = await settingService.getAuthConfig();

  if (authConfig.provider === "clerk") {
    return getClerkUserSession(req);
  }

  return getCredentialUserSession(req);
}

async function getClerkUserSession(
  req: NextApiRequest,
): Promise<UserAuthSession | null> {
  const clerkPayload = await verifyClerkToken(req);
  if (!clerkPayload?.email) return null;

  const email = clerkPayload.email.toLowerCase().trim();
  const env = getAppEnv();

  // Look up by clerkId first, then fall back to email
  let user = clerkPayload.sub
    ? await prisma.user.findFirst({
        where: { clerkId: clerkPayload.sub },
      })
    : null;

  if (!user) {
    // Check if a user with this email already exists (e.g. migrated from credentials)
    user = await prisma.user.findUnique({
      where: { env_email: { env, email } },
    });

    if (user) {
      // Link existing user to Clerk
      user = await prisma.user.update({
        where: { id: user.id },
        data: { clerkId: clerkPayload.sub },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          clerkId: clerkPayload.sub,
          name: clerkPayload.name || clerkPayload.email,
          passwordHash: "", // No password for Clerk users
          status: "active",
        },
      });
    }
  }

  if (user.status !== "active") return null;

  return buildUserAuthSession(user);
}

async function getCredentialUserSession(
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

  return buildUserAuthSession(session.user);
}

async function buildUserAuthSession(user: {
  id: string;
  name: string;
  email: string;
  status: string;
  parentId: string | null;
}): Promise<UserAuthSession> {
  // Fetch active subscription (recurring purchase)
  let activeSub = await prisma.purchase.findFirst({
    where: {
      userId: user.id,
      status: "active",
      product: { paymentModel: "recurring" },
    },
    include: { product: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Sub-users inherit their parent's plan when they have no own subscription
  if (!activeSub && user.parentId) {
    activeSub = await prisma.purchase.findFirst({
      where: {
        userId: user.parentId,
        status: "active",
        product: { paymentModel: "recurring" },
      },
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  // Fetch parent info if this is a sub-user
  let parentInfo: { name: string; email: string } | null = null;
  if (user.parentId) {
    const parentUser = await prisma.user.findUnique({
      where: { id: user.parentId },
      select: { name: true, email: true },
    });
    if (parentUser) {
      parentInfo = { name: parentUser.name, email: parentUser.email };
    }
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status as AccountStatus,
      parentId: user.parentId,
      parent: parentInfo,
      activePlan: activeSub
        ? {
            name: activeSub.product.name,
            slug: activeSub.product.slug,
            endDate: activeSub.endDate,
          }
        : null,
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
