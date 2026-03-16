-- Create sites table
CREATE TABLE IF NOT EXISTS public.sites (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS on sites
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read sites"
  ON public.sites
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert sites"
  ON public.sites
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update
CREATE POLICY "Allow authenticated users to update sites"
  ON public.sites
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to delete
CREATE POLICY "Allow authenticated users to delete sites"
  ON public.sites
  FOR DELETE
  USING (auth.role() = 'authenticated');
