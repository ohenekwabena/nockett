-- Fix issue_start and issue_cleared to be BOOLEAN instead of TIMESTAMP
ALTER TABLE public.tickets
ALTER COLUMN issue_start TYPE BOOLEAN USING NULL,
ALTER COLUMN issue_cleared TYPE BOOLEAN USING NULL;

-- Set default values
ALTER TABLE public.tickets
ALTER COLUMN issue_start SET DEFAULT FALSE,
ALTER COLUMN issue_cleared SET DEFAULT FALSE;
