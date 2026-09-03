import React from "react";
import officialLogoImg from "../assets/images/rtg_official_logo_1788378769153.jpg";
import { motion } from "motion/react";

interface RtgLogoProps {
  size?: "splash" | "large" | "small" | "print" | "header" | "medium" | "emblemOnly";
  className?: string;
  showText?: boolean;
}

export const RtgLogo: React.FC<RtgLogoProps> = ({
  size = "large",
  className = "",
  showText = false,
}) => {
  let imgDimension = "w-20 h-20";
  if (size === "splash") imgDimension = "w-32 h-32 sm:w-36 sm:h-36";
  if (size === "large") imgDimension = "w-28 h-28 sm:w-32 sm:h-32";
  if (size === "medium") imgDimension = "w-16 h-16";
  if (size === "small") imgDimension = "w-9 h-9";
  if (size === "header") imgDimension = "w-9 h-9 sm:w-10 sm:h-10";
  if (size === "print") imgDimension = "w-14 h-14";

  return (
    <div
      className={`inline-flex flex-col items-center justify-center select-none ${className}`}
      role="img"
      aria-label="RTG-SYSTEM Logo"
    >
      <motion.div
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.98 }}
        className={`relative ${imgDimension} flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-[#c5834e]/40 bg-[#0d111a] ring-1 ring-[#c5834e]/20`}
      >
        <img
          src={officialLogoImg}
          alt="RTG-SYSTEM Official Logo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover select-none pointer-events-none"
        />
      </motion.div>

      {showText && (
        <div className="text-center mt-2.5">
          <span className="block text-base sm:text-lg font-black tracking-wider text-slate-100 dark:text-white uppercase font-sans drop-shadow-sm">
            RTG-SYSTEM
          </span>
          <span className="block text-[11px] text-[#c5834e] font-bold tracking-normal mt-0.5">
            منظومة متكاملة لمتجرك الإلكتروني
          </span>
        </div>
      )}
    </div>
  );
};

