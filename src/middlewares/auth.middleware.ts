import { Request, Response, NextFunction } from 'express';
import { JwtUtils } from '@utils/jwt.utils';
import { TokenPayload } from '@interfaces/auth.interface';

// Extender la interfaz Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware para autenticar usuarios mediante JWT
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        message: 'No se proporcionó token de autenticación' 
      });
      return;
    }

    const token = JwtUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({ 
        message: 'Token de autenticación inválido' 
      });
      return;
    }

    // Verificar token usando JwtUtils
    const payload = JwtUtils.verifyAccessToken(token);

    // Agregar información del usuario al request
    req.user = payload;

    next();
  } catch (error) {
    res.status(401).json({ 
      message: 'Token inválido o expirado',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
