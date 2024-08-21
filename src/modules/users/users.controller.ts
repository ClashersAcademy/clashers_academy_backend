import { NextFunction, Request, Response } from "express";
import { ProfileServices } from "../profiles/profiles.services";
import APIError from "../../errors/APIError";
import { USER_ERROR } from "../../errors/userErrors";
import Respond from "../../lib/Respond";
import SessionServices from "../sessions/sessions.services";

export default class UsersController {
    static async onboard(req: Request, res: Response, next: NextFunction) {
        try {
            const payload = req.body
            const user = req.user

            if (!user) {
                throw new APIError(USER_ERROR.USER_NOT_FOUND_ERROR)
            }

            const updatedProfile = await ProfileServices.updateProfileById(user.id, payload, user.role)

            return Respond(res, updatedProfile, 200)
        } catch (error) {
            next(error)
        }
    }

    static async allOnlineUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const allOnline = await SessionServices.getAllSessions()
            const me = await SessionServices.getSession(req.cookies.session_id)
            return Respond(res, { allOnline, me }, 200)
        } catch (error) {
            next(error)
        }
    }
}