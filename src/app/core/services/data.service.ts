import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { User, Stats, UserProfile } from '../interfaces/models.interface';

import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(private supabaseSvc: SupabaseService) {}

  // --- Users Management ---
  async getUsers() {
    return await this.supabaseSvc.client
      .from('users')
      .select('id, email, username, share_type, advance, remaining, paid, totalAmount, isReceived, role, created_at')
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
      paid: 0,
      totalAmount: 0,
      isReceived: false,
      role: 'user'
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
  async getPendingTransactions() {
    return await this.supabaseSvc.client
      .from('pending_transactions')
      .select('*, user:users(username)')
      .order('created_at', { ascending: false });
  }

  async addPendingTransaction(transaction: any) {
    return await this.supabaseSvc.client
      .from('pending_transactions')
      .insert([transaction]);
  }

  // --- Approved Transactions ---
  async getApprovedTransactions(userId?: string) {
    if (userId) {
      // When fetching for a specific user - simple query, no join needed
      return await this.supabaseSvc.client
        .from('approved_transactions')
        .select('id, user_id, gram_price, grams, amount, transaction_number, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    } else {
      // Admin view - join with user name
      return await this.supabaseSvc.client
        .from('approved_transactions')
        .select('id, user_id, gram_price, grams, amount, transaction_number, created_at, user:users!user_id(username)')
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
          amount: pendingTx.amount
        }]);

      if (insertError) throw insertError;

      // 2. Delete from pending
      const { error: deleteError } = await this.supabaseSvc.client
        .from('pending_transactions')
        .delete()
        .eq('id', pendingTx.id);

      if (deleteError) throw deleteError;

      return { success: true };
    } catch (error: any) {
      console.error(error);
      return { success: false, error: error.message };
    }
  }

  // --- Business Logic: Reject Pending ---
  async rejectTransaction(id: string) {
    return await this.supabaseSvc.client
      .from('pending_transactions')
      .delete()
      .eq('id', id);
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
    const { count: userCount } = await this.supabaseSvc.client
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: txCount } = await this.supabaseSvc.client
      .from('approved_transactions')
      .select('*', { count: 'exact', head: true });

    const { data: totals } = await this.supabaseSvc.client
      .from('users')
      .select('totalAmount, paid');

    const totalMoney = totals?.reduce((sum, u) => sum + Number(u.totalAmount), 0) || 0;
    const totalGrams = totals?.reduce((sum, u) => sum + Number(u.paid), 0) || 0;

    return {
      totalUsers: userCount || 0,
      totalTransactions: txCount || 0,
      totalMoney,
      totalGrams
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
      .select('*, user:users(username, email)')
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
}
