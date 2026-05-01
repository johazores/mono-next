export type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: string;
};

export type ListResponse<T> = {
  items: T[];
};
