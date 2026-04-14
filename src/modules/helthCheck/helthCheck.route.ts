import { Router } from "express";
import healthCheck from "./helthCheck.controller.ts";

const router = Router();

router.get("/", healthCheck);

export default router;
