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
