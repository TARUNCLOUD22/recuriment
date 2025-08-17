/*
  # Update jobs table for simplified posting

  1. Changes
    - Make posted_by nullable and change to text for email
    - Remove foreign key constraint
    - Add poster_name field
    - Update RLS policies for public access

  2. Security
    - Allow anyone to view active jobs
    - Allow anyone to create jobs with email/name
*/

-- Drop existing foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'jobs_posted_by_fkey'
  ) THEN
    ALTER TABLE jobs DROP CONSTRAINT jobs_posted_by_fkey;
  END IF;
END $$;

-- Modify posted_by to store email instead of user ID
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'posted_by' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE jobs ALTER COLUMN posted_by TYPE text;
  END IF;
END $$;

-- Add poster_name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'poster_name'
  ) THEN
    ALTER TABLE jobs ADD COLUMN poster_name text;
  END IF;
END $$;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Anyone can view active jobs" ON jobs;
DROP POLICY IF EXISTS "Authenticated users can create jobs" ON jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON jobs;
DROP POLICY IF EXISTS "Users can delete own jobs" ON jobs;

-- Create new RLS policies for public access
CREATE POLICY "Anyone can view active jobs"
  ON jobs
  FOR SELECT
  TO public
  USING (status = 'active');

CREATE POLICY "Anyone can create jobs"
  ON jobs
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Poster can update own jobs"
  ON jobs
  FOR UPDATE
  TO public
  USING (posted_by = current_setting('request.jwt.claims', true)::json->>'email')
  WITH CHECK (posted_by = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Poster can delete own jobs"
  ON jobs
  FOR DELETE
  TO public
  USING (posted_by = current_setting('request.jwt.claims', true)::json->>'email');