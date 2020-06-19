export interface User {
  name: string;
  email: string;
  passwordHash?: string;
  isActive?: boolean;
  createAt: string;
  updatedAt: string;
}
