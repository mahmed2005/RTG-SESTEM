import React from "react";
import officialLogoImg from "../assets/images/rtg_system_logo_1788366637371.jpg";

interface RtgLogoProps {
  size?: "splash" | "large" | "small" | "print" | "header" | "medium";
  className?: string;
  showText?: boolean;
}

export const RtgLogo: React.FC<RtgLogoProps> = ({
  size = "large",
  className = "",
  showText = false,
}) => {
  let imgDimension = "w-20 h-20";
  if (size === "splash") imgDimension = "w-28 h-28 sm:w-32 sm:h-32";
  if (size === "large") imgDimension = "w-24 h-24";
  if (size === "medium") imgDimension = "w-16 h-16";
  if (size === "small") imgDimension = "w-9 h-9";
  if (size === "header") imgDimension = "w-9 h-9 sm:w-10 sm:h-10";
  if (size === "print") imgDimension = "w-12 h-12";

  return (
    <div
      className={`inline-flex flex-col items-center justify-center select-none ${className}`}
      role="img"
      aria-label="RTG-SESTEM Logo"
    >
      <div className={`relative ${imgDimension} flex items-center justify-center rounded-2xl overflow-hidden shadow-lg border border-[#c5834e]/30 bg-[#0d111a]`}>
        <img
          src={officialLogoImg}
          alt="RTG-SESTEM Logo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover select-none pointer-events-none"
        />
      </div>

      {showText && (
        <div className="text-center mt-2.5">
          <span className="block text-base sm:text-lg font-black tracking-wider text-slate-100 dark:text-white uppercase font-sans drop-shadow-sm">
            RTG-SESTEM
          </span>
          <span className="block text-[11px] text-[#c5834e] font-bold tracking-normal mt-0.5">
            منظومة متكاملة لمتجرك الإلكتروني
          </span>
        </div>
      )}
    </div>
  );
};
