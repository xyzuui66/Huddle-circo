"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useFriendSystem } from "@/hooks/useFriendSystem";
import { useAuth } from "@/contexts/auth-context";
import {
  Users,
  UserPlus,
  Clock,
  Trash2,
  MessageCircle,
  UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

export default function FriendsPage() {
  const { user } = useAuth();
  const {
    friends,
    friendRequests,
    fetchFriends,
    fetchFriendRequests,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
  } = useFriendSystem();
  const [selectedTab, setSelectedTab] = useState<
    "friends" | "requests" | "pending"
  >("friends");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchFriends(), fetchFriendRequests()]).finally(() =>
        setLoading(false)
      );
    }
  }, [user, fetchFriends, fetchFriendRequests]);

  const handleAccept = async (requestId: string, requesterId: string) => {
    const success = await acceptFriendRequest(requestId, requesterId);
    if (success) {
      setSelectedTab("friends");
    }
  };

  const handleDecline = async (requestId: string) => {
    await declineFriendRequest(requestId);
    await fetchFriendRequests();
  };

  const handleRemove = async (friendId: string) => {
    if (confirm("Yakin mau hapus teman ini?")) {
      await removeFriend(friendId);
    }
  };

  const pendingCount = friendRequests.length;
  const friendsCount = friends.length;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Friends
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Kelola teman-teman kamu
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setSelectedTab("friends")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${
              selectedTab === "friends"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
            }`}
          >
            <Users size={18} />
            Friends ({friendsCount})
          </button>
          <button
            onClick={() => setSelectedTab("requests")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all relative ${
              selectedTab === "requests"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
            }`}
          >
            <UserPlus size={18} />
            Requests ({pendingCount})
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : selectedTab === "friends" ? (
          <div>
            {friends.length === 0 ? (
              <div className="text-center py-12 card p-8">
                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-400 mb-4">Belum ada teman</p>
                <a
                  href="/discover"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <UserPlus size={16} />
                  Find Friends
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {friends.map((friendship) => (
                  <div
                    key={friendship.id}
                    className="card p-4 flex items-center justify-between hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        {friendship.friend?.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {friendship.friend?.full_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          @{friendship.friend?.username}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="btn-ghost p-2 text-blue-600 dark:text-blue-400">
                        <MessageCircle size={18} />
                      </button>
                      <button
                        onClick={() =>
                          handleRemove(friendship.friend?.id || "")
                        }
                        className="btn-ghost p-2 text-red-600 dark:text-red-400"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {friendRequests.length === 0 ? (
              <div className="text-center py-12 card p-8">
                <Clock size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-400">Tidak ada friend request</p>
              </div>
            ) : (
              <div className="space-y-3">
                {friendRequests.map((request) => (
                  <div
                    key={request.id}
                    className="card p-4 border-l-4 border-blue-500"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {request.requester?.username[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 dark:text-white">
                            {request.requester?.full_name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{request.requester?.username}
                          </p>
                          {request.message && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                              "{request.message}"
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDistanceToNow(new Date(request.created_at), {
                              addSuffix: true,
                              locale: id,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() =>
                            handleAccept(request.id, request.requester_id)
                          }
                          className="btn-primary flex items-center gap-2 px-4"
                        >
                          <UserCheck size={16} />
                          Accept
                        </button>
                        <button
                          onClick={() => handleDecline(request.id)}
                          className="btn-ghost"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
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
