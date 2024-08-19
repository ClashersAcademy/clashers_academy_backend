import { CookieOptions } from "express";

export function cookieConfig({
    maxAge,
    sameSite = "none",
    httpOnly = true,
    domain = process.env.NODE_ENV === "prod"
        ? process.env.COOKIE_DOMAIN
        : "localhost",
    secure = true,
}: CookieOptions): CookieOptions {
    return {
        maxAge,
        sameSite,
        httpOnly,
        domain,
        secure,
    };
}