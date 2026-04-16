import { Router } from "express";
import { login, register, verifyEmail } from "./auth.controller.js";
import userLoginDto from "./dto/userLogin.dto.js";
import userRegisterDto from "./dto/userRegister.dto.js";
import { validate } from "./auth.validate.js";

const router = Router();

router.post('/register', validate(userRegisterDto), register);
router.post('/login', validate(userLoginDto), login);
router.get('/verify-email', verifyEmail);
// router.post('/refresh', refresh);

export default router;