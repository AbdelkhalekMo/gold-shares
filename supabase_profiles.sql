-- Gold Shares System - User Profiles Table
-- Run this code in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  birth_date DATE,
  age INTEGER,
  address TEXT,
  educational_level TEXT,
  graduation_date DATE,
  job TEXT,
  job_location TEXT,
  is_permanent TEXT, -- 'ثابت' | 'عقد سنوي'
  works_in_field TEXT, -- 'نعم' | 'لا'
  job_start_date DATE,
  avg_net_income NUMERIC,
  can_commit_monthly TEXT, -- 'نعم' | 'لا'
  knows_gold_price_changes TEXT, -- 'نعم' | 'لا'
  planned_for_gold_increase TEXT, -- 'نعم' | 'لا'
  responsible_for_payment TEXT,
  marriage_current_step TEXT,
  marriage_next_step TEXT,
  marriage_next_step_date DATE,
  will_provide_shabka TEXT, -- 'نعم' | 'لا'
  shabka_gold_needed NUMERIC,
  delayed_gold_until_wedding NUMERIC,
  expected_wedding_date DATE,
  advance_payment_day TEXT,
  monthly_payment_day TEXT,
  expected_shabka_delivery_date DATE,
  notes TEXT,
  is_locked BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON user_profiles;
CREATE POLICY "Profiles are viewable by owner" ON user_profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles are insertable by owner" ON user_profiles;
CREATE POLICY "Profiles are insertable by owner" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles are updateable by admin" ON user_profiles;
-- Note: Admin role check depends on your users table structure. 
-- Since the app uses a role column in 'users', we can use it.
CREATE POLICY "Profiles are updateable by admin" ON user_profiles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy for Admin to see all profiles
DROP POLICY IF EXISTS "Admins can see all profiles" ON user_profiles;
CREATE POLICY "Admins can see all profiles" ON user_profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);
