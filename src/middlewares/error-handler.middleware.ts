import { Request, Response, NextFunction } from 'express';
import { ENV } from '@config/environment';

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
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  // Log completo para facilitar debugging
  console.error('Error caught by errorHandler:', err);

  // Manejar errores típicos como JSON parse errors que Express puede lanzar
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400 && 'body' in err) {
    return res.status(400).json({ errors: [{ message: 'Invalid JSON payload' }] });
  }

  // Si es AuthError, respetar su código
  if (err instanceof AuthError) {
    const item: any = { message: err.message, name: err.name };
    if (process.env.NODE_ENV !== 'production') item.stack = (err as any)?.stack;
    return res.status(err.statusCode).json({ errors: [item] });
  }

  // Otros errores: intentar obtener statusCode si existe
  const anyErr = err as any;
  const statusCode = typeof anyErr?.statusCode === 'number' ? anyErr.statusCode : (typeof anyErr?.status === 'number' ? anyErr.status : 500);

  const message = anyErr?.message || 'An internal server error occurred';
  const name = anyErr?.name || 'InternalServerError';

  const item: any = { message, name };
  if (process.env.NODE_ENV !== 'production') {
    item.stack = anyErr?.stack;
  }

  res.status(statusCode).json({ errors: [item] });
};
