import { subscriptionRepository } from "@/repositories/subscription-repository";
import { planRepository } from "@/repositories/plan-repository";
import type { SubscriptionRecord } from "@/types";

export const subscriptionService = {
  async getActiveSubscription(
    userId: string,
  ): Promise<SubscriptionRecord | null> {
    const sub = await subscriptionRepository.findActiveByUserId(userId);
    return sub as SubscriptionRecord | null;
  },

  async getHistory(userId: string): Promise<SubscriptionRecord[]> {
    const subs = await subscriptionRepository.findByUserId(userId);
    return subs as SubscriptionRecord[];
  },

  async assign(
    userId: string,
    planId: string,
    options?: { externalId?: string; endDate?: string },
  ): Promise<SubscriptionRecord> {
    const plan = await planRepository.findById(planId);
    if (!plan) throw new Error("Plan not found.");
    if (!plan.isActive) throw new Error("This plan is no longer available.");

    // Cancel any active subscriptions
    await subscriptionRepository.cancelActiveByUserId(userId);

    const sub = await subscriptionRepository.create({
      user: { connect: { id: userId } },
      plan: { connect: { id: planId } },
      externalId: options?.externalId || null,
      endDate: options?.endDate ? new Date(options.endDate) : null,
    });

    return sub as SubscriptionRecord;
  },

  async cancel(userId: string): Promise<void> {
    await subscriptionRepository.cancelActiveByUserId(userId);

    // Assign free plan
    const freePlan = await planRepository.findBySlug("free");
    if (freePlan) {
      await subscriptionRepository.create({
        user: { connect: { id: userId } },
        plan: { connect: { id: freePlan.id } },
      });
    }
  },

  async checkExpired(): Promise<number> {
    const expired = await subscriptionRepository.findExpired();
    if (expired.length === 0) return 0;

    const ids = expired.map((s) => s.id);
    await subscriptionRepository.expireBatch(ids);
    return ids.length;
  },
};
