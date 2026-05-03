export type SubUser = {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
};

export type CreateSubUserInput = {
  email: string;
};

export type CreateSubUserResult = {
  user: SubUser;
  linked: boolean;
  generatedPassword: string | null;
};
