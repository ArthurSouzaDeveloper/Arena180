import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodEffects } from 'zod';

type Schema = AnyZodObject | ZodEffects<AnyZodObject>;

/** Validates req.body against a Zod schema, replacing it with the parsed result. */
export function validateBody(schema: Schema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.body = schema.parse(req.body);
    next();
  };
}

/** Validates req.query against a Zod schema, exposing the parsed result via res.locals.query. */
export function validateQuery(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.locals.query = schema.parse(req.query);
    next();
  };
}
