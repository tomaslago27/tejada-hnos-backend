import { UserRole } from "@/enums";

// src/interfaces/user.interface.ts
export interface IUser {
  id: string; // Usaremos UUID para los IDs
  email: string;
  name: string;
  lastName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
