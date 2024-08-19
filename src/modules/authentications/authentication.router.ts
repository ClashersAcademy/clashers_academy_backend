import express from 'express';
import AuthenticationController from './authentication.controller';

const authRouter = express.Router();

authRouter.post("/auth/signup", AuthenticationController.SignUpUserByCredentials)
authRouter.post("/auth/signin", AuthenticationController.SignInUserByCredentials)
authRouter.get("/auth/me", AuthenticationController.me)
authRouter.get("/oauth/google", AuthenticationController.GoogleAuthRedirect)
authRouter.get("/oauth/google/callback", AuthenticationController.GoogleOAuthCallback)
authRouter.get("/oauth/discord", AuthenticationController.redirectToDiscord)
authRouter.get("/oauth/discord/callback", AuthenticationController.handleDiscordCallback)

export default authRouter