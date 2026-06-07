-- إضافة عمود الجرامات المسلمة لجدول المستخدمين
-- Run this code in Supabase SQL Editor
ALTER TABLE users ADD COLUMN IF NOT EXISTS delivered_grams NUMERIC DEFAULT 0;
