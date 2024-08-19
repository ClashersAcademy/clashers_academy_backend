import { format } from "date-fns";
const timestamp = new Date().toISOString();

interface IHttpErrorResponse {
    title: string;
    message?: string;
    success: boolean;
    status: number;
    timestamp: string;
}

export enum HttpErrorStatusCode {
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    NOT_FOUND = 404,
    INTERNAL_SERVER = 500,
}

export interface IAPIError {
    STATUS: HttpErrorStatusCode;
    TITLE: string;
    MESSAGE?: string;
}

export default class APIError extends Error {
    statusCode: HttpErrorStatusCode;
    title: string;
    success: boolean;
    isOperational: boolean;

    constructor(option: IAPIError) {
        super(option?.MESSAGE);
        Object.setPrototypeOf(this, APIError.prototype);
        this.title = option.TITLE;
        this.statusCode = option.STATUS;
        this.success = false;
        this.isOperational = true;
    }

    serializeError() {
        return {
            title: this.title,
            message: this?.message,
            success: this.success,
            status: this.statusCode,
            timestamp: format(timestamp, "PPP p"),
        } satisfies IHttpErrorResponse;
    }

    toString() {
        return (
            "APIError: " +
            this.statusCode +
            " - " +
            this.title +
            " - " +
            this.message +
            "\n"
        );
    }
}