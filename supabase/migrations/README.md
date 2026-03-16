# Supabase Database Migrations

This directory contains SQL migration scripts for the Nockett ticket system database schema updates.

## Migration Files

1. **001_add_ticket_incident_fields.sql** - Adds incident timing and entity reference fields to the `tickets` table
2. **002_create_demarcations_table.sql** - Creates the `demarcations` entity table
3. **003_create_links_table.sql** - Creates the `links` entity table
4. **004_create_sites_table.sql** - Creates the `sites` entity table
5. **005_create_service_types_table.sql** - Creates the `service_types` entity table
6. **006_create_detection_sources_table.sql** - Creates the `detection_sources` entity table
7. **007_create_traffic_impacts_table.sql** - Creates the `traffic_impacts` entity table

## How to Run Migrations in Supabase

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire content of each migration file (in order)
5. Click **Run** to execute each migration
6. Verify the success message appears

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# First, make sure you're logged in
supabase login

# Link to your project
supabase link --project-id YOUR_PROJECT_ID

# Push migrations
supabase db push
```

## New Ticket Fields Added

### Incident and Timing Fields
- `incident_date` - Timestamp when the incident occurred
- `issue_start` - When the issue started
- `detection_time` - When the issue was detected
- `escalation_time` - When escalation occurred
- `provider_notified_time` - When the provider was notified
- `issue_cleared` - When the issue was resolved
- `restoration_time_confirmed` - When restoration was confirmed
- `gross_downtime_min` - Total downtime in minutes
- `provider_downtime_min` - Provider downtime in minutes
- `root_cause_lev1` - Level 1 root cause
- `root_cause_lev2` - Level 2 root cause
- `sla_impacted` - Boolean indicating SLA impact
- `redundancy_available` - Boolean indicating redundancy availability
- `partner_impacted` - Boolean indicating partner impact
- `rfo_received` - Boolean indicating RFO received
- `preventive_action` - Preventive actions taken

### Entity Reference Fields
- `demarcation` - Reference to demarcation type
- `link_name` - Reference to link name
- `site_id` - Reference to site ID
- `service_type` - Reference to service type
- `detection_source` - Reference to detection source
- `traffic_impact` - Reference to traffic impact

## New Entity Tables

Each entity table has the following structure:
```sql
CREATE TABLE tablename (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

All tables have Row Level Security (RLS) enabled with policies allowing authenticated users to:
- READ (SELECT)
- CREATE (INSERT)
- UPDATE
- DELETE

## Verification

After running all migrations, verify they were successful by checking:
1. The `tickets` table has all new columns
2. New tables appear in your database schema: `demarcations`, `links`, `sites`, `service_types`, `detection_sources`, `traffic_impacts`

## Rollback (if needed)

To rollback changes, you can drop the new tables and columns:

```sql
-- Drop new entity tables
DROP TABLE IF EXISTS public.traffic_impacts;
DROP TABLE IF EXISTS public.detection_sources;
DROP TABLE IF EXISTS public.service_types;
DROP TABLE IF EXISTS public.sites;
DROP TABLE IF EXISTS public.links;
DROP TABLE IF EXISTS public.demarcations;

-- Drop new ticket columns
ALTER TABLE public.tickets DROP COLUMN IF EXISTS incident_date;
ALTER TABLE public.tickets DROP COLUMN IF EXISTS issue_start;
-- ... (drop remaining columns)
```

However, exercise caution as DROP operations cannot be undone without backups.
