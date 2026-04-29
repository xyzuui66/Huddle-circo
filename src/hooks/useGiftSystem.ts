"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import toast from "react-hot-toast";

interface Gift {
  id: string;
  name: string;
  icon: string;
  price: number;
  animation: string;
}

interface StreamGift {
  id: string;
  stream_id: string;
  gifter_id: string;
  gift_id: string;
  quantity: number;
  total_amount: number;
  gifter_name: string;
  gifter_note?: string;
  status: "pending" | "confirmed";
  created_at: string;
}

interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  bank_account?: string;
  bank_name?: string;
  account_holder?: string;
  donation_note?: string;
}

export function useGiftSystem() {
  const { user } = useAuth();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  // Fetch all gifts
  const fetchGifts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("gifts")
        .select("*")
        .order("display_order");

      if (error) throw error;
      setGifts(data || []);
    } catch (error) {
      console.error("Error fetching gifts:", error);
      toast.error("Gagal memuat gift!");
    }
  }, []);

  // Fetch user wallet
  const fetchWallet = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (!data && user) {
        // Create wallet if not exists
        const { data: newWallet } = await supabase
          .from("wallets")
          .insert({
            user_id: user.id,
            balance: 0,
            total_earned: 0,
          })
          .select()
          .single();

        setWallet(newWallet);
      } else {
        setWallet(data);
      }
    } catch (error) {
      console.error("Error fetching wallet:", error);
    }
  }, [user]);

  // Send gift
  const sendGift = useCallback(
    async (
      streamId: string,
      giftId: string,
      quantity: number,
      note?: string
    ) => {
      if (!user) {
        toast.error("Harus login dulu!");
        return false;
      }

      setLoading(true);

      try {
        const gift = gifts.find((g) => g.id === giftId);
        if (!gift) throw new Error("Gift tidak ditemukan");

        const totalAmount = gift.price * quantity;

        // Insert gift record
        const { data, error } = await supabase
          .from("stream_gifts")
          .insert({
            stream_id: streamId,
            gifter_id: user.id,
            gift_id: giftId,
            quantity,
            total_amount: totalAmount,
            gifter_name: user.email?.split("@")[0] || "Anonymous",
            gifter_note: note,
            status: "pending",
          })
          .select()
          .single();

        if (error) throw error;

        toast.success(`Gift berhasil dikirim! Rp ${totalAmount.toLocaleString("id-ID")}`);
        return true;
      } catch (error) {
        console.error("Error sending gift:", error);
        toast.error("Gagal kirim gift!");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user, gifts]
  );

  // Confirm gift (viewer confirm after transfer)
  const confirmGift = useCallback(
    async (giftId: string, hostId: string) => {
      if (!user) return false;

      setLoading(true);

      try {
        const { data: giftData, error: giftError } = await supabase
          .from("stream_gifts")
          .select("total_amount")
          .eq("id", giftId)
          .single();

        if (giftError) throw giftError;

        // Update gift status
        const { error: updateError } = await supabase
          .from("stream_gifts")
          .update({ status: "confirmed", confirmed_at: new Date() })
          .eq("id", giftId);

        if (updateError) throw updateError;

        // Update host wallet
        const { error: walletError } = await supabase.rpc(
          "increment_wallet",
          {
            p_user_id: hostId,
            p_amount: giftData.total_amount,
          }
        );

        // If RPC doesn't exist, do manual update
        if (walletError) {
          const { data: hostWallet } = await supabase
            .from("wallets")
            .select("balance, total_earned")
            .eq("user_id", hostId)
            .single();

          if (hostWallet) {
            await supabase
              .from("wallets")
              .update({
                balance: (hostWallet.balance || 0) + giftData.total_amount,
                total_earned: (hostWallet.total_earned || 0) + giftData.total_amount,
              })
              .eq("user_id", hostId);
          }
        }

        // Create transaction record
        await supabase.from("transactions").insert({
          user_id: hostId,
          type: "gift_received",
          amount: giftData.total_amount,
          description: `Menerima gift dari ${user.email}`,
          reference_id: giftId,
          status: "completed",
        });

        toast.success("Gift dikonfirmasi!");
        return true;
      } catch (error) {
        console.error("Error confirming gift:", error);
        toast.error("Gagal konfirmasi gift!");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Update wallet bank info
  const updateWalletBankInfo = useCallback(
    async (bankInfo: {
      bank_name?: string;
      bank_account?: string;
      account_holder?: string;
      donation_note?: string;
    }) => {
      if (!user) return false;

      setLoading(true);

      try {
        const { error } = await supabase
          .from("wallets")
          .update(bankInfo)
          .eq("user_id", user.id);

        if (error) throw error;

        toast.success("Info rekening berhasil diupdate!");
        await fetchWallet();
        return true;
      } catch (error) {
        console.error("Error updating wallet:", error);
        toast.error("Gagal update info rekening!");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user, fetchWallet]
  );

  // Get stream gifts
  const getStreamGifts = useCallback(
    async (streamId: string) => {
      try {
        const { data, error } = await supabase
          .from("stream_gifts")
          .select("*")
          .eq("stream_id", streamId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching stream gifts:", error);
        return [];
      }
    },
    []
  );

  // Get top gifters
  const getTopGifters = useCallback(
    async (streamId: string, limit = 10) => {
      try {
        const { data, error } = await supabase
          .from("stream_gifts")
          .select("gifter_id, gifter_name, total_amount")
          .eq("stream_id", streamId)
          .eq("status", "confirmed")
          .order("total_amount", { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching top gifters:", error);
        return [];
      }
    },
    []
  );

  return {
    gifts,
    wallet,
    loading,
    fetchGifts,
    fetchWallet,
    sendGift,
    confirmGift,
    updateWalletBankInfo,
    getStreamGifts,
    getTopGifters,
  };
}
