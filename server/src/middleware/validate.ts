import { AnyZodObject, ZodEffects } from "zod";
import { Request, Response, NextFunction } from "express";

type Schema = AnyZodObject | ZodEffects<AnyZodObject>;

export function validateRequest(schema: Schema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    next();
  };
}
