"use client";

import { useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { usePremiumFeatures } from "@/hooks/usePremiumFeatures";
import { useAuth } from "@/contexts/auth-context";
import { Crown, Check, Zap, BarChart3 } from "lucide-react";
import toast from "react-hot-toast";

export default function PremiumPage() {
  const { user } = useAuth();
  const {
    currentTier,
    fetchSubscription,
    upgradeToPremium,
    cancelSubscription,
    premiumFeatures,
  } = usePremiumFeatures();

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user, fetchSubscription]);

  const tiers = [
    {
      id: "free" as const,
      icon: <div className="text-4xl">🚀</div>,
    },
    {
      id: "premium" as const,
      icon: <Crown size={48} className="text-blue-500" />,
    },
    {
      id: "pro" as const,
      icon: <Zap size={48} className="text-purple-500" />,
    },
  ];

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Upgrade ke Premium
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Unlock powerful features dan support creators
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {tiers.map(({ id, icon }) => {
            const tier = premiumFeatures[id];
            const isCurrent = currentTier === id;
            const isPopular = id === "pro";

            return (
              <div
                key={id}
                className={`relative rounded-2xl p-8 transition-all ${
                  isCurrent
                    ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : isPopular
                      ? "ring-2 ring-purple-500 bg-white dark:bg-gray-800 shadow-2xl scale-105"
                      : "bg-white dark:bg-gray-800"
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                    Most Popular ⭐
                  </div>
                )}

                {/* Current Badge */}
                {isCurrent && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                    Current Plan ✓
                  </div>
                )}

                {/* Icon */}
                <div className="flex justify-center mb-6">{icon}</div>

                {/* Title & Price */}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                  {tier.name}
                </h3>

                {id === "free" ? (
                  <div className="text-center mb-6">
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      Free
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Selamanya gratis
                    </p>
                  </div>
                ) : (
                  <div className="text-center mb-6">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      Rp {tier.price.toLocaleString("id-ID")}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      per bulan
                    </p>
                  </div>
                )}

                {/* CTA Button */}
                <button
                  onClick={() => {
                    if (isCurrent) {
                      toast.success("Kamu sudah punya plan ini!");
                    } else if (id === "free") {
                      toast.error("Downgrade tidak tersedia");
                    } else {
                      upgradeToPremium(id);
                    }
                  }}
                  className={`w-full py-3 rounded-lg font-bold mb-8 transition-all ${
                    isCurrent
                      ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-default"
                      : isPopular
                        ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg hover:scale-105"
                        : id === "free"
                          ? "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-default"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                  }`}
                  disabled={isCurrent || id === "free"}
                >
                  {isCurrent ? "Current Plan" : id === "free" ? "Gratis" : "Upgrade"}
                </button>

                {/* Features List */}
                <div className="space-y-3">
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check
                        size={20}
                        className={
                          isCurrent
                            ? "text-blue-500 flex-shrink-0"
                            : isPopular
                              ? "text-purple-500 flex-shrink-0"
                              : "text-green-500 flex-shrink-0"
                        }
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Limits */}
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">
                    Limits
                  </p>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      💾 Storage:{" "}
                      <span className="font-bold">
                        {tier.limits.storageGB}GB
                      </span>
                    </div>
                    <div>
                      👥 Communities:{" "}
                      <span className="font-bold">
                        {tier.limits.maxCommunities}
                      </span>
                    </div>
                    <div>
                      📅 Events:{" "}
                      <span className="font-bold">
                        {tier.limits.maxEvents}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "Bisa cancel kapan saja?",
                a: "Ya! Kamu bisa cancel subscription kapan saja tanpa penalty. Access akan berakhir di akhir billing period.",
              },
              {
                q: "Apakah ada trial gratis?",
                a: "Belum ada, tapi kamu bisa coba fitur free version dulu sebelum upgrade.",
              },
              {
                q: "Bagaimana cara withdrawal earnings?",
                a: "Creator bisa withdraw earnings melalui bank account yang sudah didaftarkan di wallet settings.",
              },
              {
                q: "Apakah ada referral program?",
                a: "Iya! Invite teman dan dapatkan bonus credit untuk setiap referral yang convert.",
              },
            ].map((faq, idx) => (
              <div key={idx} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                  {faq.q}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 text-center">
            <BarChart3 size={40} className="mx-auto text-blue-500 mb-4" />
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">
              Analytics
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track performance creators dengan detailed analytics
            </p>
          </div>

          <div className="card p-6 text-center">
            <Crown size={40} className="mx-auto text-purple-500 mb-4" />
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">
              Exclusive
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Akses fitur eksklusif dan early access update
            </p>
          </div>

          <div className="card p-6 text-center">
            <Zap size={40} className="mx-auto text-orange-500 mb-4" />
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">
              Priority
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Priority support dan queue untuk livestream
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
