-- Create ticket_attachments table
CREATE TABLE IF NOT EXISTS public.ticket_attachments (
  id BIGSERIAL PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

-- Recreate policies safely
DROP POLICY IF EXISTS "Allow authenticated users to read ticket_attachments" ON public.ticket_attachments;
DROP POLICY IF EXISTS "Allow authenticated users to insert own ticket_attachments" ON public.ticket_attachments;
DROP POLICY IF EXISTS "Allow owners or admins to delete ticket_attachments" ON public.ticket_attachments;

CREATE POLICY "Allow authenticated users to read ticket_attachments"
  ON public.ticket_attachments
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert own ticket_attachments"
  ON public.ticket_attachments
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (uploaded_by IS NULL OR uploaded_by = auth.uid())
  );

CREATE POLICY "Allow owners or admins to delete ticket_attachments"
  ON public.ticket_attachments
  FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND (
      uploaded_by = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.id = auth.uid()
          AND LOWER(COALESCE(u.role, '')) = 'admin'
      )
    )
  );

-- Storage object policies for attachments bucket
DROP POLICY IF EXISTS "Allow authenticated users to read attachments objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload attachments objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete attachments objects" ON storage.objects;

CREATE POLICY "Allow authenticated users to read attachments objects"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'attachments'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated users to upload attachments objects"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'attachments'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated users to delete attachments objects"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'attachments'
    AND auth.role() = 'authenticated'
  );
