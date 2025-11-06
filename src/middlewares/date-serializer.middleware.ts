import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para serializar fechas en respuestas JSON
 * 
 * Este middleware intercepta todas las respuestas y asegura que:
 * - Las fechas se envíen en formato ISO UTC al frontend
 * - El frontend siempre recibe fechas consistentes sin importar la zona horaria del servidor
 * 
 * NOTA: Este middleware es opcional. Las fechas ya se guardan y manejan en UTC,
 * pero esto asegura que la serialización JSON sea consistente.
 */
export const dateSerializerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const originalJson = res.json.bind(res);

  res.json = function (body: any): Response {
    if (body && typeof body === 'object') {
      body = transformDates(body);
    }
    return originalJson(body);
  };

  next();
};

/**
 * Transforma recursivamente todas las fechas en un objeto a formato ISO UTC
 * @param obj Objeto a transformar
 * @returns Objeto con fechas transformadas
 */
function transformDates(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Si es un Date, convertir a ISO string
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Si es un array, transformar cada elemento
  if (Array.isArray(obj)) {
    return obj.map(item => transformDates(item));
  }

  // Si es un objeto, transformar recursivamente cada propiedad
  if (typeof obj === 'object') {
    const transformed: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        transformed[key] = transformDates(obj[key]);
      }
    }
    return transformed;
  }

  // Otros tipos (string, number, boolean) se retornan tal cual
  return obj;
}
