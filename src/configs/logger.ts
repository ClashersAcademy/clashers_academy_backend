import * as log4js from "log4js";
log4js.configure({
    appenders: {
        out: { type: "stdout", layout: { type: "colored" } },
        errorlogs: {
            type: "file",
            filename: "./logs/error.log",
            layout: { type: "colored" },
        },
        warnlogs: {
            type: "file",
            filename: "./logs/warn.log",
            layout: { type: "colored" },
        },
        debuglogs: {
            type: "file",
            filename: "./logs/debug.log",
            layout: { type: "colored" },
        },
        fatallogs: {
            type: "file",
            filename: "./logs/fatal.log",
            layout: { type: "colored" },
        },
    },
    categories: {
        default: { appenders: ["out"], level: "info" },
        errorlogger: { appenders: ["errorlogs", "out"], level: "error" },
        warnLogger: { appenders: ["warnlogs", "out"], level: "warn" },
        debugLogger: { appenders: ["debuglogs", "out"], level: "debug" },
        fatalLogger: { appenders: ["fatallogs", "out"], level: "fatal" },
    },
});

export const logger = log4js.getLogger();
export const errorlogger = log4js.getLogger("errorlogger");
export const warnLogger = log4js.getLogger("warnLogger");
export const debugLogger = log4js.getLogger("debugLogger");
export const fatalLogger = log4js.getLogger("fatalLogger");