-- Create detection_sources table
CREATE TABLE IF NOT EXISTS public.detection_sources (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS on detection_sources
ALTER TABLE public.detection_sources ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read detection_sources"
  ON public.detection_sources
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert detection_sources"
  ON public.detection_sources
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update
CREATE POLICY "Allow authenticated users to update detection_sources"
  ON public.detection_sources
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to delete
CREATE POLICY "Allow authenticated users to delete detection_sources"
  ON public.detection_sources
  FOR DELETE
  USING (auth.role() = 'authenticated');
