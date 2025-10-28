import { Request, Response, NextFunction } from 'express';

/**
 * Middleware que fusiona parámetros de la URL al body de la request
 * antes de la validación del DTO.
 * 
 * Útil para recursos anidados donde el ID del padre viene en la URL.
 * Ejemplo: POST /fields/:fieldId/plots
 * 
 * @param paramsToMerge - Array de nombres de parámetros a fusionar
 */
export const mergeParamsToBody = (paramsToMerge: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    paramsToMerge.forEach(param => {
      if (req.params[param]) {
        req.body[param] = req.params[param];
      }
    });
    next();
  };
};
