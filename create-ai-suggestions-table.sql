-- Create AI suggestions table
CREATE TABLE "public"."ai_suggestions" (
    "id" TEXT NOT NULL,
    "reading_id" TEXT NOT NULL,
    "secondary_rod_id" TEXT NOT NULL,
    "plant_type" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "suggestion" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_suggestions_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX "ai_suggestions_reading_id_key" ON "public"."ai_suggestions"("reading_id");
CREATE INDEX "ai_suggestions_secondary_rod_id_idx" ON "public"."ai_suggestions"("secondary_rod_id");

-- Add foreign keys
ALTER TABLE "public"."ai_suggestions" ADD CONSTRAINT "ai_suggestions_reading_id_fkey" FOREIGN KEY ("reading_id") REFERENCES "public"."readings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."ai_suggestions" ADD CONSTRAINT "ai_suggestions_secondary_rod_id_fkey" FOREIGN KEY ("secondary_rod_id") REFERENCES "public"."secondary_rods"("id") ON DELETE CASCADE ON UPDATE CASCADE;