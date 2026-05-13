-- ============================================================
-- Gold Shares System - Supabase RLS Policies
-- قم بتشغيل هذا الكود كاملاً في Supabase SQL Editor
-- ============================================================

-- 1. جدول المستخدمين
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

CREATE POLICY "users_select_policy" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert_policy" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update_policy" ON users FOR UPDATE USING (true);
CREATE POLICY "users_delete_policy" ON users FOR DELETE USING (true);

-- ============================================================

-- 2. جدول المعاملات المعلقة
ALTER TABLE pending_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pending_select_policy" ON pending_transactions;
DROP POLICY IF EXISTS "pending_insert_policy" ON pending_transactions;
DROP POLICY IF EXISTS "pending_update_policy" ON pending_transactions;
DROP POLICY IF EXISTS "pending_delete_policy" ON pending_transactions;

CREATE POLICY "pending_select_policy" ON pending_transactions FOR SELECT USING (true);
CREATE POLICY "pending_insert_policy" ON pending_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "pending_update_policy" ON pending_transactions FOR UPDATE USING (true);
CREATE POLICY "pending_delete_policy" ON pending_transactions FOR DELETE USING (true);

-- ============================================================

-- 3. جدول المعاملات المؤكدة
ALTER TABLE approved_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "approved_select_policy" ON approved_transactions;
DROP POLICY IF EXISTS "approved_insert_policy" ON approved_transactions;
DROP POLICY IF EXISTS "approved_update_policy" ON approved_transactions;
DROP POLICY IF EXISTS "approved_delete_policy" ON approved_transactions;

CREATE POLICY "approved_select_policy" ON approved_transactions FOR SELECT USING (true);
CREATE POLICY "approved_insert_policy" ON approved_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "approved_update_policy" ON approved_transactions FOR UPDATE USING (true);
CREATE POLICY "approved_delete_policy" ON approved_transactions FOR DELETE USING (true);

-- ============================================================
-- تم! الآن جميع الجداول مفتوحة للقراءة والكتابة من التطبيق.
-- ============================================================
