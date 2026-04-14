import { Router } from "express";
import { booking } from "./ticketbooking.controller.ts";

const router = Router();

router.post("/book", booking);

export default router;