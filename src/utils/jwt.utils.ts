import jwt from 'jsonwebtoken';
import { TokenPayload } from '@interfaces/auth.interface';
import { ENV } from '@config/environment';

/**
 * Utilidades para trabajar con JWT
 */
export class JwtUtils {
  /**
   * Genera un access token (duración corta)
   */
  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(
      payload,
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN } as jwt.SignOptions
    );
  }

  /**
   * Genera un refresh token (duración más larga pero no más de 12h)
   */
  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(
      payload,
      ENV.JWT_REFRESH_SECRET,
      { expiresIn: ENV.JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
    );
  }

  /**
   * Verifica un access token
   */
  static verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Token de acceso inválido o expirado');
    }
  }

  /**
   * Verifica un refresh token
   */
  static verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, ENV.JWT_REFRESH_SECRET) as TokenPayload;
    } catch (error) {
      throw new Error('Refresh token inválido o expirado');
    }
  }

  /**
   * Decodifica un token sin verificar la firma
   * Útil para inspeccionar el contenido del token
   */
  static decode(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Obtiene el tiempo restante de vida de un token en segundos
   */
  static getTimeToExpire(token: string): number | null {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return null;
      }

      const expirationTime = decoded.exp * 1000; // Convertir a milisegundos
      const currentTime = Date.now();
      const timeRemaining = expirationTime - currentTime;

      return Math.max(0, Math.floor(timeRemaining / 1000)); // Retornar en segundos
    } catch (error) {
      return null;
    }
  }

  /**
   * Verifica si un token ha expirado
   */
  static isExpired(token: string): boolean {
    const timeToExpire = this.getTimeToExpire(token);
    return timeToExpire === null || timeToExpire <= 0;
  }

  /**
   * Verifica si un token está próximo a expirar (menos de 5 minutos)
   */
  static isAboutToExpire(token: string, thresholdSeconds: number = 300): boolean {
    const timeToExpire = this.getTimeToExpire(token);
    return timeToExpire !== null && timeToExpire > 0 && timeToExpire < thresholdSeconds;
  }

  /**
   * Extrae el token del header Authorization
   */
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Genera un token temporal (para casos especiales como reset de password)
   */
  static generateTemporaryToken(
    payload: object, 
    expiresIn: string = '15m'
  ): string {
    return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn } as jwt.SignOptions);
  }

  /**
   * Verifica un token temporal
   */
  static verifyTemporaryToken(token: string): any {
    try {
      return jwt.verify(token, ENV.JWT_SECRET);
    } catch (error) {
      throw new Error('Token temporal inválido o expirado');
    }
  }
}
