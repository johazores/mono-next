export type ApiResult<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export type ResourceListResult<T = unknown> = {
  items: T[];
};
