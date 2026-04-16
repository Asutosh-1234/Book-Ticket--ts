import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./modules/auth/auth.route.js";
import healthCheckRouter from "./modules/helthCheck/helthCheck.route.ts";
import bookingRouter from "./modules/ticketbooking/ticketbooking.route.ts";
import morgan from "morgan";

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));
app.use(morgan("combined"));

app.use('/api/v1/auth', authRouter);
app.use("/healthCheck", healthCheckRouter)
app.use("/api/v1/booking", bookingRouter)

export default app;