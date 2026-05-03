export type FeatureRecord = {
  id: string;
  env: string;
  key: string;
  description: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type FeatureDefinition = {
  key: string;
  description: string;
  category: string;
};

export type FeatureCheckResult = {
  key: string;
  description: string;
  category: string;
  enabled: boolean;
  source: "direct" | "inherited";
};
