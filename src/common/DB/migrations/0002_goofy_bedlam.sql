ALTER TABLE "users" ADD COLUMN "is_email_verified" text DEFAULT 'false' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_token" text;