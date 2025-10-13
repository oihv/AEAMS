# Database Migration Instructions

## Battery Field Migration

You need to run this SQL migration on your PostgreSQL database to add the battery fields.

### Option 1: Direct SQL Execution
Connect to your Supabase database and run this SQL:

```sql
-- Add battery column to secondary_rods table
ALTER TABLE secondary_rods ADD COLUMN battery DOUBLE PRECISION;

-- Add battery column to readings table  
ALTER TABLE readings ADD COLUMN battery DOUBLE PRECISION;

-- Add comments for documentation
COMMENT ON COLUMN secondary_rods.battery IS 'Battery percentage (0-100)';
COMMENT ON COLUMN readings.battery IS 'Battery percentage (0-100) at time of reading';
```

### Option 2: Using Prisma (when database is accessible)
```bash
# Push schema changes directly to database
npx prisma db push

# Or create a proper migration
npx prisma migrate dev --name add-battery-field
```

### After Migration
1. The battery field will be available in both `secondary_rods` and `readings` tables
2. Secondary rods can now send battery data in their API requests
3. The RodCard component will display battery levels with color coding:
   - Red (< 15%): Critical
   - Yellow (< 25%): Medium warning  
   - Green (≥ 75%): Good
   - White (25-74%): Normal

### Verify Migration
After running the migration, you can verify it worked by checking if the battery columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('secondary_rods', 'readings') 
AND column_name = 'battery';
```