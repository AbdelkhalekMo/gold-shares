import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { User, Stats, UserProfile } from '../interfaces/models.interface';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  pendingCount = signal<number>(0);

  constructor(private supabaseSvc: SupabaseService) {}

  async refreshPendingCount() {
    try {
      const { count, error } = await this.supabaseSvc.client
        .from('pending_transactions')
        .select('*', { count: 'exact', head: true });
      if (!error && count !== null) {
        this.pendingCount.set(count);
      }
    } catch (err) {
      console.error('Error refreshing pending count:', err);
    }
  }

  // --- Users Management ---
  async getUsers() {
    return await this.supabaseSvc.client
      .from('users')
      .select('id, email, username, share_type, advance, remaining, paid, totalAmount, isReceived, role, created_at, gift, initial_advance, initial_remaining, delivered_grams, member_code, expected_delivery_date')
      .order('created_at', { ascending: false });
  }

  async getUser(id: string) {
    return await this.supabaseSvc.client
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
  }

  async addUser(userData: any) {
    const dbData = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      share_type: userData.share_type,
      advance: userData.advance,
      remaining: userData.remaining,
      initial_advance: userData.advance,
      initial_remaining: userData.remaining,
      paid: 0,
      totalAmount: 0,
      isReceived: false,
      role: userData.role || 'user',
      gift: userData.gift || 0,
      member_code: userData.member_code || null,
      expected_delivery_date: userData.expected_delivery_date || null
    };
    return await this.supabaseSvc.client
      .from('users')
      .insert([dbData])
      .select()
      .single();
  }

  async updateUser(id: string, updates: any) {
    return await this.supabaseSvc.client
      .from('users')
      .update(updates)
      .eq('id', id);
  }

  async deleteUser(id: string) {
    return await this.supabaseSvc.client
      .from('users')
      .delete()
      .eq('id', id);
  }

  // --- Pending Transactions ---
  async getPendingTransactions(userId?: string) {
    let query = this.supabaseSvc.client
      .from('pending_transactions')
      .select('*, user:users(username, advance, gift, member_code)');
      
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    return await query.order('created_at', { ascending: false });
  }

  async addPendingTransaction(transaction: any) {
    const res = await this.supabaseSvc.client
      .from('pending_transactions')
      .insert([transaction]);
    this.refreshPendingCount();
    return res;
  }

  // --- Approved Transactions ---
  async addApprovedTransaction(transaction: any) {
    return await this.supabaseSvc.client
      .from('approved_transactions')
      .insert([transaction]);
  }

  async updateApprovedTransaction(id: string, updates: any) {
    return await this.supabaseSvc.client
      .from('approved_transactions')
      .update(updates)
      .eq('id', id);
  }

  async getApprovedTransactions(userId?: string) {
    if (userId) {
      // When fetching for a specific user - simple query, no join needed
      return await this.supabaseSvc.client
        .from('approved_transactions')
        .select('id, user_id, gram_price, grams, amount, transaction_number, payment_type, payment_period, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    } else {
      // Admin view - join with user name
      return await this.supabaseSvc.client
        .from('approved_transactions')
        .select('id, user_id, gram_price, grams, amount, transaction_number, payment_type, payment_period, created_at, user:users!user_id(username, advance, gift, member_code)')
        .order('created_at', { ascending: false });
    }
  }

  // --- Business Logic: Approve Transaction ---
  async approveTransaction(pendingTx: any) {
    try {
      // 1. Insert into approved_transactions (Trigger will update user stats automatically)
      const { error: insertError } = await this.supabaseSvc.client
        .from('approved_transactions')
        .insert([{
          user_id: pendingTx.user_id,
          gram_price: pendingTx.gram_price,
          grams: pendingTx.grams,
          amount: pendingTx.amount,
          payment_type: pendingTx.payment_type || 'normal',
          payment_period: pendingTx.payment_type === 'normal' ? (pendingTx.payment_period || '1_month') : null
        }]);

      if (insertError) throw insertError;

      // 2. Delete from pending
      const { error: deleteError } = await this.supabaseSvc.client
        .from('pending_transactions')
        .delete()
        .eq('id', pendingTx.id);

      if (deleteError) throw deleteError;

      this.refreshPendingCount();
      return { success: true };
    } catch (error: any) {
      console.error(error);
      return { success: false, error: error.message };
    }
  }

  // --- Business Logic: Reject Pending ---
  async rejectTransaction(id: string) {
    const res = await this.supabaseSvc.client
      .from('pending_transactions')
      .delete()
      .eq('id', id);
    this.refreshPendingCount();
    return res;
  }

  // --- Business Logic: Delete Approved Transaction (Revert) ---
  async deleteApprovedTransaction(tx: any) {
    try {
      // Delete the approved transaction (Trigger will automatically revert user stats)
      const { error: deleteError } = await this.supabaseSvc.client
        .from('approved_transactions')
        .delete()
        .eq('id', tx.id);

      if (deleteError) {
        console.error('Error deleting transaction:', deleteError);
        throw new Error('فشل في حذف المعاملة: ' + deleteError.message);
      }

      return { success: true };
    } catch (error: any) {
      console.error('deleteApprovedTransaction failed:', error);
      return { success: false, error: error.message };
    }
  }

  // --- Dashboard Stats ---
  async getAdminStats(): Promise<Stats> {
    // 1. Fetch settings to get dynamic share weights
    const { data: settings } = await this.getAssociationSettings();
    const fullTotal = settings ? Number(settings.full_share_total) : 31.5;
    const halfTotal = fullTotal / 2.0;

    // 2. Fetch all members
    const { data: users } = await this.supabaseSvc.client
      .from('users')
      .select('share_type, isReceived, remaining, paid, advance, gift')
      .eq('role', 'user');

    const totalUsers = users?.length || 0;
    const receivedCount = users?.filter(u => u.isReceived).length || 0;

    // Calculate Total Required Grams from all members
    const totalRequiredGrams = users?.reduce((sum, u) => {
      if (u.share_type === 'full') {
        return sum + fullTotal;
      } else if (u.share_type === 'half') {
        return sum + halfTotal;
      } else {
        const targetWeight = Number(u.remaining || 0) + Number(u.paid || 0) + Number(u.advance || 0);
        return sum + targetWeight;
      }
    }, 0) || 0;

    // 3. Count of approved transactions
    const { count: txCount } = await this.supabaseSvc.client
      .from('approved_transactions')
      .select('*', { count: 'exact', head: true });

    // 4. Sum of amount and grams directly from approved_transactions
    const { data: txData } = await this.supabaseSvc.client
      .from('approved_transactions')
      .select('amount, grams');

    const totalMoney = txData?.reduce((sum, tx) => sum + Number(tx.amount || 0), 0) || 0;
    const totalGrams = txData?.reduce((sum, tx) => sum + Number(tx.grams || 0), 0) || 0;

    const remainingGrams = totalRequiredGrams - totalGrams;
    const totalGiftsGrams = users?.reduce((sum, u) => sum + Number(u.gift || 0), 0) || 0;

    const paidGiftsGrams = users?.reduce((sum, u) => {
      const g = Number(u.gift || 0);
      const adv = Number(u.advance || 0);
      const paid = Number(u.paid || 0);
      const baseAdvance = adv - g;
      const userPaidGift = Math.min(g, Math.max(0, paid - baseAdvance));
      return sum + userPaidGift;
    }, 0) || 0;

    const remainingGiftsGrams = totalGiftsGrams - paidGiftsGrams;

    return {
      totalUsers,
      totalTransactions: txCount || 0,
      totalMoney,
      totalGrams,
      totalRequiredGrams,
      receivedCount,
      remainingGrams: remainingGrams > 0 ? remainingGrams : 0,
      totalGiftsGrams,
      paidGiftsGrams,
      remainingGiftsGrams
    };
  }

  // --- User Profiles ---
  async getUserProfile(userId: string) {
    return await this.supabaseSvc.client
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
  }

  async getAllUserProfiles() {
    return await this.supabaseSvc.client
      .from('user_profiles')
      .select('*, user:users(username, email, advance, gift, member_code)')
      .order('created_at', { ascending: false });
  }

  async saveUserProfile(profile: any) {
    return await this.supabaseSvc.client
      .from('user_profiles')
      .insert([profile]);
  }

  async updateUserProfile(userId: string, updates: any) {
    return await this.supabaseSvc.client
      .from('user_profiles')
      .update(updates)
      .eq('id', userId);
  }

  // --- Association Settings ---
  async getAssociationSettings() {
    return await this.supabaseSvc.client
      .from('association_settings')
      .select('*')
      .eq('id', 1)
      .single();
  }

  async updateAssociationSettings(updates: any) {
    return await this.supabaseSvc.client
      .from('association_settings')
      .update(updates)
      .eq('id', 1);
  }
}
