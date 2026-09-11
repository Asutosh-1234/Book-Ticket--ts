import { db, users, seats, bookings } from "../common/DB/schema.ts";
import { eq, count, sql, and } from "drizzle-orm";
import { booking } from "../modules/ticketbooking/ticketbooking.controller.ts";

/**
 * Demo Data Seeder & Optimization Benchmark Suite
 * 
 * Target: 1000 Users and 1000 Seats
 * Purpose: Benchmark concurrency, PostgreSQL row locking (FOR UPDATE / SKIP LOCKED), 
 *          and race condition safety during high-volume ticket booking.
 */

// Configuration
const NUM_USERS = 1000;
const NUM_SEATS = 1000;
const BATCH_SIZE = 500; // Efficient batch insert size

/**
 * 1. SEED DATA FUNCTION
 * Fills the database with 1000 demo users and 1000 demo seats in batches.
 */
export async function seedDemoData() {
	console.log("Starting Demo Data Seeding...");
	const startTime = Date.now();

	// Clear existing data (in correct relational order)
	console.log("Cleaning existing bookings, seats, and users...");
	await db.delete(bookings);
	await db.delete(seats);
	await db.delete(users);

	// 1. Prepare & Insert Users in Batches
	console.log(`Inserting ${NUM_USERS} demo users...`);
	const userData = Array.from({ length: NUM_USERS }, (_, i) => ({
		name: `Demo User ${i + 1}`,
		email: `demo_user_${i + 1}@example.com`,
		isEmailVerified: "true",
		password: "hashed_demo_password_123",
	}));

	for (let i = 0; i < userData.length; i += BATCH_SIZE) {
		const chunk = userData.slice(i, i + BATCH_SIZE);
		await db.insert(users).values(chunk);
	}

	// 2. Prepare & Insert Seats in Batches
	console.log(`Inserting ${NUM_SEATS} demo seats...`);
	const seatData = Array.from({ length: NUM_SEATS }, (_, i) => ({
		seatNumber: `S-${i + 1}`,
		isBooked: false,
	}));

	for (let i = 0; i < seatData.length; i += BATCH_SIZE) {
		const chunk = seatData.slice(i, i + BATCH_SIZE);
		await db.insert(seats).values(chunk);
	}

	const duration = ((Date.now() - startTime) / 1000).toFixed(2);
	console.log(`Demo Data Seeded Successfully in ${duration}s (${NUM_USERS} users, ${NUM_SEATS} seats)!`);
}

/**
 * CORE BOOKING TRANSACTION QUERY (Optimized with Row Locking)
 * Simulates the database transaction logic used in ticket booking.
 */
export async function bookTicketQuery(email: string, seatNumber: string) {
	try {
		const ticket = await db.transaction(async (tx) => {
			const user = await tx
				.select({ id: users.id })
				.from(users)
				.where(eq(users.email, email));

			if (!user[0]) {
				return { success: false, reason: "User not found" };
			}

			const bookSeat = await tx
				.update(seats)
				.set({ isBooked: true })
				.where(and(
					eq(seats.seatNumber, seatNumber),
					eq(seats.isBooked, false)
				))
				.returning({ id: seats.id, seatNumber: seats.seatNumber });

			if (!bookSeat[0]) {
				return {
					success: false,
					reason: "Seat is already booked or does not exist",
				};
			}

			const ticket = await tx
				.insert(bookings)
				.values({
					userId: user[0]!.id,
					seatId: bookSeat[0]!.id,
				})
				.returning({
					id: bookings.id,
					userId: bookings.userId,
					seatId: bookings.seatId
				});

			return ticket;
		});

		return {
			success: true,
			ticket: ticket[0],
		};
	} catch (error: any) {
		return { success: false, reason: error?.message || "Transaction error" };
	}
}

/**
 * 2. BENCHMARK TEST: HOTSPOT CONCURRENCY (Single Popular Seat)
 * 100 users try to book seat "S-1" at the exact same millisecond.
 */
export async function testHotspotConcurrency(concurrentRequests = 100) {
	console.log(`\n⚡ TEST 1: Hotspot Concurrency (${concurrentRequests} users booking seat 'S-1' simultaneously)`);
	const targetSeat = "S-1";

	const promises = Array.from({ length: concurrentRequests }, (_, i) => {
		const userEmail = `demo_user_${i + 1}@example.com`;
		return bookTicketQuery(userEmail, targetSeat);
	});

	const start = Date.now();
	const results = await Promise.all(promises);
	const timeTakenMs = Date.now() - start;

	const successful = results.filter((r) => r.success).length;
	const failed = results.filter((r) => !r.success).length;

	console.log(`Duration: ${timeTakenMs} ms`);
	console.log(`Successful Bookings: ${successful} (Expected: 1)`);
	console.log(`Rejections / Skips: ${failed}`);
	console.log(`Throughput: ${((concurrentRequests / timeTakenMs) * 1000).toFixed(1)} req/sec`);

	if (successful === 1) {
		console.log("PASS: Exactly 1 user got seat 'S-1'. Zero double-bookings!");
	} else {
		console.error(`FAIL: Expected 1 booking, got ${successful}`);
	}
}

