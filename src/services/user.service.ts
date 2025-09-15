import { User } from "../models/user.model";

let users: User[] = [
  { id: 1, name: "Alice", email: "alice@mail.com" },
  { id: 2, name: "Bob", email: "bob@mail.com" }
];

// Obtener todos los usuarios
export const getAllUsers = (): User[] => {
  return users;
};

// Crear un nuevo usuario
export const createUser = (name: string, email: string): User => {
  const newUser: User = {
    id: Date.now(),
    name,
    email
  };
  users.push(newUser);
  return newUser;
};
