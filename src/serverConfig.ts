import express, { Express } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { errorHandler } from "./middlewares/errorHandler";
import Respond from "./lib/Respond";
import UserDeserializer from "./middlewares/userDeserialiser";
import router from "./modules";

const allowedOrigins = ["http://localhost:3000"];

export default function serverConfig(app: Express) {
    app.use(cookieParser());
    app.use(express.urlencoded({ extended: true, limit: "2048mb" }));
    app.use(express.json({ limit: "2048mb" }));
    app.use(
        cors({
            credentials: true,
            origin: function (origin, callback) {
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                } else {
                    callback(new Error("Not allowed by CORS"));
                }
            },
        })
    );

    app.use((_, res, next) => {
        res.cookie("lang", "en");
        next();
    });

    app.use(UserDeserializer)

    app.get("/", (_, res) => {
        return Respond(res, { message: "API services are nominal!!" }, 200)
    });

    app.use(router)

    app.use(errorHandler);
}