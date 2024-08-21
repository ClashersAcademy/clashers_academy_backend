import { config } from "dotenv";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";

config()

const GOOGLE_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT;

const DISCORD_CLIENT_ID = process.env.DISCORD_OAUTH_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_OAUTH_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_OAUTH_REDIRECT;

export const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);

export class AuthenticationServices {
    /**
     * Generates an authentication URL to redirect users to Google for login.
     * @returns Authentication URL.
     */
    static getGoogleAuthLink() {
        try {
            const authUrl = client.generateAuthUrl({
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
        const ticket = await client.verifyIdToken({
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
                redirect_uri: DISCORD_REDIRECT_URI!,
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
                redirect_uri: DISCORD_REDIRECT_URI!,
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
}