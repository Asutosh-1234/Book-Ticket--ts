import { z } from "zod"

const bookingDto = z.object({
    userId: z.string(),
    email: z.email("Invalid email"),
    seatNumber: z.string().trim().nonempty("Seat number is required")
})

export type bookingDto = z.infer<typeof bookingDto>;

export default bookingDto;