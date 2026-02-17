-- Create search_profiles table for user-defined filter profiles
-- Allows users to pre-filter SAM.gov searches without loading thousands of results

CREATE TABLE IF NOT EXISTS search_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  naics_codes TEXT[] DEFAULT '{}',
  min_budget INTEGER,
  max_budget INTEGER,
  min_days_to_deadline INTEGER,
  set_asides TEXT[] DEFAULT '{}',
  exclude_keywords TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_search_profiles_active ON search_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_search_profiles_created ON search_profiles(created_at DESC);

-- Add trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_search_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS search_profiles_update_trigger ON search_profiles;
CREATE TRIGGER search_profiles_update_trigger
  BEFORE UPDATE ON search_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_search_profiles_timestamp();

-- Insert default search profiles
INSERT INTO search_profiles (name, naics_codes, min_budget, max_budget, exclude_keywords, is_active)
VALUES
  ('Tech Contracts - Large ($50M+)',
   ARRAY['541511', '541512', '541513', '541519', '518210']::TEXT[],
   50000000,
   NULL,
   ARRAY['research', 'academic']::TEXT[],
   true),
  ('Construction - Medium ($5-20M)',
   ARRAY['236220']::TEXT[],
   5000000,
   20000000,
   ARRAY[]::TEXT[],
   true),
  ('All Categories - All Sizes',
   ARRAY['541511', '541512', '541513', '541519', '518210', '611420', '541330', '561210', '562910', '541620', '541618', '541690', '561621', '561730']::TEXT[],
   NULL,
   NULL,
   ARRAY[]::TEXT[],
   true)
ON CONFLICT (name) DO UPDATE SET
  naics_codes = EXCLUDED.naics_codes,
  min_budget = EXCLUDED.min_budget,
  max_budget = EXCLUDED.max_budget;

-- Verify
SELECT 'Search profiles table created' AS status;
SELECT COUNT(*) as profile_count FROM search_profiles;
