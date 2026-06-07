-- إضافة الأعمدة الجديدة لجدول ملفات المشتركين (user_profiles)
-- Run this code in Supabase SQL Editor
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS telegram_phone TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS national_id TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS advance_payment_date DATE;
