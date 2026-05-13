# نظام إدارة جمعية أسهم الذهب (Gold Shares Management System)

موقع احترافي لإدارة جمعيات الذهب، مبني باستخدام **Angular 17+ (Standalone)** و **Supabase**.

## المميزات
- **تصميم RTL بالكامل**: متوافق مع اللغة العربية وتصميم عصري مريح للعين.
- **إدارة المستخدمين**: إضافة وتعديل وحذف المشتركين (سهم كامل أو نصف سهم).
- **نظام معاملات ذكي**: إضافة جرامات، مراجعة الأدمن، وتحديث تلقائي للرصيد.
- **حساب التأخير**: تنبيه تلقائي للمتأخرين عن السداد بناءً على جدول زمني (كل 3 أشهر).
- **حماية المسارات**: نظام تسجيل دخول وحماية للمسارات حسب الصلاحيات (أدمن / مستخدم).

## المتطلبات الأساسية
- **Node.js** (نسخة 18 أو أحدث).
- **Angular CLI**.
- حساب على **Supabase**.

## طريقة التشغيل
1. قم بتحميل المشروع.
2. قم بتشغيل الأمر التالي لتثبيت المكتبات:
   ```bash
   npm install
   ```
3. اذهب إلى ملف `src/environments/environment.ts` وقم بوضع بيانات الـ API الخاصة بـ Supabase:
   ```typescript
   export const environment = {
     supabaseUrl: 'رابط_مشروعك_هنا',
     supabaseKey: 'مفتاح_الـ_API_هنا'
   };
   ```
4. لتشغيل المشروع محلياً:
   ```bash
   npm start
   ```

## ربط قاعدة البيانات (Supabase)
قم بتنفيذ الأوامر التالية في **SQL Editor** داخل Supabase لإنشاء الجداول المطلوبة:

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  username text not null,
  password text not null,
  share_type text not null check (share_type in ('full', 'half')),
  مقدم numeric default 0,
  المتبقي numeric default 0,
  المسدد numeric default 0,
  اجمالي_المبالغ numeric default 0,
  تم_الاستلام boolean default false,
  role text default 'user',
  created_at timestamp default now()
);

create table pending_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  gram_price numeric not null,
  grams numeric not null,
  amount numeric not null,
  created_at timestamp default now()
);

create table approved_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  gram_price numeric not null,
  grams numeric not null,
  amount numeric not null,
  transaction_number serial,
  created_at timestamp default now()
);

-- إضافة حساب أدمن تجريبي
insert into users (email, username, password, share_type, role)
values ('admin@gold.com', 'المدير العام', 'admin123', 'full', 'admin');
```

## هيكلية المشروع
- `src/app/core`: يحتوي على الخدمات (Services)، الحماية (Guards)، والواجهات (Interfaces).
- `src/app/shared`: المكونات المشتركة مثل الـ Navbar والـ Sidebar والـ Layouts.
- `src/app/features`: الأجزاء الرئيسية للموقع (Admin / User / Auth).

## التواصل
تم التطوير بواسطة **Antigravity AI**.
