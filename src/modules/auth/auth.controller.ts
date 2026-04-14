import type { Request, Response } from "express";
import { users } from "../../common/DB/schema.js";
import { db } from "../../common/DB/schema.js";
import { eq } from "drizzle-orm";
import ApiError from "../../common/utils/api.error.js";
import ApiResponse from "../../common/utils/api.response.js";
import JwtUtils from "../../common/utils/jwt.utils.js";
import bcrypt from "bcrypt";


function passwordMatch(password: string, hash: string) {
    return bcrypt.compare(password, hash);
}

function hashPassword(password: string) {
    return bcrypt.hash(password, 10);
}

const register = async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    console.log(name, email, password);
    if (!name) {
        throw ApiError.badRequestError(res,"Name is required");
    }
    if (!email) {
        throw ApiError.badRequestError(res,"Email is required");
    }
    if (!password) {
        throw ApiError.badRequestError(res,"Password is required");
    }
    const user = await db.select().from(users).where(eq(users.email, email));
    if (user[0]) {
        throw ApiError.badRequestError(res,"User already exsist")
    }
    const refreshToken = JwtUtils.generateRefreshToken({ email });
    const accessToken = JwtUtils.generateAccessToken({ email });

    const hashedPassword = await hashPassword(password);

    const createdUser = await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
        refreshToken,
        refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }).returning({
        id: users.id,
        email: users.email,
        name: users.name
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    ApiResponse.created(res, "User registered successfully", createdUser);
}

const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    console.log(email, password);
    if (!email) {
        throw ApiError.badRequestError(res,"Email is required");
    }
    if (!password) {
        throw ApiError.badRequestError(res,"Password is required");
    }
    const user = await db.select().from(users).where(eq(users.email, email));
    if (!user[0]) {
        throw ApiError.badRequestError(res,"User not found")
    }

    const isPasswordValid = await passwordMatch(password, user[0].password);
    if (!isPasswordValid) {
        throw ApiError.badRequestError(res,"Invalid password");
    }

    const refreshToken = JwtUtils.generateRefreshToken({ email });
    const accessToken = JwtUtils.generateAccessToken({ email });

    const updatedUser = await db.update(users).set({
        refreshToken,
        refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }).where(eq(users.email, email)).returning({
        id: users.id,
        email: users.email,
        name: users.name
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    ApiResponse.ok(res, "User logged in successfully", updatedUser);
}

export {
    register,
    login
}