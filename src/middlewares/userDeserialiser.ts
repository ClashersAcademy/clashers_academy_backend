import { SignJwt, VerifyJWT } from "../lib/tokens";
import { cookieConfig } from "../configs/cookieConfig";
import { NextFunction, Request, Response } from "express";
import { JWTPayload } from "../types/globals";

async function UserDeserializer(req: Request, res: Response, next: NextFunction) {
    try {
        const { access_token } = req.cookies

        if (!access_token) {
            return next();
        }

        const payload = await VerifyJWT(access_token) as JWTPayload;

        req.user = payload

        try {
            const userToken = await SignJwt({
                ...payload,
            }, { expiresIn: "5m" });
            res.cookie("access_token", userToken, {
                maxAge: 300000, // 5 minutes
                httpOnly: true,
            })
        } catch (error) {
            throw error;
        }
        return next();
    } catch (error) {
        res.cookie("access_token", "")
        throw error;
    }
}

export default UserDeserializer;