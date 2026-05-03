export type FeatureFlag = {
  key: string;
  description: string;
  category: string;
  enabled: boolean;
  source: "direct" | "inherited";
};
