import type { Request, Response, NextFunction } from 'express';
import z, { type ZodSchema } from 'zod'; //idk how to fix this honestly
import { sendError } from '../lib/response.js';

/** HOW TO USE:
 * Validate more than one target (body, query, params) at the same time
 * ```ts
 * router.put(
 *   '/:id', 
 *   validate(getCarSchema, 'params'),   // Validate the ID in the URL
 *   validate(updateCarSchema, 'body'),  // Validate the data in the Body
 *   carController.update
 * );
 * ```
 */
type ValidateTarget = 'body' | 'query' | 'params';

/**
 * Validates the request body, query, or params against a Zod schema.
 * @param schema - The Zod schema to validate against.
 * @param target - The target to validate (body, query, or params).
 * @returns A middleware function that validates the request.
 */
export function validate(schema: ZodSchema, target: ValidateTarget = 'body') 
{
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const messages = result.error.issues
        .map((e: z.core.$ZodIssue) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      
      return sendError(res, messages, 422);
    } 

    req[target] = result.data;
    next();
  }
}


