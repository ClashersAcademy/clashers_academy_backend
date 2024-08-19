import jwt, { JwtPayload } from "jsonwebtoken"
import APIError from "../errors/APIError";

export const Token = process.env.JWT_TOKEN as string;

export async function SignJwt(payload: JwtPayload, options?: jwt.SignOptions, secret = Token) {
    try {
        return jwt.sign(payload, secret, options);
    } catch (error) {
        throw error;
    }
}

export async function VerifyJWT(token: string, secret = Token) {
    try {
        const payload = jwt.verify(token, secret) as JwtPayload;

        delete payload.iat
        delete payload.exp
        return payload
    } catch (error: any) {
        if (error.name === "JwtTokenExpired") {
            throw new APIError({
                STATUS: 401,
                TITLE: "JWT Token Expired",
                MESSAGE: "jwt token expired"
            })
        }
    }
}