import express from 'express';
import UsersController from './users.controller';
import { requireUser } from '../../middlewares/requireUser';
const userRouter = express.Router();

userRouter.use(requireUser)
userRouter.get("/online", UsersController.allOnlineUsers)
userRouter.post("/onboard", UsersController.onboard)

export default userRouter