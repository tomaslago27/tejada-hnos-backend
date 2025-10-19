import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request, Response, NextFunction } from 'express';

export function validateData(type: any, skipMissingProperties = false) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // If there's no body or it's empty, return a structured errors array
      const bodyIsEmpty = req.body === undefined || req.body === null || (typeof req.body === 'object' && Object.keys(req.body).length === 0);
      if (bodyIsEmpty) {
        return res.status(400).json({ errors: [{ message: 'Request body is required' }] });
      }

      // 1. Transform plain body to DTO instance
      const dtoInstance = plainToInstance(type, req.body);

      // 2. Validate the instance
      validate(dtoInstance, { skipMissingProperties })
        .then((errors) => {
          if (errors.length > 0) {
            // Map class-validator errors to an array of { field, message }
            const formatted = errors.map(error => {
              const constraints = error.constraints || {};
              const messages = Object.values(constraints) as string[];
              return {
                field: error.property,
                message: messages.join(', ')
              };
            });

            return res.status(400).json({ errors: formatted });
          } else {
            // Replace req.body with the typed DTO instance and continue
            req.body = dtoInstance;
            next();
          }
        })
        .catch((err) => {
          // Unexpected errors during validation should be forwarded to the error handler
          next(err);
        });
    } catch (err) {
      // Synchronous errors (e.g. unexpected runtime errors)
      return res.status(400).json({ errors: [{ message: 'Invalid request body' }] });
    }
  };
}
