"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GiftAnimationProps {
  giftName: string;
  quantity: number;
  gifterName: string;
  isVisible: boolean;
}

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

const ANIMATIONS: Record<
  string,
  {
    initial: any;
    animate: any;
    exit: any;
    transition: any;
  }
> = {
  float_up_spin: {
    initial: { y: 100, opacity: 0, scale: 0.5, rotate: 0 },
    animate: { y: -200, opacity: 1, scale: 1, rotate: 360 },
    exit: { opacity: 0 },
    transition: { duration: 2, ease: "easeOut" },
  },
  heartbeat_pulse: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: [0, 1.2, 1, 1.1, 1], opacity: 1 },
    exit: { opacity: 0, y: -50 },
    transition: { duration: 2, times: [0, 0.2, 0.5, 0.8, 1] },
  },
  twinkle_float: {
    initial: { x: -100, y: 100, opacity: 0, scale: 0 },
    animate: { x: 0, y: -200, opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0.5] },
    exit: { opacity: 0 },
    transition: { duration: 2.5 },
  },
  sparkle_spin: {
    initial: { scale: 0, opacity: 0, rotate: -180 },
    animate: { scale: 1, opacity: 1, rotate: 180 },
    exit: { scale: 0, opacity: 0 },
    transition: { duration: 1.5 },
  },
  crown_glow: {
    initial: { scale: 0, opacity: 0, y: 50 },
    animate: { scale: [0, 1.3, 1], opacity: 1, y: -200 },
    exit: { opacity: 0 },
    transition: { duration: 2, times: [0, 0.3, 1] },
  },
  explosion_burst: {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: [0, 2, 1, 0.8],
      opacity: [0, 1, 1, 0],
      y: -250,
    },
    exit: { opacity: 0 },
    transition: { duration: 2.5, times: [0, 0.1, 0.6, 1] },
  },
  rocket_launch: {
    initial: { y: 100, opacity: 0, rotate: 0 },
    animate: { y: -300, opacity: [0, 1, 1, 0], rotate: 45 },
    exit: { opacity: 0 },
    transition: { duration: 3, ease: "easeInOut" },
  },
  trophy_bounce: {
    initial: { scale: 0, opacity: 0, y: 50 },
    animate: {
      scale: [0, 1.4, 0.9, 1.1, 1],
      opacity: 1,
      y: -200,
    },
    exit: { opacity: 0, scale: 0 },
    transition: { duration: 2.5, times: [0, 0.2, 0.4, 0.6, 1] },
  },
  fire_blast: {
    initial: { scale: 0, opacity: 0, rotate: 0 },
    animate: {
      scale: [0, 1.5, 1],
      opacity: [0, 1, 0.5, 0],
      y: -300,
      rotate: 360,
    },
    exit: { opacity: 0 },
    transition: { duration: 3, times: [0, 0.2, 0.7, 1] },
  },
};

const Sparkles = ({ count = 8 }: { count?: number }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [1, 0], scale: [1, 0] }}
          transition={{
            duration: 2,
            delay: i * 0.1,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        >
          ✨
        </motion.div>
      ))}
    </>
  );
};

export default function GiftAnimation({
  giftName,
  quantity,
  gifterName,
  isVisible,
}: GiftAnimationProps) {
  const [showGift, setShowGift] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShowGift(true);
      const timer = setTimeout(() => setShowGift(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const animation = ANIMATIONS[giftName] || ANIMATIONS.float_up_spin;
  const icon = GIFT_ICONS[giftName] || "🎁";

  return (
    <AnimatePresence>
      {showGift && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none overflow-hidden"
        >
          {/* Sparkle background effect */}
          {["explosion_burst", "fire_blast", "crown_glow"].includes(
            giftName
          ) && (
            <div className="absolute inset-0">
              <Sparkles count={12} />
            </div>
          )}

          {/* Main gift animation */}
          <motion.div
            initial={animation.initial}
            animate={animation.animate}
            exit={animation.exit}
            transition={animation.transition}
            className="absolute bottom-20 left-1/2 -translate-x-1/2"
          >
            <div className="text-center">
              {/* Gift icon - larger size */}
              <motion.div className="text-8xl mb-4 drop-shadow-lg">
                {icon}
              </motion.div>

              {/* Gift info floating up */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl px-6 py-4 shadow-2xl"
              >
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  {gifterName}
                </p>
                <p className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
                  {quantity}x {giftName}
                </p>
              </motion.div>

              {/* Floating particles for certain gifts */}
              {["explosion_burst", "fireworks"].includes(giftName) && (
                <div className="absolute inset-0">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{
                        x: 0,
                        y: 0,
                        opacity: 1,
                      }}
                      animate={{
                        x: (Math.random() - 0.5) * 200,
                        y: -200,
                        opacity: 0,
                      }}
                      transition={{
                        duration: 1.5,
                        delay: i * 0.05,
                        ease: "easeOut",
                      }}
                      className="absolute text-3xl"
                    >
                      ✨
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Confetti for big gifts */}
          {["trophy_bounce", "crown_glow"].includes(giftName) && (
            <div className="absolute inset-0">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    left: "50%",
                    top: "50%",
                    opacity: 1,
                  }}
                  animate={{
                    left: `${50 + (Math.random() - 0.5) * 100}%`,
                    top: `${50 - Math.random() * 150}%`,
                    opacity: 0,
                  }}
                  transition={{
                    duration: 2.5,
                    delay: i * 0.02,
                    ease: "easeOut",
                  }}
                  className="absolute text-2xl"
                >
                  {["🎉", "🎊", "⭐", "✨"][i % 4]}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
