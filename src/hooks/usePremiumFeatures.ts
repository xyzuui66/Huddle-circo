"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import toast from "react-hot-toast";

export type PremiumTier = "free" | "premium" | "pro";

export interface UserSubscription {
  id: string;
  user_id: string;
  tier: PremiumTier;
  status: "active" | "cancelled" | "expired";
  started_at: string;
  expires_at: string;
  auto_renew: boolean;
  created_at: string;
}

const PREMIUM_FEATURES = {
  free: {
    name: "Free",
    price: 0,
    features: [
      "Chat & messaging",
      "Join communities",
      "Create posts",
      "Live streaming",
      "Gift system",
      "Friend system",
      "Event discovery",
      "Basic profile",
    ],
    limits: {
      storageGB: 1,
      maxCommunities: 50,
      maxEvents: 5,
    },
  },
  premium: {
    name: "Premium",
    price: 4900,
    features: [
      "All Free features",
      "Exclusive badges & profile frames",
      "Priority in livestream queue",
      "Custom emojis & stickers",
      "Ad-free experience",
      "Early access to new features",
      "Custom profile theme",
      "Verified badge eligible",
    ],
    limits: {
      storageGB: 10,
      maxCommunities: 100,
      maxEvents: 20,
    },
  },
  pro: {
    name: "Pro Creator",
    price: 49900,
    features: [
      "All Premium features",
      "Creator analytics dashboard",
      "Advanced monetization",
      "Priority support",
      "Custom streaming setup",
      "Professional tools",
      "Creator program benefits",
      "Revenue insights",
    ],
    limits: {
      storageGB: 100,
      maxCommunities: 500,
      maxEvents: 100,
    },
  },
};

export function usePremiumFeatures() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  // Fetch user subscription
  const fetchSubscription = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Check if table exists, if not create it
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (error && error.code !== "PGRST116") {
        console.warn("Subscription table might not exist yet");
      }

      setSubscription(data || null);
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check if user has feature
  const hasFeature = useCallback(
    (feature: string): boolean => {
      const tier = subscription?.tier || "free";
      const tierFeatures = PREMIUM_FEATURES[tier]?.features || [];
      return tierFeatures.includes(feature);
    },
    [subscription]
  );

  // Get current tier limits
  const getTierLimits = useCallback(() => {
    const tier = subscription?.tier || "free";
    return PREMIUM_FEATURES[tier]?.limits || PREMIUM_FEATURES.free.limits;
  }, [subscription]);

  // Upgrade to premium
  const upgradeToPremium = useCallback(
    async (tier: "premium" | "pro") => {
      if (!user) {
        toast.error("Harus login dulu!");
        return false;
      }

      setLoading(true);

      try {
        // This is placeholder - in real app, integrate payment gateway
        const { error } = await supabase.from("user_subscriptions").upsert({
          user_id: user.id,
          tier,
          status: "active",
          started_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          auto_renew: true,
        });

        if (error) throw error;

        toast.success(`Upgrade ke ${PREMIUM_FEATURES[tier].name} berhasil!`);
        await fetchSubscription();
        return true;
      } catch (error) {
        console.error("Error upgrading:", error);
        toast.error("Gagal upgrade!");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [user, fetchSubscription]
  );

  // Cancel subscription
  const cancelSubscription = useCallback(async () => {
    if (!user || !subscription) return false;

    if (!confirm("Yakin mau cancel subscription?")) return false;

    setLoading(true);

    try {
      const { error } = await supabase
        .from("user_subscriptions")
        .update({ status: "cancelled" })
        .eq("id", subscription.id);

      if (error) throw error;

      toast.success("Subscription berhasil dibatalkan!");
      setSubscription(null);
      return true;
    } catch (error) {
      console.error("Error cancelling:", error);
      toast.error("Gagal cancel subscription!");
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, subscription]);

  return {
    subscription,
    loading,
    currentTier: subscription?.tier || "free",
    fetchSubscription,
    hasFeature,
    getTierLimits,
    upgradeToPremium,
    cancelSubscription,
    premiumFeatures: PREMIUM_FEATURES,
  };
}

// Helper function to show feature lock
export function FeatureLock({
  requiredTier,
  currentTier,
  children,
}: {
  requiredTier: "premium" | "pro";
  currentTier: PremiumTier;
  children: React.ReactNode;
}) {
  const isLocked = currentTier === "free";

  if (!isLocked) return <>{children}</>;

  return (
    <div className="relative group cursor-not-allowed opacity-50">
      <div className="pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span className="text-xs font-bold text-white bg-black/60 px-2 py-1 rounded">
          Premium feature
        </span>
      </div>
    </div>
  );
}
