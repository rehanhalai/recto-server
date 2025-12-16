import { NextFunction, Request, Response } from "express";
import { ZodObject, ZodError } from "zod";
import ApiResponse from "../utils/ApiResponse";

const validate =
  (schema: ZodObject<any, any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse({
        body: req.body || {},
        query: req.query || {},
        params: req.params || {},
      });

      req.body = result.body;

      Object.defineProperty(req, 'params', {
        value: result.params,
        configurable: true,
        writable: true
      });

      if (Object.keys(result.query as object).length > 0) {
        // Option A: If query is empty, do nothing. 
        // Option B: clear and assign (for strictness)
         for (const key in req.query) {
             delete (req.query as any)[key];
         }
         Object.assign(req.query, result.query);
      }
      
      next();
    } catch (error: any) {
      if (error instanceof ZodError) {
        res.status(400).json(new ApiResponse(400, error, "Validation Error"));
        return;
      }
      next(error);
    }
  };

export default validate;
