-- Add profile_image column to login table
ALTER TABLE login ADD COLUMN IF NOT EXISTS profile_image TEXT; 