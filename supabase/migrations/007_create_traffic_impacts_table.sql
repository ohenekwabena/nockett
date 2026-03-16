-- Create traffic_impacts table
CREATE TABLE IF NOT EXISTS public.traffic_impacts (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS on traffic_impacts
ALTER TABLE public.traffic_impacts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read traffic_impacts"
  ON public.traffic_impacts
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert traffic_impacts"
  ON public.traffic_impacts
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update
CREATE POLICY "Allow authenticated users to update traffic_impacts"
  ON public.traffic_impacts
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to delete
CREATE POLICY "Allow authenticated users to delete traffic_impacts"
  ON public.traffic_impacts
  FOR DELETE
  USING (auth.role() = 'authenticated');
