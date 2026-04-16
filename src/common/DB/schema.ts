import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, serial, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

export const db = drizzle(process.env.DATABASE_URL!);

// const connectDB = async () => {
//     try {
//         await db.connect();
//         console.log("Database connected successfully");
//     } catch (error) {
//         console.error("Database connection failed", error);
//     }
// }

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    isEmailVerified: text("is_email_verified").default("false").notNull(),
    password: text('password').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    refreshToken: text('refresh_token'),
    emailVerificationToken: text('email_verification_token'),
    refreshTokenExpiry: timestamp('refresh_token_expiry'),
});

export const seats = pgTable('seats', {
    id: serial('id').primaryKey(),
    seatNumber: text('seat_number').notNull(),
    isBooked: boolean('is_booked').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const bookings = pgTable('bookings', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id),
    seatId: integer('seat_id').notNull().references(() => seats.id),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});
