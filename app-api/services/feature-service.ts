import { userRepository } from "@/repositories/user-repository";
import { membershipRepository } from "@/repositories/membership-repository";
import { getAllFeatures } from "@/lib/feature-registry";
import type { FeatureCheckResult, FeatureDefinition } from "@/types";

/** Resolve the root user ID for a given user (walks up ancestors for sub-users). */
async function resolveRootId(
  userId: string,
): Promise<{ rootId: string; isSubUser: boolean }> {
  const user = await userRepository.findById(userId);
  if (!user) return { rootId: userId, isSubUser: false };

  const ancestors = (user as { ancestors?: string[] }).ancestors;
  if (ancestors?.length) {
    return { rootId: ancestors[0], isSubUser: true };
  }
  return { rootId: userId, isSubUser: false };
}

export const featureService = {
  async checkAccess(
    userId: string,
    featureKey: string,
  ): Promise<FeatureCheckResult> {
    const { rootId, isSubUser } = await resolveRootId(userId);

    // Look up definition for description/category
    const allDefs = await getAllFeatures();
    const def = allDefs.find((d) => d.key === featureKey);
    const description = def?.description ?? "";
    const category = def?.category ?? "";

    // 1. Check user's own memberships
    const memberships = await membershipRepository.findActiveByUserId(userId);
    for (const m of memberships) {
      if ((m.featureKeys as string[]).includes(featureKey)) {
        return {
          key: featureKey,
          description,
          category,
          enabled: true,
          source: "direct",
        };
      }
    }

    // 2. For sub-users, also check parent's memberships
    if (isSubUser) {
      const parentMemberships =
        await membershipRepository.findActiveByUserId(rootId);
      for (const m of parentMemberships) {
        if ((m.featureKeys as string[]).includes(featureKey)) {
          return {
            key: featureKey,
            description,
            category,
            enabled: true,
            source: "inherited",
          };
        }
      }
    }

    return {
      key: featureKey,
      description,
      category,
      enabled: false,
      source: "direct",
    };
  },

  async getEnabledFeatures(userId: string): Promise<FeatureCheckResult[]> {
    const results: FeatureCheckResult[] = [];
    const { rootId, isSubUser } = await resolveRootId(userId);

    // User's own memberships
    const memberships = await membershipRepository.findActiveByUserId(userId);
    const ownKeys = new Set(
      memberships.flatMap((m) => m.featureKeys as string[]),
    );

    // Parent's memberships (for sub-users)
    let parentKeys = new Set<string>();
    if (isSubUser) {
      const parentMemberships =
        await membershipRepository.findActiveByUserId(rootId);
      parentKeys = new Set(
        parentMemberships.flatMap((m) => m.featureKeys as string[]),
      );
    }

    const allDefs = await getAllFeatures();
    for (const def of allDefs) {
      if (ownKeys.has(def.key)) {
        results.push({
          key: def.key,
          description: def.description,
          category: def.category,
          enabled: true,
          source: "direct",
        });
      } else if (parentKeys.has(def.key)) {
        results.push({
          key: def.key,
          description: def.description,
          category: def.category,
          enabled: true,
          source: "inherited",
        });
      }
    }

    return results;
  },

  async getAllDefinitions(): Promise<FeatureDefinition[]> {
    return getAllFeatures();
  },
};
