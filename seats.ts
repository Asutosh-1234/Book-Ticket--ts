import { db } from "./src/common/DB/schema.ts";
import { seats } from "./src/common/DB/schema.ts";

async function seedSeats() {
    const seatData = Array.from({ length: 20 }, (_, i) => ({
        seatNumber: `A${i + 1}`,
    }));

    await db.insert(seats).values(seatData);
}

seedSeats();