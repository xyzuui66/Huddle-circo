"use client";

import { useState, useEffect } from "react";
import { useGiftSystem } from "@/hooks/useGiftSystem";
import { X, Send, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

// Gift icons mapping
const GIFT_ICONS: Record<string, string> = {
  rose: "🌹",
  heart: "❤️",
  star: "⭐",
  diamond: "💎",
  crown: "👑",
  fireworks: "🎆",
  rocket: "🚀",
  trophy: "🏆",
  fire: "🔥",
};

interface GiftModalProps {
  streamId: string;
  hostWalletInfo?: {
    bank_name?: string;
    bank_account?: string;
    account_holder?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export default function GiftModal({
  streamId,
  hostWalletInfo,
  isOpen,
  onClose,
}: GiftModalProps) {
  const { gifts, loading, fetchGifts, sendGift } = useGiftSystem();
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [step, setStep] = useState<"select" | "confirm">("select");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && gifts.length === 0) {
      fetchGifts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const gift = gifts.find((g) => g.id === selectedGift);
  const totalPrice = gift ? gift.price * quantity : 0;

  const handleSendGift = async () => {
    if (!selectedGift) {
      toast.error("Pilih gift dulu!");
      return;
    }

    setSending(true);
    const success = await sendGift(streamId, selectedGift, quantity, note);

    if (success) {
      setStep("confirm");
    }
    setSending(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {step === "select" ? "Kirim Gift" : "Konfirmasi Gift"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {step === "select" ? (
            <>
              {/* Gift Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Pilih Gift
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {loading ? (
                    <div className="col-span-3 text-center py-8 text-gray-400">
                      Loading gifts...
                    </div>
                  ) : (
                    gifts.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setSelectedGift(g.id)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                          selectedGift === g.id
                            ? "bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500"
                            : "bg-gray-100 dark:bg-gray-700 border-2 border-transparent hover:border-blue-300"
                        }`}
                      >
                        <div className="text-2xl">{GIFT_ICONS[g.icon] || "🎁"}</div>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {g.name}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          Rp {(g.price / 1000).toFixed(0)}k
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Quantity */}
              {selectedGift && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Jumlah
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="btn-ghost p-2"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(Math.max(1, Number(e.target.value)))
                        }
                        className="input w-16 text-center"
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="btn-ghost p-2"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Pesan (opsional)
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Tulis pesan untuk streamer..."
                      className="input text-sm"
                      maxLength={100}
                    />
                  </div>

                  {/* Total Price */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      Total Donasi
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      Rp {totalPrice.toLocaleString("id-ID")}
                    </p>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {/* Confirm Step */}
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                  <p className="text-green-700 dark:text-green-300 font-semibold">
                    ✅ Gift Siap Dikirim!
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Silakan transfer sesuai jumlah di bawah
                  </p>
                </div>

                {/* Amount to Transfer */}
                <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Jumlah Transfer
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    Rp {totalPrice.toLocaleString("id-ID")}
                  </p>
                </div>

                {/* Bank Info */}
                {hostWalletInfo?.bank_account && (
                  <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-4 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Bank
                      </p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {hostWalletInfo.bank_name || "Bank"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        No. Rekening
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                          {hostWalletInfo.bank_account}
                        </p>
                        <button
                          onClick={() =>
                            copyToClipboard(hostWalletInfo.bank_account!)
                          }
                          className="btn-ghost p-2"
                        >
                          {copied ? (
                            <Check size={16} className="text-green-500" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    {hostWalletInfo.account_holder && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          A/N
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {hostWalletInfo.account_holder}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
                  <p className="text-sm text-amber-900 dark:text-amber-200">
                    <strong>📌 Instruksi:</strong>
                    <br />
                    1. Transfer sesuai jumlah di atas
                    <br />
                    2. Kembali ke app ini
                    <br />
                    3. Klik "Konfirmasi Sudah Transfer"
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => {
              if (step === "select") {
                onClose();
              } else {
                setStep("select");
              }
            }}
            className="btn-ghost flex-1"
          >
            {step === "select" ? "Batal" : "Kembali"}
          </button>
          {step === "select" ? (
            <button
              onClick={handleSendGift}
              disabled={!selectedGift || sending}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send size={16} />
              {sending ? "Memproses..." : "Lanjut"}
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                setStep("select");
                setSelectedGift(null);
                setQuantity(1);
                setNote("");
              }}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Check size={16} />
              Sudah Transfer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
