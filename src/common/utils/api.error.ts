import type { Response } from "express";

class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }

    static unauthenticatedError(res: Response, message: string = "You are not authenticated") {
        return res.status(401).json({
            success: false,
            message,
        })
    }
    static unauthorizedError(res: Response, message: string = "You are not authorized") {
        return res.status(403).json({
            success: false,
            message,
        })
    }
    static notFoundError(res: Response, message: string = "Resource not found") {
        return res.status(404).json({
            success: false,
            message,
        })
    }
    static badRequestError(res: Response, message: string = "Bad request") {
        return res.status(400).json({
            success: false,
            message,
        })
    }
    static serverError() {
        return new ApiError("Internal server error", 500);
    }

}

export default ApiError;
