export type UserRole = 'admin' | 'user';
export type ShareType = 'full' | 'half';

export interface User {
  id: string;
  email: string;
  username: string;
  share_type: ShareType;
  advance: number; // مقدم
  remaining: number; // المتبقي
  paid: number; // المسدد
  totalAmount: number; // اجمالي_المبالغ
  isReceived: boolean; // تم_الاستلام
  role: UserRole;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  gram_price: number;
  grams: number;
  amount: number;
  created_at: string;
  user?: Partial<User>; // For joins
}

export interface ApprovedTransaction extends Transaction {
  transaction_number: number;
}

export interface Stats {
  totalUsers: number;
  totalTransactions: number;
  totalMoney: number;
  totalGrams: number;
}

export interface UserProfile {
  id: string;
  full_name: string;
  birth_date: string;
  age: number;
  address: string;
  educational_level: string;
  graduation_date: string;
  job: string;
  job_location: string;
  is_permanent: string;
  works_in_field: string;
  job_start_date: string;
  avg_net_income: number;
  can_commit_monthly: string;
  knows_gold_price_changes: string;
  planned_for_gold_increase: string;
  responsible_for_payment: string;
  marriage_current_step: string;
  marriage_next_step: string;
  marriage_next_step_date: string;
  will_provide_shabka: string;
  shabka_gold_needed: number;
  delayed_gold_until_wedding: number;
  expected_wedding_date: string;
  advance_payment_day: string;
  monthly_payment_day: string;
  expected_shabka_delivery_date: string;
  notes: string;
  is_locked: boolean;
  created_at?: string;
  updated_at?: string;
}
