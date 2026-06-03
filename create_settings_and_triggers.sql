-- 0. تعديل قيد نوع السهم وإضافة الأعمدة الجديدة في جدول المستخدمين
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_share_type_check;
ALTER TABLE users ADD CONSTRAINT users_share_type_check CHECK (share_type IN ('full', 'half', 'custom'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS gift NUMERIC DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS initial_advance NUMERIC DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS initial_remaining NUMERIC DEFAULT 0;

UPDATE users SET gift = 0 WHERE gift IS NULL;

-- إضافة أعمدة تصنيف الدفع لجدول العمليات والطلبات (في حال عدم وجودها)
ALTER TABLE pending_transactions ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'normal';
ALTER TABLE pending_transactions ADD COLUMN IF NOT EXISTS payment_period VARCHAR(20);

ALTER TABLE approved_transactions ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'normal';
ALTER TABLE approved_transactions ADD COLUMN IF NOT EXISTS payment_period VARCHAR(20);

-- تهيئة البيانات السابقة بنوع دفع افتراضي
UPDATE pending_transactions 
SET payment_type = 'normal', payment_period = '1_month' 
WHERE payment_type IS NULL OR payment_type = '';

UPDATE approved_transactions 
SET payment_type = 'normal', payment_period = '1_month' 
WHERE payment_type IS NULL OR payment_type = '';

-- 1. إنشاء جدول الإعدادات العامة للجمعية
CREATE TABLE IF NOT EXISTS association_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  full_share_total NUMERIC NOT NULL DEFAULT 31.5,
  full_share_advance NUMERIC NOT NULL DEFAULT 3.5,
  half_share_advance NUMERIC NOT NULL DEFAULT 1.5,
  full_share_gift NUMERIC NOT NULL DEFAULT 0,
  half_share_gift NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. إدخال السجل الافتراضي الأول في حال عدم وجوده
INSERT INTO association_settings (id, full_share_total, full_share_advance, half_share_advance, full_share_gift, half_share_gift)
VALUES (1, 31.5, 3.5, 1.5, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- 3. تفعيل الحماية لجدول الإعدادات
ALTER TABLE association_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select_policy" ON association_settings;
CREATE POLICY "settings_select_policy" ON association_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "settings_all_policy" ON association_settings;
CREATE POLICY "settings_all_policy" ON association_settings FOR ALL USING (true) WITH CHECK (true);

-- 4. سكربت ترحيل البيانات القديمة وتهيئة الأعمدة الجديدة للمستخدمين الحاليين
DO $$
DECLARE
  settings RECORD;
  full_adv NUMERIC;
  full_gift NUMERIC;
  half_adv NUMERIC;
  half_gift NUMERIC;
  full_tot NUMERIC;
BEGIN
  SELECT * INTO settings FROM association_settings WHERE id = 1 LIMIT 1;
  IF settings IS NOT NULL THEN
    full_adv := settings.full_share_advance;
    full_gift := COALESCE(settings.full_share_gift, 0);
    half_adv := settings.half_share_advance;
    half_gift := COALESCE(settings.half_share_gift, 0);
    full_tot := settings.full_share_total;
  ELSE
    full_adv := 3.5;
    full_gift := 0.5;
    half_adv := 1.5;
    half_gift := 0.25;
    full_tot := 31.5;
  END IF;

  -- تهيئة مستخدمي السهم الكامل
  UPDATE users
  SET 
    initial_advance = full_adv + full_gift,
    initial_remaining = full_tot - full_adv - full_gift
  WHERE share_type = 'full' AND (initial_advance = 0 OR initial_advance IS NULL);

  -- تهيئة مستخدمي نصف السهم
  UPDATE users
  SET 
    initial_advance = half_adv + half_gift,
    initial_remaining = (full_tot / 2.0) - half_adv - half_gift
  WHERE share_type = 'half' AND (initial_advance = 0 OR initial_advance IS NULL);

  -- تهيئة مستخدمي السهم المخصص
  UPDATE users
  SET 
    initial_advance = COALESCE(advance, 0) + (SELECT COALESCE(SUM(grams), 0) FROM approved_transactions WHERE user_id = users.id AND payment_type = 'advance'),
    initial_remaining = COALESCE(remaining, 0) + (SELECT COALESCE(SUM(grams), 0) FROM approved_transactions WHERE user_id = users.id AND payment_type = 'normal')
  WHERE share_type = 'custom' AND (initial_advance = 0 OR initial_advance IS NULL);
END $$;

-- 5. دالة تريجر العمليات المعتمدة لتحديث الأرصدة وخصم الدفعات من متبقي المقدم ومتبقي السهم بشكل منفصل
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  user_initial_adv NUMERIC;
  user_initial_rem NUMERIC;
  user_gift NUMERIC;
  paid_adv NUMERIC;
  paid_norm NUMERIC;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    target_user_id := NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    target_user_id := OLD.user_id;
  END IF;

  -- الحصول على القيم المبدئية للعضو والهدية
  SELECT COALESCE(initial_advance, 0), COALESCE(initial_remaining, 0), COALESCE(gift, 0) 
  INTO user_initial_adv, user_initial_rem, user_gift 
  FROM users 
  WHERE id = target_user_id;

  -- حساب إجمالي الجرامات المسددة لكل نوع على حدة
  SELECT COALESCE(SUM(grams), 0) INTO paid_adv FROM approved_transactions WHERE user_id = target_user_id AND payment_type = 'advance';
  SELECT COALESCE(SUM(grams), 0) INTO paid_norm FROM approved_transactions WHERE user_id = target_user_id AND payment_type = 'normal';

  -- تحديث بيانات العضو
  UPDATE users
  SET 
    paid = paid_adv + paid_norm,
    "totalAmount" = (SELECT COALESCE(SUM(amount), 0) FROM approved_transactions WHERE user_id = target_user_id),
    advance = GREATEST(0, (user_initial_adv - user_gift) - paid_adv),
    remaining = GREATEST(0, user_initial_rem - paid_norm)
  WHERE id = target_user_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- إعادة ربط التريجر بالدالة المحدثة
DROP TRIGGER IF EXISTS trg_update_user_stats ON approved_transactions;
CREATE TRIGGER trg_update_user_stats
AFTER INSERT OR UPDATE OR DELETE ON approved_transactions
FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- 6. إنشاء تريجر على جدول الإعدادات لتحديث القيم المبدئية للأعضاء وإعادة حساب الأرصدة
CREATE OR REPLACE FUNCTION update_all_users_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. تحديث القيم المبدئية للأعضاء بناء على الإعدادات الجديدة
  UPDATE users
  SET 
    gift = CASE WHEN share_type = 'full' THEN NEW.full_share_gift ELSE NEW.half_share_gift END,
    initial_advance = CASE WHEN share_type = 'full' THEN (NEW.full_share_advance + NEW.full_share_gift) ELSE (NEW.half_share_advance + NEW.half_share_gift) END,
    initial_remaining = (CASE WHEN share_type = 'full' THEN NEW.full_share_total ELSE (NEW.full_share_total / 2.0) END) 
                        - (CASE WHEN share_type = 'full' THEN (NEW.full_share_advance + NEW.full_share_gift) ELSE (NEW.half_share_advance + NEW.half_share_gift) END)
  WHERE share_type IN ('full', 'half');

  -- 2. إعادة احتساب الأرصدة الحالية بناء على الدفعات الفعلية المسجلة
  UPDATE users
  SET
    advance = GREATEST(0, (initial_advance - COALESCE(gift, 0)) - (SELECT COALESCE(SUM(grams), 0) FROM approved_transactions WHERE user_id = users.id AND payment_type = 'advance')),
    remaining = GREATEST(0, initial_remaining - (SELECT COALESCE(SUM(grams), 0) FROM approved_transactions WHERE user_id = users.id AND payment_type = 'normal')),
    paid = (SELECT COALESCE(SUM(grams), 0) FROM approved_transactions WHERE user_id = users.id)
  WHERE share_type IN ('full', 'half');

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_all_users_settings ON association_settings;
CREATE TRIGGER trg_update_all_users_settings
AFTER INSERT OR UPDATE ON association_settings
FOR EACH ROW EXECUTE FUNCTION update_all_users_settings();

-- 7. تحديث الأرصدة لكافة المستخدمين الحاليين بناء على الدفعات والقيم المبدئية
UPDATE users
SET
  advance = GREATEST(0, (initial_advance - COALESCE(gift, 0)) - (SELECT COALESCE(SUM(grams), 0) FROM approved_transactions WHERE user_id = users.id AND payment_type = 'advance')),
  remaining = GREATEST(0, initial_remaining - (SELECT COALESCE(SUM(grams), 0) FROM approved_transactions WHERE user_id = users.id AND payment_type = 'normal')),
  paid = (SELECT COALESCE(SUM(grams), 0) FROM approved_transactions WHERE user_id = users.id);
