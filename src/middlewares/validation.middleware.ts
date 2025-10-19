import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

export function validateData(type: any, skipMissingProperties = false) {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Transformar el body plano a una instancia de la clase DTO
    const dtoInstance = plainToInstance(type, req.body);
    
    // 2. Validar la instancia
    validate(dtoInstance, { skipMissingProperties })
      .then((errors) => {
        if (errors.length > 0) {
          // 3. Si hay errores, formatearlos y enviar 400 Bad Request
          const message = errors.map(error => 
            Object.values(error.constraints!)
          ).flat().join(', ');

          return res.status(400).send({ message: `Validation failed: ${message}` });
        } else {
          // Reemplazar el req.body con la instancia limpia y tipada del DTO
          req.body = dtoInstance;
          next();
        }
      });
  };
}
