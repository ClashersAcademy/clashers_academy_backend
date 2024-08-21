import { NextFunction, Request, Response } from "express";
import { SignJwt, VerifyJWT } from "../../lib/tokens";
import UserServices from "../users/users.services";
import { AccountServices } from "../accounts/accounts.services";
import { AuthenticationServices, client } from "./authentication.services";
import { compare, hash } from "bcrypt";
import { cookieConfig } from "../../configs/cookieConfig";
import APIError from "../../errors/APIError";
import { USER_ERROR } from "../../errors/userErrors";
import { IUser } from "../users/users.modal";
import EmailServices from "../emails/emails.services";
import Respond from "../../lib/Respond";
import SessionServices from "../sessions/sessions.services";
import { config } from "dotenv";

config()

export default class AuthenticationController {
    /**
     * Signs up a user and returns a success message.
     * @param req - The Express request object.
     * @param res - The Express response object.
     * @param next - The Express next function.
     */
    static async SignUpUserByCredentials(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                throw new APIError(USER_ERROR.CREDENTIALS_MISSING)
            }

            const user = await UserServices.registerUser(email, password, "local");

            const verificationToken = SignJwt({ id: user.id }, { expiresIn: "1h" });
            const verificationLink = `${process.env.SERVER_URL}/auth/verify-email?token=${verificationToken}`;

            EmailServices.sendEmailVerification(email, verificationLink);

