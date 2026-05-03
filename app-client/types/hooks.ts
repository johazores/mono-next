import type { FeatureFlag } from "./feature";

export type FeaturesState = {
  features: FeatureFlag[];
  loading: boolean;
  error: string;
};

export type AdminResourceState<T> = {
  items: T[];
  loading: boolean;
  error: string;
};
