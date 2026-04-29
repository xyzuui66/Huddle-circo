"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import toast from "react-hot-toast";

export interface PaymentGateway {
  name: "xendit" | "midtrans" | "manual";
  display_name: string;
  description: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: integer;
  bank_name: string;
  bank_account: string;
  account_holder: string;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  processed_at?: string;
  reference_number?: string;
}

export interface Revenue {
  source: "gifts" | "premium" | "sponsorship";
  amount: number;
  date: string;
}

// PAYMENT GATEWAYS CONFIG
const PAYMENT_METHODS = {
  xendit: {
    name: "xendit",
    display_name: "Xendit",
    description: "Bank transfer, e-wallet, kartu kredit",
    fee_percent: 2.5,
    min_amount: 10000,
    api_url: "https://api.xendit.co",
  },
  midtrans: {
    name: "midtrans",
    display_name: "Midtrans",
    description: "Bank transfer, e-wallet, cicilan",
    fee_percent: 2.8,
    min_amount: 10000,
    api_url: "https://api.midtrans.com",
  },
  manual: {
    name: "manual",
    display_name: "Transfer Manual",
    description: "Direct bank transfer",
    fee_percent: 0,
    min_amount: 50000,
    api_url: null,
  },
};

export function useMonetization() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  // Fetch wallet balance
  const fetchBalance = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("wallets")
        .select("balance, total_earned")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setBalance(data.balance || 0);
        setTotalEarned(data.total_earned || 0);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  }, [user]);

  // Add gift transaction (ketika user kirim gift)
  const addGiftTransaction = useCallback(
    async (giftAmount: number, gifterName: string, streamerName: string) => {
      if (!user) return false;

      setLoading(true);

      try {
        // Create stream gift record
        const { error: giftError } = await supabase
          .from("stream_gifts")
          .insert({
            stream_id: `stream-${Date.now()}`,
            gifter_id: user.id,
            gift_id: "placeholder",
            quantity: 1,
            total_amount: giftAmount,
            gifter_name: gifterName,
            status: "confirmed",
          });

        if (giftError) throw giftError;

        // Create transaction record
        const { error: txError } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            type: "gift_sent",
            amount: giftAmount,
            description: `Gift to ${streamerName}`,
            status: "completed",
          });

        if (txError) throw txError;

        toast.success(`Gift Rp ${giftAmount.toLocaleString("id-ID")} terkirim!`);
        await fetchBalance();
        return true;
      } catch (error) {
        console.error("Error adding gift transaction:", error);
        toast.error("Gagal kirim gift!");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user, fetchBalance]
  );

  // Request withdrawal dengan payment gateway
  const requestWithdrawal = useCallback(
    async (
      amount: number,
      bankName: string,
      bankAccount: string,
      accountHolder: string,
      paymentGateway: "xendit" | "midtrans" | "manual"
    ) => {
      if (!user) {
        toast.error("Harus login dulu!");
        return false;
      }

      if (amount < PAYMENT_METHODS[paymentGateway].min_amount) {
        toast.error(
          `Minimum withdrawal Rp ${PAYMENT_METHODS[paymentGateway].min_amount.toLocaleString("id-ID")}`
        );
        return false;
      }

      if (amount > balance) {
        toast.error("Balance tidak cukup!");
        return false;
      }

      setLoading(true);

      try {
        // Calculate fee
        const feePercent = PAYMENT_METHODS[paymentGateway].fee_percent;
        const fee = Math.ceil((amount * feePercent) / 100);
        const netAmount = amount - fee;

        // Create withdrawal record
        const { data: withdrawal, error } = await supabase
          .from("withdrawals")
          .insert({
            user_id: user.id,
            amount: netAmount,
            bank_name: bankName,
            bank_account: bankAccount,
            account_holder: accountHolder,
            payment_gateway: paymentGateway,
            status: "pending",
            fee: fee,
            gross_amount: amount,
          })
          .select()
          .single();

        if (error) throw error;

        // Update wallet
        const newBalance = balance - amount;
        const { error: walletError } = await supabase
          .from("wallets")
          .update({ balance: newBalance })
          .eq("user_id", user.id);

        if (walletError) throw walletError;

        // Create transaction record
        const { error: txError } = await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            type: "withdrawal",
            amount: amount,
            description: `Withdrawal to ${bankName}`,
            reference_id: withdrawal.id,
            status: "pending",
          });

        if (txError) throw txError;

        toast.success(
          `Withdrawal request berhasil! Akan diproses dalam 1-3 hari kerja.`
        );
        await fetchBalance();
        return true;
      } catch (error) {
        console.error("Error requesting withdrawal:", error);
        toast.error("Gagal request withdrawal!");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user, balance, fetchBalance]
  );

  // Get withdrawal history
  const fetchWithdrawals = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error && error.code !== "PGRST116") throw error;

      setWithdrawals(data || []);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    }
  }, [user]);

  // Get revenue summary
  const getRevenueSummary = useCallback(async (days: number = 30) => {
    if (!user) return null;

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("transactions")
        .select("type, amount, created_at")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const summary = {
        total: 0,
        gifts: 0,
        premium: 0,
        sponsorship: 0,
      };

      data?.forEach((tx) => {
        summary.total += tx.amount;
        if (tx.type === "gift_received") summary.gifts += tx.amount;
        if (tx.type === "premium_payment") summary.premium += tx.amount;
        if (tx.type === "sponsorship") summary.sponsorship += tx.amount;
      });

      return summary;
    } catch (error) {
      console.error("Error getting revenue summary:", error);
      return null;
    }
  }, [user]);

  return {
    balance,
    totalEarned,
    loading,
    withdrawals,
    paymentMethods: PAYMENT_METHODS,
    fetchBalance,
    addGiftTransaction,
    requestWithdrawal,
    fetchWithdrawals,
    getRevenueSummary,
  };
}

// Helper: Calculate commission
export function calculateCommission(
  amount: number,
  commissionPercent: number = 25
): { platform: number; creator: number } {
  const platform = Math.ceil((amount * commissionPercent) / 100);
  const creator = amount - platform;
  return { platform, creator };
}

// Helper: Calculate withdrawal net
export function calculateWithdrawalNet(
  amount: number,
  feePercent: number
): { fee: number; net: number } {
  const fee = Math.ceil((amount * feePercent) / 100);
  const net = amount - fee;
  return { fee, net };
}
