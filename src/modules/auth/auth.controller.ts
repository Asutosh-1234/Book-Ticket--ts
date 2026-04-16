import type { Request, Response } from "express";
import { users } from "../../common/DB/schema.js";
import { db } from "../../common/DB/schema.js";
import { eq } from "drizzle-orm";
import ApiError from "../../common/utils/api.error.js";
import ApiResponse from "../../common/utils/api.response.js";
import JwtUtils from "../../common/utils/jwt.utils.js";
import bcrypt from "bcrypt";
import Email from "../../common/utils/email.utils.js";


function passwordMatch(password: string, hash: string) {
    return bcrypt.compare(password, hash);
}

function hashPassword(password: string) {
    return bcrypt.hash(password, 10);
}

function hashToken(token: string) {
    return bcrypt.hash(token, 10);
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
    const refreshToken = JwtUtils.generateRefreshToken( {email, name} );
    const accessToken = JwtUtils.generateAccessToken( {email, name} );
    const emailVerificationToken = JwtUtils.generateEmailVerificationToken( {email} );

    const hashedPassword = await hashPassword(password);
    const hashedRefreshToken = await hashToken(refreshToken);
    const hashedEmailVerificationToken = await hashToken(emailVerificationToken);

    const createdUser = await db.insert(users).values({
        name,
        email,
        password: hashedPassword,
        refreshToken: hashedRefreshToken,
        refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isEmailVerified: "false",
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerificationToken: hashedEmailVerificationToken,
    }).returning({
        id: users.id,
        email: users.email,
        name: users.name,
        isEmailVerified: users.isEmailVerified,
        emailVerificationToken: users.emailVerificationToken,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
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
    Email.registrationEmail(email, emailVerificationToken);

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

    const refreshToken = JwtUtils.generateRefreshToken({ email, name: user[0].name, id: user[0].id });
    const accessToken = JwtUtils.generateAccessToken({ email, name: user[0].name, id: user[0].id });

    const hashedRefreshToken = await hashToken(refreshToken)
    const updatedUser = await db.update(users).set({
        refreshToken: hashedRefreshToken,
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


const verifyEmail = async (req: Request, res: Response) => {
    const token = typeof req.query.token === "string" ? req.query.token : null;

    if (!token) {
        throw ApiError.unauthorizedError(res, "Token is missing");
    }

    const decoded = JwtUtils.verifyEmailVerificationToken(token) as { email: string };
    
    const user = (await db.select().from(users).where(eq(users.email, decoded.email)))[0];

    if (!user) {
        throw ApiError.badRequestError(res, "User not found");
    }

    const isValid = await bcrypt.compare(token, user.emailVerificationToken!);
    if (!isValid) {
        throw ApiError.unauthorizedError(res, "Invalid token");
    }

    const updatedUser = await db.update(users).set({
        isEmailVerified: "true",
        emailVerificationToken: null,
    }).where(eq(users.email, user.email)).returning({
        id: users.id,
        email: users.email,
        name: users.name,
        isEmailVerified: users.isEmailVerified,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
    });

    ApiResponse.ok(res, "Email verified successfully", updatedUser);
};

export {
    register,
    login,
    verifyEmail
}