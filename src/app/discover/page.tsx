"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useFriendSystem } from "@/hooks/useFriendSystem";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import {
  Search,
  UserPlus,
  Users,
  Heart,
  Zap,
  Filter,
  MessageCircle,
} from "lucide-react";
import toast from "react-hot-toast";

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  bio?: string;
}

interface DiscoveryUser extends UserProfile {
  mutualFriends: number;
  commonInterests: number;
  reason?: string;
}

export default function DiscoveryPage() {
  const { user, profile } = useAuth();
  const {
    suggestions,
    fetchSuggestions,
    sendFriendRequest,
    checkIfFriends,
  } = useFriendSystem();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<DiscoveryUser[]>([]);
  const [selectedTab, setSelectedTab] = useState<"suggestions" | "search">(
    "suggestions"
  );
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchSuggestions();
      loadSuggestedUsersData();
    }
  }, [user, fetchSuggestions]);

  const loadSuggestedUsersData = async () => {
    if (!suggestions || suggestions.length === 0) return;

    const data = await Promise.all(
      suggestions.map(async (sug) => {
        const mutualCount = await getMutualFriendsCount(sug.suggested_user_id);
        const commonCount = await getCommonInterestsCount(sug.suggested_user_id);

        return {
          ...sug.suggested_user!,
          mutualFriends: mutualCount,
          commonInterests: commonCount,
          reason: sug.reason,
        };
      })
    );

    setSuggestedUsers(data);
  };

  const getMutualFriendsCount = async (userId: string) => {
    try {
      const { data } = await supabase.rpc("get_mutual_friends_count", {
        user1_id: user?.id,
        user2_id: userId,
      });
      return data || 0;
    } catch {
      return 0;
    }
  };

  const getCommonInterestsCount = async (userId: string) => {
    try {
      const { data } = await supabase.rpc("get_common_interests_count", {
        user1_id: user?.id,
        user2_id: userId,
      });
      return data || 0;
    } catch {
      return 0;
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, bio")
        .or(
          `username.ilike.%${query}%,full_name.ilike.%${query}%`
        )
        .neq("id", user?.id || "")
        .limit(10);

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Gagal cari user!");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (userId: string) => {
    const success = await sendFriendRequest(userId);
    if (success) {
      setRequestSent((prev) => new Set([...prev, userId]));
    }
  };

  const getReasonLabel = (reason?: string) => {
    switch (reason) {
      case "mutual_friend":
        return "Teman bersama";
      case "shared_interest":
        return "Interest sama";
      case "same_community":
        return "Komunitas sama";
      default:
        return "Suggestion";
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Discover Friends
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Temukan teman baru dengan interest yang sama
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-4 top-3 text-gray-400"
            />
            <input
              type="text"
              placeholder="Cari username atau nama..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="input w-full pl-12 py-3"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSelectedTab("suggestions")}
            className={`px-4 py-3 font-medium border-b-2 transition-all ${
              selectedTab === "suggestions"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400"
            }`}
          >
            <Zap size={18} className="inline mr-2" />
            Suggestions
          </button>
          <button
            onClick={() => setSelectedTab("search")}
            className={`px-4 py-3 font-medium border-b-2 transition-all ${
              selectedTab === "search"
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400"
            }`}
          >
            <Search size={18} className="inline mr-2" />
            Search Results ({searchResults.length})
          </button>
        </div>

        {/* Content */}
        {selectedTab === "suggestions" ? (
          <div>
            {suggestedUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-400">
                  Tidak ada suggestion untuk sekarang
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="card p-4 hover:shadow-lg transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {user.username[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white">
                            {user.full_name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold px-2 py-1 rounded-full">
                        {getReasonLabel(user.reason)}
                      </span>
                    </div>

                    {/* Bio */}
                    {user.bio && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {user.bio}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex gap-3 mb-4 text-xs">
                      {user.mutualFriends > 0 && (
                        <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                          <Users size={14} />
                          <span>{user.mutualFriends} teman bersama</span>
                        </div>
                      )}
                      {user.commonInterests > 0 && (
                        <div className="flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-full">
                          <Heart size={14} />
                          <span>{user.commonInterests} interest</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {requestSent.has(user.id) ? (
                        <button disabled className="btn-ghost flex-1 opacity-50">
                          Request Terkirim
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddFriend(user.id)}
                          className="btn-primary flex-1 flex items-center justify-center gap-2"
                        >
                          <UserPlus size={16} />
                          Add Friend
                        </button>
                      )}
                      <button className="btn-ghost p-3">
                        <MessageCircle size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-400">Searching...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12">
                <Search size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-400">
                  {searchQuery ? "Tidak ada hasil ditemukan" : "Cari user..."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="card p-4 flex items-center justify-between hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        {user.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {user.full_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                    {requestSent.has(user.id) ? (
                      <button disabled className="btn-ghost opacity-50">
                        Requested
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddFriend(user.id)}
                        className="btn-primary flex items-center gap-2"
                      >
                        <UserPlus size={16} />
                        Add
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
