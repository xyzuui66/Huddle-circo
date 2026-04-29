"use client";

import { useState, useEffect, useRef } from "react";
import MainLayout from "@/components/layout/MainLayout";
import GiftModal from "@/components/GiftModal";
import GiftAnimation from "@/components/GiftAnimation";
import { useAuth } from "@/contexts/auth-context";
import { useGiftSystem } from "@/hooks/useGiftSystem";
import { supabase } from "@/lib/supabase";
import {
  Gift,
  Users,
  Share2,
  Settings,
  MessageSquare,
  Send,
  Play,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface StreamGift {
  id: string;
  gifter_name: string;
  gift_id: string;
  quantity: number;
  total_amount: number;
  icon?: string;
  animation?: string;
  giftName?: string;
}

export default function LiveStreamPage() {
  const { user, profile } = useAuth();
  const { fetchGifts, getStreamGifts } = useGiftSystem();
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [streamGifts, setStreamGifts] = useState<StreamGift[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const giftAnimationRef = useRef<HTMLDivElement>(null);

  // Mock stream ID (in real scenario, get from URL)
  const streamId = "mock-stream-123";

  useEffect(() => {
    fetchGifts();
    loadStreamGifts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const loadStreamGifts = async () => {
    const gifts = await getStreamGifts(streamId);
    // Fetch gift details to get animation names
    const { data: giftTypes } = await supabase.from("gifts").select("*");
    
    const giftsWithDetails = gifts.map((gift) => {
      const giftType = giftTypes?.find((gt) => gt.id === gift.gift_id);
      return {
        ...gift,
        animation: giftType?.animation || "float_up_spin",
        giftName: giftType?.name || "Gift",
      };
    });
    
    setStreamGifts(giftsWithDetails as any);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      user: profile?.username || "Anonymous",
      message: chatInput,
      timestamp: new Date(),
    };

    setChatMessages([...chatMessages, newMessage]);
    setChatInput("");
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stream Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Stream Placeholder */}
            <div className="w-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl aspect-video flex items-center justify-center relative overflow-hidden">
              <div className="text-center z-10">
                <Play size={64} className="mx-auto text-blue-400 mb-4" />
                <p className="text-white font-semibold text-lg">
                  Live Stream (Agora Integration)
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Video akan tampil di sini dengan Agora SDK
                </p>
              </div>

              {/* Live Badge */}
              {isLive && (
                <div className="absolute top-4 left-4 bg-red-500 px-3 py-1.5 rounded-full flex items-center gap-2 z-20">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-white text-sm font-bold">LIVE</span>
                </div>
              )}

              {/* Viewer Count */}
              <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur px-3 py-1.5 rounded-full z-20">
                <div className="flex items-center gap-2 text-white text-sm">
                  <Users size={16} />
                  <span>{viewerCount} penonton</span>
                </div>
              </div>
            </div>

            {/* Stream Info */}
            <div className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Live Session {profile?.full_name || "Streamer"}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Streaming gameplay & interaksi dengan viewers
                  </p>
                </div>
                <button className="btn-secondary flex items-center gap-2">
                  <Share2 size={16} />
                  Share
                </button>
              </div>

              <div className="flex gap-4 text-sm">
                <div className="flex-1">
                  <p className="text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider mb-1">
                    Total Donasi
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    Rp {streamGifts
                      .reduce((sum, g) => sum + g.total_amount, 0)
                      .toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="flex-1">
                  <p className="text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider mb-1">
                    Total Gift
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {streamGifts.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Section */}
            <div className="card p-6 flex flex-col h-96">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
                Live Chat
              </h2>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4 no-scrollbar">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    Belum ada pesan
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="text-sm">
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {msg.user}:
                      </span>{" "}
                      <span className="text-gray-800 dark:text-gray-200">
                        {msg.message}
                      </span>
                    </div>
                  ))
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ketik pesan..."
                  className="input flex-1 text-sm py-2"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="btn-primary p-2 disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Gift Button */}
            <button
              onClick={() => setGiftModalOpen(true)}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-lg"
            >
              <Gift size={20} />
              Kirim Gift
            </button>

            {/* Recent Gifts */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Gift Terbaru
              </h3>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {streamGifts.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    Belum ada gift
                  </p>
                ) : (
                  streamGifts.map((gift) => (
                    <div
                      key={gift.id}
                      className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {gift.gifter_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {gift.quantity}x gift
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">
                          +Rp{" "}
                          {gift.total_amount.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Gifters */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Top Gifter
              </h3>

              <div className="space-y-2">
                {streamGifts
                  .slice()
                  .sort((a, b) => b.total_amount - a.total_amount)
                  .slice(0, 5)
                  .map((gift, idx) => (
                    <div
                      key={gift.id}
                      className="flex items-center gap-3 p-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {gift.gifter_name}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">
                        Rp{" "}
                        {(gift.total_amount / 1000).toFixed(0)}k
                      </p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Stream Settings */}
            {user?.id && (
              <button className="btn-ghost w-full flex items-center justify-center gap-2 py-3">
                <Settings size={18} />
                Pengaturan Stream
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Gift Modal */}
      <GiftModal
        streamId={streamId}
        hostWalletInfo={{
          bank_name: "BCA",
          bank_account: "1234567890",
          account_holder: profile?.full_name || "Streamer",
        }}
        isOpen={giftModalOpen}
        onClose={() => setGiftModalOpen(false)}
      />

      {/* Gift Animations */}
      {streamGifts.map((gift: any) => (
        <GiftAnimation
          key={gift.id}
          giftName={gift.animation || "float_up_spin"}
          quantity={gift.quantity}
          gifterName={gift.gifter_name}
          isVisible={true}
        />
      ))}
    </MainLayout>
  );
}
