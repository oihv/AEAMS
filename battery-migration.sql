-- Migration to add battery field to secondary_rods and readings tables
-- Run this SQL script on your database when connectivity is restored

-- Add battery column to secondary_rods table
ALTER TABLE secondary_rods ADD COLUMN battery DOUBLE PRECISION;

-- Add battery column to readings table  
ALTER TABLE readings ADD COLUMN battery DOUBLE PRECISION;

-- Add comments for documentation
COMMENT ON COLUMN secondary_rods.battery IS 'Battery percentage (0-100)';
COMMENT ON COLUMN readings.battery IS 'Battery percentage (0-100) at time of reading';