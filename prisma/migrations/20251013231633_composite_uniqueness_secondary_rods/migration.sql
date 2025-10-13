-- CreateIndex
-- Add composite unique constraint for secondary rods (rodId + mainRodId)
-- This allows multiple secondary rods to have the same rodId as long as they belong to different main rods

-- First, drop the existing unique constraint on rod_id alone
DROP INDEX IF EXISTS "secondary_rods_rod_id_key";

-- Create the new composite unique constraint
CREATE UNIQUE INDEX "secondary_rods_rodId_mainRodId_key" ON "secondary_rods"("rod_id", "main_rod_id");