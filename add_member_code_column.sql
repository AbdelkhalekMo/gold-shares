-- إضافة كود/رقم العضو الفريد لجدول المستخدمين
-- Run this code in Supabase SQL Editor
ALTER TABLE users ADD COLUMN IF NOT EXISTS member_code TEXT;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_member_code_key;
ALTER TABLE users ADD CONSTRAINT users_member_code_key UNIQUE (member_code);

-- إضافة تاريخ التسليم المتوقع للسهم كـ TEXT لجدول المستخدمين
ALTER TABLE users ADD COLUMN IF NOT EXISTS expected_delivery_date TEXT;

-- إضافة الحقول المطلوبة لجدول بيانات الأعضاء (user_profiles)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS telegram_phone TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS national_id TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS advance_payment_date DATE;