            return Respond(res, { message: "User Registered Successfully" }, 200)

        } catch (error) {
            if (error instanceof Error && (error as any).code === 11000 && error.message.includes('email_1 dup key')) {
                next(new APIError(USER_ERROR.USER_ALREADY_EXISTS))
            }

            next(error)
        }
    }

    /**
     * Signs in a user and returns a JWT.
     * @param req - The Express request object.
     * @param res - The Express response object.
     * @param next - The Express next function.
     */
    static async SignInUserByCredentials(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                throw new APIError(USER_ERROR.CREDENTIALS_MISSING)
            }

            const user = await UserServices.getUserByEmail(email);
            if (!user || user.isDeleted) {
                throw new APIError(USER_ERROR.INVALID_CREDENTIALS)
            }

            if (!user.isVerified) {
                throw new APIError(USER_ERROR.VERIFICATION_MISSING)
            }

            const sessionId = `session-${user.id}`;
            const expiresIn = 5 * 60;

            if (await SessionServices.sessionExists(sessionId)) {
                EmailServices.sendLoginThreat(user.email, req?.ip)
                throw new APIError(USER_ERROR.ACCESS_DENIED_SIMULTANEOUS_LOGIN)
            }

            const account = await AccountServices.findAccountByUserIdAndProvider(user.id, "local");
            if (!account || account.provider !== 'local') {
                throw new APIError(USER_ERROR.INVALID_CREDENTIALS)
            }

            const isMatch = await compare(password, account.password);
            if (!isMatch) {
                throw new APIError(USER_ERROR.INVALID_CREDENTIALS)
            }

            const token = SignJwt({ id: user.id, email: user.email, role: user.role, imageUrl: user.imageUrl, collection: "users" }, { expiresIn: "5m" });

            await SessionServices.refreshSession(sessionId, user.id, expiresIn);

            res.cookie("session_id", sessionId, cookieConfig({ maxAge: 5 * 60 * 1000 }));
            res.cookie("access_token", token, cookieConfig({ maxAge: 5 * 60 * 1000 }));
            return Respond(res, { message: "User Logged in Successfully" }, 200)

        } catch (error) {
            next(error)
        }
    }

    /**
         * Signs out a user and returns a success message.
         * @param req - The Express request object.
         * @param res - The Express response object.
         * @param next - The Express next function.
         */
    static async SignOut(req: Request, res: Response, next: NextFunction) {
        try {
            const { session_id } = req.cookies;

            if (session_id) {
                await SessionServices.removeSession(session_id);
                res.clearCookie("session_id");
            }

            res.clearCookie("access_token");

            return Respond(res, { message: "User Logged out Successfully" }, 200);
        } catch (error) {
            next(error)
        }
    }

    /**
     * Redirects to Google for authentication.
     * @param req - The Express request object.
     * @param res - The Express response object.
     * @param next - The Express next function.
     */
    static async GoogleAuthRedirect(req: Request, res: Response, next: NextFunction) {
        try {
            const authUrl = AuthenticationServices.getGoogleAuthLink();
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
            const authUrl = AuthenticationServices.getDiscordAuthLink();
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

            if (!code) {
                throw new APIError(USER_ERROR.AUTHORIZATION_ERROR)
            }

            // Exchange authorization code for tokens
            const { tokens } = await client.getToken(code as string);
            const idToken = tokens.id_token as string;

            // Verify the ID token
            const { id, email, imageUrl } = await AuthenticationServices.verifyIdToken(idToken);

            if (!email) {
                throw new Error("Google Auth Error");
            }

            let user: IUser | boolean = await UserServices.getUserByEmail(email);

            let sessionId
            let expiresIn

            if (!user) {
                user = await UserServices.registerUser(email, null, 'google', id, imageUrl);
                await UserServices.verifyUser(user.id);
                EmailServices.sendWelcomeStudentEmail(user.email);
                sessionId = `session-${user.id}`;
                expiresIn = 5 * 60;
            } else {
                sessionId = `session-${user.id}`;
                expiresIn = 5 * 60;

                if (await SessionServices.sessionExists(sessionId)) {
                    EmailServices.sendLoginThreat(user.email, req?.ip)
                    throw new APIError(USER_ERROR.ACCESS_DENIED_SIMULTANEOUS_LOGIN)
                }

                const account = await AccountServices.findAccountByUserIdAndProvider(user.id, 'google');
                if (!account) {
                    await AccountServices.createAccount(user.id, 'google', id);
                }

                if (!user.imageUrl && imageUrl) {
                    user.imageUrl = imageUrl
                    await user.save()
                }
            }

            const token = SignJwt({ id: user.id, email: user.email, imageUrl: user.imageUrl, role: user.role, collection: "users" }, { expiresIn: "5m" });

            await SessionServices.refreshSession(sessionId, user.id, expiresIn);

            res.cookie("access_token", token, cookieConfig({ maxAge: 5 * 60 * 1000 }));
            res.cookie("session_id", sessionId, cookieConfig({ maxAge: 5 * 60 * 1000 }));

            return Respond(res, { message: "Google OAuth Login Successful", token }, 200)

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

            if (!code) {
                return res.status(400).json({ message: "Authorization code is required." });
            }

            const userInfo = await AuthenticationServices.handleDiscordOAuthCallback(code as string);

            let user: IUser | boolean = await UserServices.getUserByEmail(userInfo.email);

            let sessionId
            let expiresIn

            if (!user) {
                user = await UserServices.registerUser(userInfo.email, null, "discord", userInfo.id, userInfo?.imageUrl);
                await UserServices.verifyUser(user.id);
                EmailServices.sendWelcomeStudentEmail(user.email);
                sessionId = `session-${user.id}`;
                expiresIn = 5 * 60;
            } else {
                sessionId = `session-${user.id}`;
                expiresIn = 5 * 60;

                if (await SessionServices.sessionExists(sessionId)) {
                    EmailServices.sendLoginThreat(user.email, req?.ip)
                    throw new APIError(USER_ERROR.ACCESS_DENIED_SIMULTANEOUS_LOGIN)
                }

                const account = await AccountServices.findAccountByUserIdAndProvider(user.id, "discord");
                if (!account) {
                    await AccountServices.createAccount(user.id, "discord", userInfo.id);
                }

                if (!user.imageUrl && userInfo?.imageUrl) {
                    user.imageUrl = userInfo?.imageUrl
                    await user.save()
                }
            }

            const token = SignJwt({ id: user.id, email: user.email, imageUrl: user.imageUrl, role: user.role, collection: "users" });

            await SessionServices.refreshSession(sessionId, user.id, expiresIn);

            res.cookie("access_token", token, cookieConfig({ maxAge: 5 * 60 * 1000 }));
            res.cookie("session_id", sessionId, cookieConfig({ maxAge: 5 * 60 * 1000 }));

            return Respond(res, { message: "Discord OAuth Login Successful", token }, 200)
        } catch (error) {
            next(error)
        }
    }


    /**
     * Verifies the user's email using the provided token.
     * @param req - The Express request object.
     * @param res - The Express response object.
     * @param next - The Express next function.
     */
    static async verifyEmail(req: Request, res: Response, next: NextFunction) {
        try {
            const { token } = req.query;

            if (!token) {
                throw new APIError(USER_ERROR.AUTHORIZATION_ERROR)
            }

            const decodedToken = VerifyJWT(token as string);
            if (!decodedToken) {
                throw new APIError(USER_ERROR.AUTHORIZATION_ERROR)
            }

            const userId = decodedToken.id;

            const user = await UserServices.verifyUser(userId);
            EmailServices.sendWelcomeStudentEmail(user.email);

            return Respond(res, { message: "Email verified successfully." }, 200)
        } catch (error) {
            next(error)
        }
    }

    /**
     * Returns the authenticated user's details based on the token.
     * @param req - The Express request object.
     * @param res - The Express response object.
     * @param next - The Express next function.
     */
    static async me(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user;

            if (!user) {
                throw new APIError(USER_ERROR.SESSION_INVALIDATED)
            }
            return res.status(200).json(user);
        } catch (error) {
            next(error)
        }
    }

    /**
     * Initiate Password Reset
     * @param req - The Express request object.
     * @param res - The Express response object.
     * @param next - The Express next function.
     */
    static async requestPasswordReset(req: Request, res: Response, next: NextFunction) {
        try {
            const { email } = req.body;

            if (!email) {
                throw new APIError(USER_ERROR.CREDENTIALS_MISSING);
            }

            const user = await UserServices.getUserByEmail(email);

            if (!user || user.isDeleted) {
                throw new APIError(USER_ERROR.USER_NOT_FOUND_ERROR);
            }

            const resetToken = SignJwt({ id: user.id }, { expiresIn: "1h" });
            const resetLink = `${process.env.SERVER_URL}/auth/reset-password?token=${resetToken}`;

            await EmailServices.sendPasswordResetEmail(email, resetLink);

            return Respond(res, { message: "Password reset email sent." }, 200);

        } catch (error) {
            next(error)
        }
    }

    /**
     * Handle password reset
     * @param req - The Express request object.
     * @param res - The Express response object.
     * @param next - The Express next function.
     */
    static async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const { token, password } = req.body;

            if (!token || !password) {
                throw new APIError(USER_ERROR.CREDENTIALS_MISSING);
            }

            const decodedToken = VerifyJWT(token);
            if (!decodedToken) {
                throw new APIError(USER_ERROR.AUTHORIZATION_ERROR);
            }

            const userId = decodedToken.id;
            const user = await UserServices.getUserById(userId);

            if (!user || user.isDeleted) {
                throw new APIError(USER_ERROR.USER_NOT_FOUND_ERROR);
            }

            let hashedPassword: string | null = null;

            if (!password || password.length < 6) {
                throw new APIError({
                    TITLE: "WEAK_PASSWORD",
                    MESSAGE: 'Password must be at least 6 characters long',
                    STATUS: 400
                })
            }
            hashedPassword = await hash(password, 10);

            let account = await AccountServices.findAccountByUserIdAndProvider(user.id, "local");

            if (!account) {
                account = await AccountServices.createAccount(user.id, "local", undefined, hashedPassword);
            }

            return Respond(res, { message: "Password has been reset successfully." }, 200);
        } catch (error) {
            next(error)
        }
    }

    /**
     * Sends a magic link to the user's email for login.
     * @param req - The Express request object.
     * @param res - The Express response object.
     * @param next - The Express next function.
     */
    static async sendMagicLink(req: Request, res: Response, next: NextFunction) {
        try {
            const { email } = req.body;

            if (!email) {
                throw new APIError({
                    MESSAGE: "Email Missing",
                    TITLE: "EMAIL_MISSING",
                    STATUS: 404
                });
            }

            const user = await UserServices.getUserByEmail(email);
            if (!user || user.isDeleted) {
                throw new APIError(USER_ERROR.INVALID_CREDENTIALS);
            }

            const magicToken = SignJwt({ id: user.id }, { expiresIn: "15m" }); // Adjust expiration as needed
            const magicLink = `${process.env.SERVER_URL}/auth/magic-login?token=${magicToken}`;

            await EmailServices.sendMagicLink(email, magicLink);

            return Respond(res, { message: "Magic link sent successfully." }, 200);
        } catch (error) {
            next(error)
        }
    }

    /**
     * Handles magic link login.
     * @param req - The Express request object.
     * @param res - The Express response object.
     * @param next - The Express next function.
     */
    static async handleMagicLink(req: Request, res: Response, next: NextFunction) {
        try {
            const { token } = req.query;

            if (!token) {
                throw new APIError(USER_ERROR.AUTHORIZATION_ERROR);
            }

            const decodedToken = VerifyJWT(token as string);
            if (!decodedToken) {
                throw new APIError(USER_ERROR.AUTHORIZATION_ERROR);
            }

            const userId = decodedToken.id;
            const user = await UserServices.getUserById(userId);

            if (!user || user.isDeleted) {
                throw new APIError(USER_ERROR.INVALID_CREDENTIALS);
            }

            const sessionId = `session-${user.id}`;
            const expiresIn = 5 * 60;

            if (await SessionServices.sessionExists(sessionId)) {
                EmailServices.sendLoginThreat(user.email, req?.ip)
                throw new APIError(USER_ERROR.ACCESS_DENIED_SIMULTANEOUS_LOGIN)
            }

            const jwtToken = SignJwt({ id: user.id, email: user.email, imageUrl: user.imageUrl, role: user.role, collection: "users" });

            await SessionServices.refreshSession(sessionId, user.id, expiresIn);

            res.cookie("access_token", jwtToken, cookieConfig({ maxAge: 5 * 60 * 1000 }));
            res.cookie("session_id", sessionId, cookieConfig({ maxAge: 5 * 60 * 1000 }));

            return Respond(res, { message: "Logged in successfully." }, 200);
        } catch (error) {
            next(error)
        }
    }
}
