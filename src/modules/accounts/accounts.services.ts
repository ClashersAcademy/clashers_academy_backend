import { config } from "dotenv";
import { Accounts } from "./accounts.modal";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";
import APIError from "../../errors/APIError";
config()

const GOOGLE_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI_FOR_LINKING = process.env.GOOGLE_OAUTH_REDIRECT_FOR_LINKING;

const DISCORD_CLIENT_ID = process.env.DISCORD_OAUTH_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_OAUTH_CLIENT_SECRET;
const DISCORD_REDIRECT_URI_FOR_LINKING = process.env.DISCORD_OAUTH_REDIRECT_FOR_LINKING;

export const googleAccountsClient = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI_FOR_LINKING);

export class AccountServices {
    static verifyProvider(provider: string) {
        if (!['google', 'facebook', 'discord', 'local'].includes(provider)) {
            throw new APIError({
                STATUS: 400,
                MESSAGE: "Wrong provider input",
                TITLE: "WRONG_PROVIDER"
            })
        }
        return true
    }
    /**
     * Creates a new account for a user with a specific provider.
     * @param userId - The ID of the user.
     * @param provider - The provider (e.g., 'google', 'facebook').
     * @param providerId - The provider-specific ID.
     * @returns The created account.
     */
    static async createAccount(userId: string, provider: 'google' | 'facebook' | 'discord' | 'local', providerId?: string, password?: string) {
        try {
            const account = new Accounts({
                user: userId,
                provider,
                password,
                providerId
            });

            await account.save();
            return account;
        } catch (error) {
            throw error
        }
    }

    /**
     * Generates an authentication URL to redirect users to Google for login.
     * @returns Authentication URL.
     */
    static getGoogleAuthLink() {
        try {
            const authUrl = googleAccountsClient.generateAuthUrl({
                access_type: 'offline',
                scope: ['profile', 'email'],
            });
            return authUrl;
        } catch (error) {
            throw error
        }
    }

    /**
     * Verifies Google ID token and returns user information.
     * @param idToken - The Google ID token to verify.
     * @returns User information.
     */
    static async verifyIdToken(idToken: string) {
        const ticket = await googleAccountsClient.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload) {
            throw new Error('Invalid ID token');
        }
        return {
            id: payload.sub,
            email_verified: payload.email_verified,
            email: payload.email,
            name: payload.name,
            imageUrl: payload.picture,
        };
    }

    /**
     * Generates an authentication URL to redirect users to Discord for login.
     * @returns Authentication URL.
     */
    static getDiscordAuthLink() {
        try {
            const params = new URLSearchParams({
                client_id: DISCORD_CLIENT_ID!,
                redirect_uri: DISCORD_REDIRECT_URI_FOR_LINKING!,
                response_type: "code",
                scope: "identify email",
            });
            return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Handles the Discord OAuth callback by exchanging the authorization code for tokens.
     * @param code - The authorization code received from Discord.
     * @returns User information.
     */
    static async handleDiscordOAuthCallback(code: string) {
        try {
            // Exchange the authorization code for an access token
            const tokenResponse = await axios.post("https://discord.com/api/oauth2/token", new URLSearchParams({
                client_id: DISCORD_CLIENT_ID!,
                client_secret: DISCORD_CLIENT_SECRET!,
                grant_type: "authorization_code",
                code,
                redirect_uri: DISCORD_REDIRECT_URI_FOR_LINKING!,
            }).toString(), {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });

            const { access_token } = tokenResponse.data;

            // Fetch user information from Discord
            const userResponse = await axios.get("https://discord.com/api/users/@me", {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            });

            const { id, email, username, avatar } = userResponse.data;

            return {
                id,
                email,
                name: username,
                imageUrl: avatar ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png` : undefined,
            };
        } catch (error) {
            throw error;
        }
    }

    /**
     * Creates a new account for a user with a specific provider (Linking account).
     * @param userId - The ID of the user.
     * @param provider - The provider (e.g., 'google', 'facebook').
     * @param providerId - The provider-specific ID.
     * @returns The created or linked account.
     */
    static async linkAccount(userId: string, provider: 'google' | 'facebook' | 'discord' | 'local', providerId?: string, password?: string) {
        try {
            const existingAccount = await Accounts.findOne({ user: userId, provider }).exec();
            if (existingAccount) {
                throw new APIError({
                    MESSAGE: `Account already linked with provider ${provider}`,
                    STATUS: 400,
                    TITLE: "ACCOUNT_ALREADY_LINKED"
                });
            }

            const account = new Accounts({
                user: userId,
                provider,
                providerId,
                password,
            });

            await account.save();
            return account;
        } catch (error) {
            throw error
        }
    }

    /**
     * Unlinks an existing account from a user.
     * @param userId - The ID of the user.
     * @param provider - The provider to unlink (e.g., 'google', 'facebook').
     * @returns A confirmation message.
     */
    static async unlinkAccount(userId: string, provider: 'google' | 'facebook' | 'discord' | 'local') {
        try {

            const account = await Accounts.findOne({ user: userId, provider }).exec();
            if (!account) {
                throw new Error(`No account linked with provider ${provider}`);
            }

            // Ensure at least one provider is still linked before unlinking
            const linkedAccounts = await Accounts.countDocuments({ user: userId }).exec();
            if (linkedAccounts <= 1) {
                throw new Error('Cannot unlink the last linked account.');
            }

            await account.deleteOne();
            return true;
        } catch (error) {
            throw error
        }
    }

    /**
     * Finds an account by user ID and provider.
     * @param userId - The ID of the user.
     * @param provider - The provider (e.g., 'local' for local authentication).
     * @returns The account if found.
    */
    static async findAccountByUserIdAndProvider(userId: string, provider: 'google' | 'facebook' | 'discord' | 'local') {
        const account = await Accounts.findOne({ user: userId, provider }).exec();
        if (!account || account.isDeleted) {
            return false
        }
        return account;
    }
}