"use client";

import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import type { Feed } from "@/types";
import { Heart, MessageCircle, Share2, Plus, Image } from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

export default function FeedsPage() {
  const { user, profile } = useAuth();
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchFeeds();
  }, []);

  async function fetchFeeds() {
    const { data } = await supabase
      .from("feeds")
      .select("*, profile:profiles(*)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setFeeds(data as Feed[]);
    setLoading(false);
  }

  async function createPost() {
    if (!content.trim() || !user) return;
    setPosting(true);

    const { error } = await supabase.from("feeds").insert({
      user_id: user.id,
      content: content.trim(),
    });

    if (error) {
      toast.error("Gagal membuat postingan!");
    } else {
      toast.success("Postingan berhasil dibuat!");
      setContent("");
      setShowCreate(false);
      fetchFeeds();
    }
    setPosting(false);
  }

  async function likePost(feedId: string, currentLikes: number) {
    await supabase
      .from("feeds")
      .update({ likes_count: currentLikes + 1 })
      .eq("id", feedId);
    fetchFeeds();
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Berita
          </h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
          >
            <Plus size={16} />
            Buat Post
          </button>
        </div>

        {/* Create Post */}
        {showCreate && (
          <div className="card p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {profile?.username?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Apa yang kamu pikirkan?"
                  className="input resize-none h-24 text-sm"
                />
                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={() => toast("Upload foto segera hadir!")}
                    className="flex items-center gap-2 text-gray-400 hover:text-blue-500 text-sm transition-colors"
                  >
                    <Image size={16} />
                    Tambah Foto
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCreate(false)}
                      className="btn-ghost text-sm py-1.5 px-3"
                    >
                      Batal
                    </button>
                    <button
                      onClick={createPost}
                      disabled={!content.trim() || posting}
                      className="btn-primary text-sm py-1.5 px-3 disabled:opacity-50"
                    >
                      {posting ? "Posting..." : "Post"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feeds */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Memuat...</div>
        ) : feeds.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Belum ada postingan. Jadilah yang pertama!
          </div>
        ) : (
          <div className="space-y-4">
            {feeds.map((feed) => (
              <div key={feed.id} className="card p-5">
                {/* Author */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {feed.profile?.avatar_url ? (
                      <img
                        src={feed.profile.avatar_url}
                        className="w-full h-full rounded-full object-cover"
                        alt=""
                      />
                    ) : (
                      feed.profile?.username?.[0]?.toUpperCase() || "?"
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {feed.profile?.full_name || feed.profile?.username}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {formatDistanceToNow(new Date(feed.created_at), {
                        addSuffix: true,
                        locale: id,
                      })}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed mb-4">
                  {feed.content}
                </p>

                {/* Media */}
                {feed.media_urls && feed.media_urls.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {feed.media_urls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        className="w-full h-40 object-cover rounded-xl"
                        alt=""
                      />
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => likePost(feed.id, feed.likes_count)}
                    className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors text-sm"
                  >
                    <Heart size={16} />
                    <span>{feed.likes_count}</span>
                  </button>
                  <button
                    onClick={() => toast("Komentar segera hadir!")}
                    className="flex items-center gap-1.5 text-gray-400 hover:text-blue-500 transition-colors text-sm"
                  >
                    <MessageCircle size={16} />
                    <span>{feed.comments_count}</span>
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link disalin!");
                    }}
                    className="flex items-center gap-1.5 text-gray-400 hover:text-green-500 transition-colors text-sm"
                  >
                    <Share2 size={16} />
                    <span>Bagikan</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
