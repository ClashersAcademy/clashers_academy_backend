import express from 'express';
import { requireUser } from '../../middlewares/requireUser';
import AccountController from './accounts.controller';

const accountRouter = express.Router();
accountRouter.use(requireUser);

accountRouter.get("/google", AccountController.GoogleAuthRedirect)
accountRouter.get("/google/callback", AccountController.GoogleOAuthCallback)
accountRouter.get("/discord", AccountController.redirectToDiscord)
accountRouter.get("/discord/callback", AccountController.handleDiscordCallback)
accountRouter.get("/unlink", AccountController.unlinkAccount)

export default accountRouter