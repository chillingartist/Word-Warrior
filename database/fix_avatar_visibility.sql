-- Allow all authenticated users to read user_settings
-- This is necessary so players can see each other's avatar colors/themes during battle

-- Drop the restrictive policy if it exists (to avoid conflicts or shadow)
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;

-- Create a new policy allowing any authenticated user to SELECT from user_settings
CREATE POLICY "Authenticated users can view all settings"
    ON public.user_settings FOR SELECT
    TO authenticated
    USING (true);

-- Note: Insert/Update policies should remain restricted to the user themselves (which they are, based on previous migration)