/**
 * 3. BENCHMARK TEST: DISTRIBUTED HIGH-LOAD (1,000 Users -> 1,000 Seats)
 * 1,000 users concurrently book 1,000 unique seats.
 */
export async function testDistributedLoad(totalRequests = 1000) {
	console.log(`\nTEST 2: Distributed Load Benchmark (${totalRequests} unique users booking ${totalRequests} unique seats)`);

	// First re-seed so all seats are available
	await seedDemoData();

	const promises = Array.from({ length: totalRequests }, (_, i) => {
		const userEmail = `demo_user_${i + 1}@example.com`;
		const seatNumber = `S-${i + 1}`;
		return bookTicketQuery(userEmail, seatNumber);
	});

	const start = Date.now();
	const results = await Promise.all(promises);
	const timeTakenMs = Date.now() - start;

	const successful = results.filter((r) => r.success).length;
	const failed = results.filter((r) => !r.success).length;
	const tps = ((totalRequests / timeTakenMs) * 1000).toFixed(1);

	console.log(`Duration: ${timeTakenMs} ms`);
	console.log(`Successful Bookings: ${successful} / ${totalRequests}`);
	console.log(`Failed Bookings: ${failed}`);
	console.log(`Performance: ${tps} Transactions Per Second (TPS)`);
}

/**
 * 4. BENCHMARK TEST: HIGH CONTENTION (1,000 Users competing for 100 Seats)
 * 1,000 users compete for seats S-1 to S-100.
 */
export async function testHighContentionOverbooking(totalUsers = 1000, numAvailableSeats = 100) {
	console.log(`\nTEST 3: High Contention Overbooking (${totalUsers} users competing for ${numAvailableSeats} seats)`);

	await seedDemoData();

	const promises = Array.from({ length: totalUsers }, (_, i) => {
		const userEmail = `demo_user_${i + 1}@example.com`;
		// Pick a seat randomly among S-1 to S-100
		const seatIndex = (i % numAvailableSeats) + 1;
		const seatNumber = `S-${seatIndex}`;
		return bookTicketQuery(userEmail, seatNumber);
	});

	const start = Date.now();
	const results = await Promise.all(promises);
	const timeTakenMs = Date.now() - start;

	const successful = results.filter((r) => r.success).length;
	const failed = results.filter((r) => !r.success).length;

	console.log(`Duration: ${timeTakenMs} ms`);
	console.log(`Total Booked: ${successful} (Max possible: ${numAvailableSeats})`);
	console.log(`Rejected: ${failed}`);
}

/**
 * 5. DATABASE INTEGRITY & DOUBLE-BOOKING AUDIT
 */
export async function verifyDatabaseIntegrity() {
	console.log("\nRunning Database Integrity & Anti-Double-Booking Audit...");

	// Query 1: Total Bookings Count
	const totalBookingsResult = await db.select({ value: count() }).from(bookings);
	const totalBookingsCount = Number(totalBookingsResult[0]?.value || 0);

	// Query 2: Seats marked as booked
	const bookedSeatsResult = await db
		.select({ value: count() })
		.from(seats)
		.where(eq(seats.isBooked, true));
	const bookedSeatsCount = Number(bookedSeatsResult[0]?.value || 0);

	// Query 3: Check for duplicate seat IDs in bookings table
	const duplicateBookings = await db.execute(
		sql`SELECT seat_id, COUNT(*) as count FROM bookings GROUP BY seat_id HAVING COUNT(*) > 1`
	);

	console.log(`Total rows in 'bookings' table: ${totalBookingsCount}`);
	console.log(`Total seats with 'is_booked = true': ${bookedSeatsCount}`);

	if (duplicateBookings.rows.length > 0) {
		console.error(`CRITICAL ERROR: Found ${duplicateBookings.rows.length} double-booked seat(s)!`);
		console.error(duplicateBookings.rows);
	} else {
		console.log(`ZERO Double-Bookings Detected! Database Integrity Verified.`);
	}
}

/**
 * MAIN EXECUTION ROUTINE
 */
async function runAllDemoTests() {
	try {
		console.log("   TICKET BOOKING OPTIMIZATION BENCHMARK SUITE   ");

		// 1. Seed Initial Data (1,000 seats & 1,000 users)
		await seedDemoData();

		// 2. Test 1: Single seat hotspot concurrency
		await testHotspotConcurrency(100);

		// 3. Test 2: Distributed load test
		await testDistributedLoad(1000);

		// 4. Test 3: Overbooking high contention test
		await testHighContentionOverbooking(1000, 100);

		// 5. Audit final DB state
		await verifyDatabaseIntegrity();

		console.log("✅ ALL BENCHMARK TESTS COMPLETED!");
		process.exit(0);
	} catch (error) {
		console.error("❌ Execution Error:", error);
		process.exit(1);
	}
}

runAllDemoTests();