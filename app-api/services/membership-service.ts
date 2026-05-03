import { membershipRepository } from "@/repositories/membership-repository";
import type { MembershipRecord } from "@/types";

export const membershipService = {
  async getActiveByUserId(userId: string): Promise<MembershipRecord[]> {
    const memberships = await membershipRepository.findActiveByUserId(userId);
    return memberships as MembershipRecord[];
  },

  async getAllByUserId(userId: string): Promise<MembershipRecord[]> {
    const memberships = await membershipRepository.findByUserId(userId);
    return memberships as MembershipRecord[];
  },

  async grantFromPurchase(
    userId: string,
    purchaseId: string,
    featureKeys: string[],
  ): Promise<MembershipRecord> {
    // Revoke any existing membership from this purchase
    await membershipRepository.revokeBySourceId(purchaseId);

    const membership = await membershipRepository.create({
      userId,
      type: "purchase",
      sourceId: purchaseId,
      featureKeys,
    });
    return membership as MembershipRecord;
  },

  async revokeBySource(sourceId: string): Promise<void> {
    await membershipRepository.revokeBySourceId(sourceId);
  },

  async revoke(id: string): Promise<MembershipRecord> {
    const membership = await membershipRepository.revoke(id);
    return membership as MembershipRecord;
  },
};
