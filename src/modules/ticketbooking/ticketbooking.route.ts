import { Router } from "express";
import { booking } from "./ticketbooking.controller.ts";
import { validate } from "../auth/auth.validate.ts";
import bookingDto from "./dto/booking.dto.ts";

const router = Router();

router.post("/book", validate(bookingDto), booking);

export default router;