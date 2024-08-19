import { NextFunction, Request, Response } from "express";
import APIError from "../errors/APIError";

export function errorHandler(
    error: Error,
    _: Request,
    res: Response,
    next: NextFunction
) {
    if (error instanceof APIError) {
        return res.status(error.statusCode).json(error.serializeError());
    }
    res.status(500).json({
        success: false,
        status: "error",
        title: "Internal Server Error",
        message: error?.message,
    });
    next();
}