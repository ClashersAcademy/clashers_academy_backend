import { NextFunction, Request, Response } from "express";
import APIError from "../errors/APIError";
import { USER_ERROR } from "../errors/userErrors";

/**
 * Middleware to ensure the user is authenticated.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The NextFunction callback.
 */
export async function requireUser(req: Request, res: Response, next: NextFunction) {
    const user = req.user;

    if (!user) {
        return next(new APIError(USER_ERROR.SESSION_INVALIDATED));
    }

    next();
}
