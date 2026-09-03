import React from "react";
import officialLogoImg from "../assets/images/rtg_official_logo_1788378769153.jpg";
import { motion } from "motion/react";

interface RtgLogoProps {
  size?: "splash" | "large" | "small" | "print" | "header" | "medium" | "full";
  className?: string;
  showText?: boolean;
}

export const RtgLogo: React.FC<RtgLogoProps> = ({
  size = "large",
  className = "",
  showText = false,
}) => {
  let imgDimension = "w-20 h-20";
  let isFullCard = false;

  if (size === "full") {
    imgDimension = "w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 max-w-full aspect-square";
    isFullCard = true;
  } else if (size === "splash") {
    imgDimension = "w-40 h-40 sm:w-48 sm:h-48 aspect-square";
    isFullCard = true;
  } else if (size === "large") {
    imgDimension = "w-32 h-32 sm:w-36 sm:h-36";
  } else if (size === "medium") {
    imgDimension = "w-16 h-16";
  } else if (size === "small") {
    imgDimension = "w-9 h-9";
  } else if (size === "header") {
    imgDimension = "w-10 h-10";
  } else if (size === "print") {
    imgDimension = "w-14 h-14";
  }

  return (
    <div
      className={`inline-flex flex-col items-center justify-center select-none ${className}`}
      role="img"
      aria-label="RTG-SYSTEM Logo"
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`relative ${imgDimension} flex items-center justify-center ${
          isFullCard
            ? "rounded-3xl overflow-hidden shadow-2xl border border-[#2d333f] bg-[#121418] shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(197,123,66,0.15)]"
            : "rounded-xl overflow-hidden shadow-lg border border-[#c57b42]/30 bg-[#16191f]"
        }`}
      >
        <img
          src={officialLogoImg}
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.endsWith("logo.jpg")) {
              target.src = "./logo.jpg";
            }
          }}
          alt="RTG-SYSTEM"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain select-none pointer-events-none"
        />
      </motion.div>

      {showText && (
        <div className="text-center mt-2.5">
          <span className="block text-base sm:text-lg font-black tracking-wider text-slate-100 dark:text-white uppercase font-sans drop-shadow-sm">
            RTG-SYSTEM
          </span>
          <span className="block text-[11px] text-[#c57b42] font-bold tracking-normal mt-0.5">
            منظومة متكاملة لمتجرك الإلكتروني
          </span>
        </div>
      )}
    </div>
  );
};

