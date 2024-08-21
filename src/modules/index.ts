import express from 'express';
import authRouter from './authentications/authentication.router';
import rateLimit from 'express-rate-limit';
import userRouter from './users/user.router';
import accountRouter from './accounts/accounts.router';

const router = express.Router();
const apiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
});

router.use(apiLimiter)
router.use(authRouter)
router.use("/users", userRouter)
router.use("/account", accountRouter)

export default router