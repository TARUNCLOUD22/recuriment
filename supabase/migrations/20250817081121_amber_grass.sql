/*
  # Create jobs table for recruitment application

  1. New Tables
    - `jobs`
      - `id` (uuid, primary key)
      - `title` (text, job title)
      - `company` (text, company name)
      - `location` (text, job location)
      - `type` (text, employment type)
      - `salary` (text, salary range)
      - `description` (text, job description)
      - `requirements` (text array, job requirements)
      - `tags` (text array, job tags)
      - `posted_by` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `status` (text, job status)

  2. Security
    - Enable RLS on `jobs` table
    - Add policies for authenticated users to create jobs
    - Add policies for public read access to active jobs
    - Add policies for job owners to manage their jobs
*/

CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text NOT NULL,
  location text NOT NULL,
  type text NOT NULL DEFAULT 'Full-time',
  salary text DEFAULT '',
  description text NOT NULL,
  requirements text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  posted_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'draft', 'closed'))
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Policy for public read access to active jobs
CREATE POLICY "Anyone can view active jobs"
  ON jobs
  FOR SELECT
  USING (status = 'active');

-- Policy for authenticated users to create jobs
CREATE POLICY "Authenticated users can create jobs"
  ON jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = posted_by);

-- Policy for job owners to update their jobs
CREATE POLICY "Users can update own jobs"
  ON jobs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = posted_by)
  WITH CHECK (auth.uid() = posted_by);

-- Policy for job owners to delete their jobs
CREATE POLICY "Users can delete own jobs"
  ON jobs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = posted_by);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS jobs_status_created_at_idx ON jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS jobs_posted_by_idx ON jobs(posted_by);
CREATE INDEX IF NOT EXISTS jobs_title_company_idx ON jobs USING gin(to_tsvector('english', title || ' ' || company));