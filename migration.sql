-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."farms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "plant_type" TEXT NOT NULL DEFAULT 'Unknown',
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."main_rods" (
    "id" TEXT NOT NULL,
    "rod_id" TEXT NOT NULL,
    "farm_id" TEXT,
    "is_connected" BOOLEAN NOT NULL DEFAULT false,
    "last_seen" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "main_rods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."secondary_rods" (
    "id" TEXT NOT NULL,
    "rod_id" TEXT NOT NULL,
    "name" TEXT,
    "location" TEXT,
    "main_rod_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_seen" TIMESTAMP(3),
    "position_x" DOUBLE PRECISION,
    "position_y" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "secondary_rods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."readings" (
    "id" TEXT NOT NULL,
    "secondary_rod_id" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION,
    "moisture" DOUBLE PRECISION,
    "ph" DOUBLE PRECISION,
    "conductivity" DOUBLE PRECISION,
    "n" DOUBLE PRECISION,
    "p" DOUBLE PRECISION,
    "k" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "public"."verificationtokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "public"."accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "public"."sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "config_key_key" ON "public"."config"("key");

-- CreateIndex
CREATE UNIQUE INDEX "main_rods_rod_id_key" ON "public"."main_rods"("rod_id");

-- CreateIndex
CREATE UNIQUE INDEX "main_rods_farm_id_key" ON "public"."main_rods"("farm_id");

-- CreateIndex
CREATE UNIQUE INDEX "secondary_rods_rod_id_key" ON "public"."secondary_rods"("rod_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_suggestions_reading_id_key" ON "public"."ai_suggestions"("reading_id");

-- CreateIndex
CREATE INDEX "ai_suggestions_secondary_rod_id_idx" ON "public"."ai_suggestions"("secondary_rod_id");

-- CreateIndex
CREATE UNIQUE INDEX "verificationtokens_identifier_token_key" ON "public"."verificationtokens"("identifier", "token");

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."farms" ADD CONSTRAINT "farms_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."main_rods" ADD CONSTRAINT "main_rods_farm_id_fkey" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."secondary_rods" ADD CONSTRAINT "secondary_rods_main_rod_id_fkey" FOREIGN KEY ("main_rod_id") REFERENCES "public"."main_rods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."readings" ADD CONSTRAINT "readings_secondary_rod_id_fkey" FOREIGN KEY ("secondary_rod_id") REFERENCES "public"."secondary_rods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_suggestions" ADD CONSTRAINT "ai_suggestions_reading_id_fkey" FOREIGN KEY ("reading_id") REFERENCES "public"."readings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_suggestions" ADD CONSTRAINT "ai_suggestions_secondary_rod_id_fkey" FOREIGN KEY ("secondary_rod_id") REFERENCES "public"."secondary_rods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

