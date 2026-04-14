import type { NextFunction, Request, Response } from "express";
import type { ZodObject } from "zod";
import { ZodError } from "zod";
import ApiError from "../../common/utils/api.error.js";

export const validate = (schema: ZodObject) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsed = await schema.parseAsync(req.body);
        req.body = parsed;
        next();
    } catch (error: any) {
        if (error instanceof ZodError) {
            const errors = error.issues.map((err) => err.message);
            throw ApiError.badRequestError(res, errors.join(", "));
        }
        throw error;
    }
}
