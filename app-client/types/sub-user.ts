export type SubUser = {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
};

export type CreateSubUserInput = {
  name: string;
  email: string;
  password: string;
};
