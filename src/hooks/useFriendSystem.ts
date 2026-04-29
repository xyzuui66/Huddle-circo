"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import toast from "react-hot-toast";

export interface FriendRequest {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "declined";
  message?: string;
  created_at: string;
  requester?: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface Friend {
  id: string;
  user_id_1: string;
  user_id_2: string;
  status: "active" | "blocked";
  created_at: string;
  friend?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface UserInterest {
  id: string;
  user_id: string;
  interest: string;
  category: "gaming" | "content" | "community" | "casual";
}

export interface FriendSuggestion {
  id: string;
  suggested_user_id: string;
  reason: "mutual_friend" | "shared_interest" | "same_community";
  score: number;
  suggested_user?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

export function useFriendSystem() {
  const { user } = useAuth();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [interests, setInterests] = useState<UserInterest[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch friend requests
  const fetchFriendRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("friend_requests")
        .select(
          `
          *,
          requester:profiles(id, username, full_name, avatar_url)
        `
        )
        .eq("receiver_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFriendRequests(data || []);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch friends list
  const fetchFriends = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("friends")
        .select("*")
        .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch friend details
      const friendIds = data?.map((f) =>
        f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1
      );

      if (friendIds && friendIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .in("id", friendIds);

        const friendsWithDetails = data?.map((f) => ({
          ...f,
          friend: profiles?.find(
            (p) => p.id === (f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1)
          ),
        }));

        setFriends(friendsWithDetails || []);
      } else {
        setFriends([]);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch user interests
  const fetchInterests = useCallback(async (userId?: string) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return;

    try {
      const { data, error } = await supabase
        .from("user_interests")
        .select("*")
        .eq("user_id", targetUserId);

      if (error) throw error;
      setInterests(data || []);
    } catch (error) {
      console.error("Error fetching interests:", error);
    }
  }, [user]);

  // Fetch friend suggestions
  const fetchSuggestions = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("friend_suggestions")
        .select(
          `
          *,
          suggested_user:profiles(id, username, full_name, avatar_url)
        `
        )
        .eq("user_id", user.id)
        .order("score", { ascending: false })
        .limit(10);

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Send friend request
  const sendFriendRequest = useCallback(
    async (receiverId: string, message?: string) => {
      if (!user) {
        toast.error("Harus login dulu!");
        return false;
      }

      if (user.id === receiverId) {
        toast.error("Tidak bisa add diri sendiri!");
        return false;
      }

      try {
        const { error } = await supabase.from("friend_requests").insert({
          requester_id: user.id,
          receiver_id: receiverId,
          message,
          status: "pending",
        });

        if (error) throw error;

        toast.success("Friend request terkirim!");
        return true;
      } catch (error) {
        console.error("Error sending request:", error);
        toast.error("Gagal kirim friend request!");
        return false;
      }
    },
    [user]
  );

  // Accept friend request
  const acceptFriendRequest = useCallback(
    async (requestId: string, requesterId: string) => {
      if (!user) return false;

      try {
        // Update friend request
        const { error: reqError } = await supabase
          .from("friend_requests")
          .update({ status: "accepted", responded_at: new Date() })
          .eq("id", requestId);

        if (reqError) throw reqError;

        // Create friendship
        const sortedIds = [user.id, requesterId].sort();
        const { error: friendError } = await supabase.from("friends").insert({
          user_id_1: sortedIds[0],
          user_id_2: sortedIds[1],
          status: "active",
        });

        if (friendError && !friendError.message.includes("duplicate")) {
          throw friendError;
        }

        toast.success("Friend request accepted!");
        await fetchFriendRequests();
        await fetchFriends();
        return true;
      } catch (error) {
        console.error("Error accepting request:", error);
        toast.error("Gagal accept friend request!");
        return false;
      }
    },
    [user, fetchFriendRequests, fetchFriends]
  );

  // Decline friend request
  const declineFriendRequest = useCallback(async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("friend_requests")
        .update({ status: "declined", responded_at: new Date() })
        .eq("id", requestId);

      if (error) throw error;

      toast.success("Friend request declined!");
      return true;
    } catch (error) {
      console.error("Error declining request:", error);
      toast.error("Gagal decline friend request!");
      return false;
    }
  }, []);

  // Remove friend
  const removeFriend = useCallback(
    async (friendId: string) => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from("friends")
          .delete()
          .or(
            `and(user_id_1.eq.${user.id},user_id_2.eq.${friendId}),and(user_id_1.eq.${friendId},user_id_2.eq.${user.id})`
          );

        if (error) throw error;

        toast.success("Friend berhasil dihapus!");
        await fetchFriends();
        return true;
      } catch (error) {
        console.error("Error removing friend:", error);
        toast.error("Gagal hapus friend!");
        return false;
      }
    },
    [user, fetchFriends]
  );

  // Add user interest
  const addInterest = useCallback(
    async (
      interest: string,
      category: "gaming" | "content" | "community" | "casual"
    ) => {
      if (!user) return false;

      try {
        const { error } = await supabase.from("user_interests").insert({
          user_id: user.id,
          interest,
          category,
        });

        if (error) throw error;

        toast.success("Interest ditambahkan!");
        await fetchInterests();
        return true;
      } catch (error) {
        console.error("Error adding interest:", error);
        toast.error("Gagal tambah interest!");
        return false;
      }
    },
    [user, fetchInterests]
  );

  // Remove interest
  const removeInterest = useCallback(
    async (interestId: string) => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from("user_interests")
          .delete()
          .eq("id", interestId)
          .eq("user_id", user.id);

        if (error) throw error;

        toast.success("Interest berhasil dihapus!");
        await fetchInterests();
        return true;
      } catch (error) {
        console.error("Error removing interest:", error);
        toast.error("Gagal hapus interest!");
        return false;
      }
    },
    [user, fetchInterests]
  );

  // Block user
  const blockUser = useCallback(
    async (userId: string) => {
      if (!user) return false;

      try {
        const { error } = await supabase.from("blocked_users").insert({
          blocker_id: user.id,
          blocked_id: userId,
        });

        if (error) throw error;

        // Remove from friends if already friends
        await removeFriend(userId);

        toast.success("User berhasil di-block!");
        return true;
      } catch (error) {
        console.error("Error blocking user:", error);
        toast.error("Gagal block user!");
        return false;
      }
    },
    [user, removeFriend]
  );

  // Unblock user
  const unblockUser = useCallback(
    async (userId: string) => {
      if (!user) return false;

      try {
        const { error } = await supabase
          .from("blocked_users")
          .delete()
          .eq("blocker_id", user.id)
          .eq("blocked_id", userId);

        if (error) throw error;

        toast.success("User berhasil di-unblock!");
        return true;
      } catch (error) {
        console.error("Error unblocking user:", error);
        toast.error("Gagal unblock user!");
        return false;
      }
    },
    [user]
  );

  // Check if users are friends
  const checkIfFriends = useCallback(async (otherUserId: string) => {
    if (!user) return false;

    try {
      const { data } = await supabase
        .from("friends")
        .select("id")
        .or(
          `and(user_id_1.eq.${user.id},user_id_2.eq.${otherUserId}),and(user_id_1.eq.${otherUserId},user_id_2.eq.${user.id})`
        )
        .eq("status", "active")
        .single();

      return !!data;
    } catch {
      return false;
    }
  }, [user]);

  return {
    friendRequests,
    friends,
    suggestions,
    interests,
    loading,
    fetchFriendRequests,
    fetchFriends,
    fetchInterests,
    fetchSuggestions,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    addInterest,
    removeInterest,
    blockUser,
    unblockUser,
    checkIfFriends,
  };
}
