import { SignJwt, VerifyJWT } from "../lib/tokens";
import { cookieConfig } from "../configs/cookieConfig";
import { NextFunction, Request, Response } from "express";
import { JWTPayload } from "../types/globals";
import SessionServices from "../modules/sessions/sessions.services";

async function UserDeserializer(req: Request, res: Response, next: NextFunction) {
    try {
        const { access_token, session_id } = req.cookies

        if (!access_token && !session_id) {
            return next();
        }

        const payload = VerifyJWT(access_token) as JWTPayload;

        req.user = payload

        try {
            const userToken = SignJwt({
                ...payload,
            }, { expiresIn: "5m" });
            await SessionServices.refreshSession(session_id, payload.id, 5 * 60)

            res.cookie("access_token", userToken, cookieConfig({ maxAge: 5 * 60 * 1000 }));
            res.cookie("session_id", session_id, cookieConfig({ maxAge: 5 * 60 * 1000 }));
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