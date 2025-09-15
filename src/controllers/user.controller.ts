import { Request, Response } from "express";
import * as userService from "../services/user.service";

export const getUsers = (req: Request, res: Response) => {
  const users = userService.getAllUsers();
  res.json(users);
};

export const createUser = (req: Request, res: Response) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Nombre y email son requeridos" });
  }

  const newUser = userService.createUser(name, email);
  res.status(201).json({ message: "Usuario creado", user: newUser });
};
