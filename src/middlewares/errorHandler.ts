import { NextFunction, Request, Response } from "express";
import APIError from "../errors/APIError";
import { errorlogger } from "../configs/logger";

export function errorHandler(
    error: Error,
    _: Request,
    res: Response,
    next: NextFunction
) {
    if (error instanceof APIError) {
        return res.status(error.statusCode).json(error.serializeError());
    }

    errorlogger.error(error?.message)
    res.status(500).json({
        success: false,
        status: "error",
        title: "Internal Server Error",
        message: error?.message,
    });
    next();
}