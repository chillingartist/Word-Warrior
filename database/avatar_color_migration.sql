-- Add avatar_color column to user_settings
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS avatar_color TEXT DEFAULT 'blue';

-- Update the handle_new_user function to include avatar_color
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.profiles (id, email, username, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    false
  );
  
  -- Create initial user stats
  INSERT INTO public.user_stats (
    user_id, 
    level, 
    exp, 
    atk, 
    def, 
    crit, 
    hp, 
    max_hp, 
    rank, 
    rank_points, 
    win_streak, 
    mastered_words_count, 
    login_days
  )
  VALUES (
    NEW.id,
    1,      -- level
    0,      -- exp
    10,     -- atk
    10,     -- def
    0.05,   -- crit
    100,    -- hp
    100,    -- max_hp
    'Bronze', -- rank
    120,    -- rank_points
    0,      -- win_streak
    0,      -- mastered_words_count
    1       -- login_days
  );

  -- Create default user settings
  INSERT INTO public.user_settings (user_id, theme_mode, theme_color, avatar_color)
  VALUES (
    NEW.id,
    'system',
    'indigo',
    'blue'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
