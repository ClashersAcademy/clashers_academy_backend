import { Request, Response } from "express";
import { SignJwt } from "../../lib/tokens";
import UserServices from "../users/users.services";
import { AccountServices } from "../accounts/accounts.services";
import { ProfileServices } from "../profiles/profiles.services";
import { AuthenticationServices, client } from "./authentication.services";
import { compare } from "bcrypt";
import { cookieConfig } from "../../configs/cookieConfig";
import APIError from "../../errors/APIError";
import { USER_ERROR } from "../../errors/userErrors";
import { IUser } from "../users/users.modal";

export default class AuthenticationController {
    /**
     * Signs up a user and returns a success message.
     * @param req - The Express request object.
     * @param res - The Express response object.
     */
    static async SignUpUserByCredentials(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required.' });
            }

            await UserServices.registerUser(email, password, "local");

            return res.status(200).json({ message: "User Registered Successfully" });

        } catch (error) {
            if (error instanceof Error && (error as any).code === 11000 && error.message.includes('email_1 dup key')) {
                return res.status(401).json({ message: 'Email already present.' });
            }
            throw error;
        }
    }

    /**
     * Signs in a user and returns a JWT.
     * @param req - The Express request object.
     * @param res - The Express response object.
     */
    static async SignInUserByCredentials(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password are required.' });
            }

            const user = await UserServices.getUserByEmail(email);
            if (!user || user.isDeleted) {
                return res.status(401).json({ message: 'Invalid credentials.' });
            }

            if (!user.isVerified) {
                return res.status(401).json({ message: 'Verify Your Email' });
            }

            const account = await AccountServices.findAccountByUserIdAndProvider(user.id, "local");
            if (!account || account.provider !== 'local') {
                return res.status(401).json({ message: 'Invalid credentials.' });
            }

            const isMatch = await compare(password, account.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials.' });
            }

            const profile = await ProfileServices.findProfileByUserId(user.id, user.role);
            if (!profile) {
                return res.status(401).json({ message: 'Invalid credentials.' });
            }

            const token = await SignJwt({ id: user.id, email: user.email, role: user.role, imageUrl: user.imageUrl, collection: "users" }, { expiresIn: "5m" });

            res.cookie("access_token", token, cookieConfig({}));

            return res.status(200).json({ message: "User Logged in Successfully" });

        } catch (error) {
            throw error;
        }
    }

    /**
     * Redirects to Google for authentication.
     * @param req - The Express request object.
     * @param res - The Express response object.
     */
    static async GoogleAuthRedirect(req: Request, res: Response) {
        try {
            const authUrl = AuthenticationServices.getGoogleAuthLink();
            return res.redirect(authUrl);
        } catch (error) {
            throw error;
        }
    }
    /**
     * Redirects to Discord for authentication.
     * @param req - The Express request object.
     * @param res - The Express response object.
     */
    static async redirectToDiscord(req: Request, res: Response) {
        const authUrl = AuthenticationServices.getDiscordAuthLink();
        return res.redirect(authUrl);
    }


    /**
     * Handles Google OAuth callback and login.
     * @param req - The Express request object.
     * @param res - The Express response object.
     */
    static async GoogleOAuthCallback(req: Request, res: Response) {
        try {
            const { code } = req.query;

            if (!code) {
                return res.status(400).json({ message: 'Authorization code is required.' });
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

            if (!user) {
                user = await UserServices.registerUser(email, null, 'google', id, imageUrl);
                await UserServices.verifyUser(user.id);
            } else {
                const account = await AccountServices.findAccountByUserIdAndProvider(user.id, 'google');
                if (!account) {
                    await AccountServices.createAccount(user.id, 'google', id);
                }

                if (!user.imageUrl && imageUrl) {
                    user.imageUrl = imageUrl
                    await user.save()
                }
            }



            const token = await SignJwt({ id: user.id, email: user.email, imageUrl: user.imageUrl, role: user.role, collection: "users" }, { expiresIn: "5m" });

            res.cookie("access_token", token, cookieConfig({}))

            return res.status(200).json({ message: "Google OAuth Login Successful", token });

        } catch (error) {
            throw error;
        }
    }

    /**
     * Handles Google OAuth callback and login.
     * @param req - The Express request object.
     * @param res - The Express response object.
     */
    static async handleDiscordCallback(req: Request, res: Response) {
        try {
            const { code } = req.query;

            if (!code) {
                return res.status(400).json({ message: "Authorization code is required." });
            }

            const userInfo = await AuthenticationServices.handleDiscordOAuthCallback(code as string);

            let user: IUser | boolean = await UserServices.getUserByEmail(userInfo.email);

            if (!user) {
                user = await UserServices.registerUser(userInfo.email, null, "discord", userInfo.id, userInfo?.imageUrl);
                await UserServices.verifyUser(user.id);
            } else {
                const account = await AccountServices.findAccountByUserIdAndProvider(user.id, "discord");
                if (!account) {
                    await AccountServices.createAccount(user.id, "discord", userInfo.id);
                }

                if (!user.imageUrl && userInfo?.imageUrl) {
                    user.imageUrl = userInfo?.imageUrl
                    await user.save()
                }
            }

            const token = await SignJwt({ id: user.id, email: user.email, imageUrl: user.imageUrl, role: user.role, collection: "users" });

            res.cookie("access_token", token, { httpOnly: true });
            return res.status(200).json({ message: "Discord OAuth Login Successful", token });
        } catch (error) {
            throw error
        }
    }

    /**
     * Returns the authenticated user's details based on the token.
     * @param req - The Express request object.
     * @param res - The Express response object.
     */
    static async me(req: Request, res: Response) {
        try {
            const user = req.user;

            if (!user) {
                throw new APIError(USER_ERROR.SESSION_INVALIDATED)
            }
            return res.status(200).json(user);
        } catch (error) {
            throw error
        }
    }
}
