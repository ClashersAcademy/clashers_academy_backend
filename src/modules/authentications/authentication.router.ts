import express from 'express';
import AuthenticationController from './authentication.controller';
import rateLimit from 'express-rate-limit';
import { requireUser } from '../../middlewares/requireUser';

const authRouter = express.Router();
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: "Too many login attempts from this IP, please try again later.",
});

authRouter.post("/auth/signup", authLimiter, AuthenticationController.SignUpUserByCredentials)
authRouter.post("/auth/signin", authLimiter, AuthenticationController.SignInUserByCredentials)
authRouter.post("/auth/magic-link", authLimiter, AuthenticationController.sendMagicLink)
authRouter.get("/auth/magic-login", authLimiter, AuthenticationController.handleMagicLink)
authRouter.get("/auth/signout", authLimiter, AuthenticationController.SignOut)
authRouter.get("/auth/verify-email", AuthenticationController.verifyEmail)
authRouter.get("/auth/me", requireUser, AuthenticationController.me)
authRouter.get("/oauth/google", AuthenticationController.GoogleAuthRedirect)
authRouter.get("/oauth/google/callback", AuthenticationController.GoogleOAuthCallback)
authRouter.get("/oauth/discord", AuthenticationController.redirectToDiscord)
authRouter.get("/oauth/discord/callback", AuthenticationController.handleDiscordCallback)

authRouter.post("/auth/request-password-reset", AuthenticationController.requestPasswordReset)
authRouter.post("/auth/reset-password", AuthenticationController.resetPassword)

export default authRouter