export const USER_ERROR = {
    AUTHORIZATION_ERROR: {
        STATUS: 401,
        TITLE: "AUTHORIZATION_ERROR",
        MESSAGE: "The user is not authorized to perform this action.",
    },
    USER_NOT_FOUND_ERROR: {
        STATUS: 404,
        TITLE: "USER_NOT_FOUND",
        MESSAGE: "The user was not found. Please try again later.",
    },
    SESSION_INVALIDATED: {
        STATUS: 404,
        TITLE: "SESSION_INVALIDATED",
        MESSAGE: "The session was invalidated. Please login again.",
    },
    USER_ALREADY_EXISTS: {
        STATUS: 400,
        TITLE: "USER_ALREADY_EXISTS",
        MESSAGE:
            "The user already exists. Please use a different email address or username",
    },
    INVALID_CREDENTIALS: {
        STATUS: 401,
        TITLE: "INVALID_CREDENTIALS",
        MESSAGE: "Invalid email or password. Please try again.",
    },
    WRONG_PASSWORD: {
        STATUS: 401,
        TITLE: "WRONG_PASSWORD",
        MESSAGE: "Wrong password. Please try again.",
    },
}