-- ============================================================
-- Gold Shares System - Add Payment Classification Columns & Migrate Old Data
-- قم بتشغيل هذا الكود في Supabase SQL Editor لتحديث الجداول
-- ============================================================

-- 1. إضافة الأعمدة لجدول الطلبات المعلقة (pending_transactions)
ALTER TABLE pending_transactions ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'normal';
ALTER TABLE pending_transactions ADD COLUMN IF NOT EXISTS payment_period VARCHAR(20);

-- 2. إضافة الأعمدة لجدول العمليات المعتمدة (approved_transactions)
ALTER TABLE approved_transactions ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'normal';
ALTER TABLE approved_transactions ADD COLUMN IF NOT EXISTS payment_period VARCHAR(20);

-- 3. تحديث البيانات القديمة لتكون دفع عادي لمدة شهر واحد كحالة افتراضية
UPDATE pending_transactions 
SET payment_type = 'normal', payment_period = '1_month' 
WHERE payment_type IS NULL OR payment_type = '';

UPDATE approved_transactions 
SET payment_type = 'normal', payment_period = '1_month' 
WHERE payment_type IS NULL OR payment_type = '';
