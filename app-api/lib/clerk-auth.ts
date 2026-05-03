import type { NextApiRequest } from "next";
import { settingService } from "@/services/setting-service";

type ClerkJwtPayload = {
  sub: string;
  email?: string;
  name?: string;
};

/**
 * Verify a Clerk JWT from the Authorization header.
 * Uses Clerk's JWKS endpoint to validate the token.
 */
export async function verifyClerkToken(
  req: NextApiRequest,
): Promise<ClerkJwtPayload | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  if (!token) return null;

  const config = await settingService.getAuthConfig();
  if (config.provider !== "clerk" || !config.clerkSecretKey) return null;

  try {
    const { verifyToken, createClerkClient } = await import("@clerk/backend");
    const { sub } = await verifyToken(token, {
      secretKey: config.clerkSecretKey,
    });

    // Fetch full user data from Clerk
    const clerk = createClerkClient({ secretKey: config.clerkSecretKey });
    const clerkUser = await clerk.users.getUser(sub);

    return {
      sub,
      email: clerkUser.emailAddresses?.[0]?.emailAddress,
      name:
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
        undefined,
    };
  } catch {
    return null;
  }
}
