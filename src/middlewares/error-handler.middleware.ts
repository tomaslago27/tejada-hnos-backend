import { Request, Response, NextFunction } from 'express';

/**
 * Clase personalizada para errores de autenticación
 */
export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 401) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AuthError';
  }
}

/**
 * Middleware para manejar errores de forma centralizada
 */
export const errorHandler = (
  err: Error | AuthError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  if (err instanceof AuthError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
    });
    return;
  }

  // Error genérico
  res.status(500).json({
    error: 'InternalServerError',
    message: 'Ha ocurrido un error interno en el servidor',
  });
};
