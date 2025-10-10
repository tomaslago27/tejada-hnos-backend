import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@/enums';

/**
 * Middleware para autorizar usuarios por rol
 * @param allowedRoles Array de roles permitidos para acceder al endpoint
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      res.status(401).json({ 
        message: 'Usuario no autenticado' 
      });
      return;
    }

    // Verificar que el usuario tenga uno de los roles permitidos
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        message: 'No tienes permisos para acceder a este recurso',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
      return;
    }

    next();
  };
};
