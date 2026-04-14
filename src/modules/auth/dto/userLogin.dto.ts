import { z } from "zod"

const userLoginDto = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password is required").max(255, "Password is too long"),
})

export type UserLoginDto = z.infer<typeof userLoginDto>;

export default userLoginDto;