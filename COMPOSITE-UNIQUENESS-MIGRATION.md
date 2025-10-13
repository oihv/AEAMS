# Composite Uniqueness Migration Guide

## Overview
This migration adds composite uniqueness to secondary rods, allowing multiple secondary rods to have the same `rodId` as long as they belong to different main rods.

## Schema Changes
- Removed unique constraint on `rodId` alone
- Added composite unique constraint on `(rodId, mainRodId)`

## Migration Steps

### Option 1: Apply the prepared migration
```bash
# When database is accessible, run:
cd /home/nikolas/Programming/repos/AEAMS
npx prisma migrate deploy
```

### Option 2: Manual SQL execution
If you prefer to run the SQL manually:

```sql
-- Drop the existing unique constraint on rod_id alone
DROP INDEX IF EXISTS "secondary_rods_rod_id_key";

-- Create the new composite unique constraint  
CREATE UNIQUE INDEX "secondary_rods_rodId_mainRodId_key" ON "secondary_rods"("rod_id", "main_rod_id");
```

### Option 3: Retry Prisma migration creation
When database is accessible:
```bash
npx prisma migrate dev --name composite-uniqueness-secondary-rods
```

## Pre-Migration Checks
Before running the migration, verify no conflicts exist:

```sql
-- Check for duplicate (rodId, mainRodId) combinations
SELECT rod_id, main_rod_id, COUNT(*) as count
FROM secondary_rods 
GROUP BY rod_id, main_rod_id 
HAVING COUNT(*) > 1;
```

If conflicts exist, resolve them before migration.

## Post-Migration Verification
```bash
# Verify schema is correct
npx prisma db pull

# Check the application builds
npm run build

# Test API endpoints
curl -X GET "http://localhost:3000/api/health"
```

## Rollback (if needed)
To rollback the changes:
```sql
-- Remove composite constraint
DROP INDEX IF EXISTS "secondary_rods_rodId_mainRodId_key";

-- Restore original unique constraint  
CREATE UNIQUE INDEX "secondary_rods_rod_id_key" ON "secondary_rods"("rod_id");
```

## Notes
- The application code has already been updated to use the composite constraint
- API endpoints now find secondary rods through user farm relationships
- This change maintains backward compatibility from the user perspective