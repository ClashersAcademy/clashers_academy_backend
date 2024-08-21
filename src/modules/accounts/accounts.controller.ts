import { NextFunction, Request, Response } from "express";
import { AccountServices, googleAccountsClient } from "./accounts.services";
import APIError from "../../errors/APIError";
import { USER_ERROR } from "../../errors/userErrors";
import UserServices from "../users/users.services";
import { IUser } from "../users/users.modal";
import Respond from "../../lib/Respond";

export default class AccountController {
    /**
     * Redirects to Google for authentication.
     * @param req - The Express request object.
     * @param res - The Express response object.
     */
    static async GoogleAuthRedirect(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user
            const provider = "google"
            if (user && await AccountServices.findAccountByUserIdAndProvider(user.id, "google")) {
                throw new APIError({
                    MESSAGE: `Account already linked with provider ${provider}`,
                    STATUS: 400,
                    TITLE: "ACCOUNT_ALREADY_LINKED"
                });
            }

            const authUrl = AccountServices.getGoogleAuthLink();
            return res.redirect(authUrl);
        } catch (error) {
            next(error)
        }
    }
    /**
     * Redirects to Discord for authentication.
     * @param req - The Express request object.
     * @param res - The Express response object.
     * @param next - The Express next function.
     */
    static async redirectToDiscord(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user
            const provider = "discord"
            if (user && await AccountServices.findAccountByUserIdAndProvider(user.id, "discord")) {
                throw new APIError({
                    MESSAGE: `Account already linked with provider ${provider}`,
                    STATUS: 400,
                    TITLE: "ACCOUNT_ALREADY_LINKED"
                });
            }

            const authUrl = AccountServices.getDiscordAuthLink();
            return res.redirect(authUrl);
        } catch (error) {
            next(error)
        }
    }

    /**
     * Handles Google OAuth callback and login.
     * @param req - The Express request object.
     * @param res - The Express response object.
     * @param next - The Express next function.
     */
    static async GoogleOAuthCallback(req: Request, res: Response, next: NextFunction) {
        try {
            const { code } = req.query;
            const jwtUser = req.user
            if (!code || !jwtUser) {
                throw new APIError(USER_ERROR.AUTHORIZATION_ERROR)
            }

            // Exchange authorization code for tokens
            const { tokens } = await googleAccountsClient.getToken(code as string);
            const idToken = tokens.id_token as string;

            // Verify the ID token
            const { id, email, imageUrl } = await AccountServices.verifyIdToken(idToken);

            if (!email) {
                throw new Error("Google Auth Error");
            }

            if (email !== jwtUser.email) {
                throw new APIError({
                    MESSAGE: "Email should match with user email",
                    STATUS: 400,
                    TITLE: "EMAIL_MISMATCH"
                })
            }

            const user: IUser | boolean = await UserServices.getUserByEmail(email);

            if (!user) {
                throw new APIError(USER_ERROR.USER_NOT_FOUND_ERROR)
            }
            await AccountServices.linkAccount(user.id, "google", id)

            if (!user.imageUrl && imageUrl) {
                user.imageUrl = imageUrl
                await user.save()
            }


            return Respond(res, { message: "Google Account Linked Successfully" }, 200)
        } catch (error) {
            next(error)
        }
    }

    /**
     * Handles Google OAuth callback and login.
     * @param req - The Express request object.
     * @param res - The Express response object.
     * @param next - The Express next function.
     */
    static async handleDiscordCallback(req: Request, res: Response, next: NextFunction) {
        try {
            const { code } = req.query;
            const jwtUser = req.user
            if (!code || !jwtUser) {
                throw new APIError(USER_ERROR.AUTHORIZATION_ERROR);
            }

            const userInfo = await AccountServices.handleDiscordOAuthCallback(code as string);

            if (userInfo.email !== jwtUser.email) {
                throw new APIError({
                    MESSAGE: "Email should match with user email",
                    STATUS: 400,
                    TITLE: "EMAIL_MISMATCH"
                })
            }

            const user: IUser | boolean = await UserServices.getUserByEmail(userInfo.email);

            if (!user) {
                throw new APIError(USER_ERROR.USER_NOT_FOUND_ERROR)
            }

            await AccountServices.linkAccount(user.id, "discord", userInfo.id)

            if (!user.imageUrl && userInfo?.imageUrl) {
                user.imageUrl = userInfo?.imageUrl
                await user.save()
            }

            return Respond(res, { message: "Discord Account Linked Successful" }, 200)
        } catch (error) {
            next(error)
        }
    }

    /**
     * Handles Google OAuth callback and login.
     * @param req - The Express request object.
     * @param res - The Express response object.
     * @param next - The Express next function.
     */
    static async unlinkAccount(req: Request, res: Response, next: NextFunction) {
        try {
            const { provider } = req.query
            const user = req.user
            if (!user) {
                throw new APIError(USER_ERROR.USER_NOT_FOUND_ERROR)
            }
            AccountServices.verifyProvider(provider as string)
            await AccountServices.unlinkAccount(user?.id, provider as "google" | "facebook" | "discord" | "local")

            return Respond(res, { message: `${provider} Account Unlinked Successfully` }, 204)
        } catch (error) {
            next(error)
        }
    }
}