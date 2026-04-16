import { z } from "zod"

const userRegisterDto = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long").trim(),
    email: z.email("Invalid email"),
    password: z.string().min(1, "Password is required").max(255, "Password is too long"),
})

export type UserRegisterDto = z.infer<typeof userRegisterDto>;

export default userRegisterDto;