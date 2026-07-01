-- Add settings-specific preference columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT 'blue',
  ADD COLUMN IF NOT EXISTS public_profile BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_linkedin BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_portfolio BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS receive_product_updates BOOLEAN DEFAULT true;
