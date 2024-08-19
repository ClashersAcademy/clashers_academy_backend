import express from 'express';
import authRouter from './authentications/authentication.router';

const router = express.Router();

router.use(authRouter)

export default router