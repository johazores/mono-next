export type MembershipType = "purchase";
export type MembershipStatus = "active" | "expired" | "revoked";

export type MembershipRecord = {
  id: string;
  env: string;
  userId: string;
  type: MembershipType;
  sourceId: string;
  featureKeys: string[];
  status: MembershipStatus;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
