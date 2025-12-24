-- Add missing UPDATE policy for user_readings to allow upsert operations
-- This fixes the "Failed to save progress" error when redoing reading articles.

DO $$
BEGIN
    -- Check if user_readings table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_readings') THEN
        -- Add UPDATE policy
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'user_readings' 
            AND policyname = 'Allow users to update own readings'
        ) THEN
            CREATE POLICY "Allow users to update own readings"
              ON public.user_readings
              FOR UPDATE
              USING (auth.uid() = user_id)
              WITH CHECK (auth.uid() = user_id);
        END IF;
    END IF;
END $$;

