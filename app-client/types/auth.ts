export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

export type UpdateAdminProfileInput = {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
};
