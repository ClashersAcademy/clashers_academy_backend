import { Request } from "express";

export interface JWTPayload {
    id: string;
    email: string;
    role: string;
    imageUrl?: string;
}

declare module "express" {
    export interface Request {
        user?: {
            id: string;
            email: string;
            role: string;
            imageUrl?: string;
        };
    }
}
