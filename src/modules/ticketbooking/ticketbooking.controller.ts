import type { Request, Response } from "express";
import ApiResponse from "../../common/utils/api.response.ts";
import ApiError from "../../common/utils/api.error.ts";
import { bookings, db, seats, users } from "../../common/DB/schema.ts";
import { eq } from "drizzle-orm";
import Email from "../../common/utils/email.utils.ts";
import type { bookingDto } from "./dto/booking.dto.ts";


const booking = async (req: Request, res: Response) => {
    try {
        const { seatNumber, userId, email } = req.body as bookingDto;
        console.log(seatNumber, userId, email);

        if (!seatNumber || !userId || !email) {
            return ApiError.badRequestError(res, "All fields are required");
        }

        const user = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
        if (!user[0]) {
            return ApiError.badRequestError(res, "User not found");
        }

        const ticket = await db.transaction(async (tx) => {
            const checkIsBooked = await tx.select().from(seats).where(eq(seats.seatNumber, seatNumber));
            if (checkIsBooked[0]?.isBooked) {
                return ApiError.badRequestError(res, "Seat is already booked");
            }

            const bookSeat = await tx.update(seats).set({
                isBooked: true,
            }).where(eq(seats.seatNumber, seatNumber)).returning({ id: seats.id, seatNumber: seats.seatNumber });

            const ticket = await tx.insert(bookings).values({
                userId: user[0]!.id,
                seatId: bookSeat[0]!.id,
            }).returning({ id: bookings.id, userId: bookings.userId, seatId: bookings.seatId });
            return ticket;
        })
        
        Email.seatConformationEmail(email,seatNumber);

        ApiResponse.created(res, "Ticket booked successfully", ticket);
    } catch (error) {
        ApiError.serverError();
    }
}

export { booking }