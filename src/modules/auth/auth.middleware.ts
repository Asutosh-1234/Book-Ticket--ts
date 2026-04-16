import type { Request, Response, NextFunction } from "express";
import ApiError from "../../common/utils/api.error.js";
import JwtUtils from "../../common/utils/jwt.utils.js";

interface CustomRequest extends Request {
    user?: any;
}

const verifyAccessToken = async (req: CustomRequest, res: Response, next: NextFunction) => {
    const token = req.cookies.accessToken;
    if (!token) {
        throw ApiError.unauthenticatedError(res, "Access token is required");
    }
    const decodedToken = JwtUtils.verifyAccessToken(token);
    if (!decodedToken) {
        throw ApiError.unauthenticatedError(res, "Invalid access token");
    }
    req.user = decodedToken;
    next();
}

const verifyRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.refreshToken;
    if (!token) {
        throw ApiError.unauthenticatedError(res, "Refresh token is required");
    }
    const decodedToken = JwtUtils.verifyRefreshToken(token);
    if (!decodedToken) {
        throw ApiError.unauthenticatedError(res, "Invalid refresh token");
    }
    next();
}


export {
    verifyAccessToken,
    verifyRefreshToken
}