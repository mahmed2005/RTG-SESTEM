import React from "react";

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
  let dimensionClasses = "w-20 h-20";
  if (size === "splash") dimensionClasses = "w-28 h-28 sm:w-32 sm:h-32";
  if (size === "large") dimensionClasses = "w-24 h-24";
  if (size === "medium") dimensionClasses = "w-16 h-16";
  if (size === "small") dimensionClasses = "w-9 h-9";
  if (size === "header") dimensionClasses = "w-9 h-9";
  if (size === "print") dimensionClasses = "w-14 h-14";

  return (
    <div
      className={`inline-flex flex-col items-center justify-center select-none ${className}`}
      role="img"
      aria-label="RTG-SYSTEM Logo"
    >
      <div className={`relative ${dimensionClasses} drop-shadow-md flex items-center justify-center`}>
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            {/* Bronze / Warm Gold Gradients */}
            <linearGradient id="rtgBronzeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="25%" stopColor="#e5a968" />
              <stop offset="70%" stopColor="#c2884a" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>

            <linearGradient id="rtgBronzeLight" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="50%" stopColor="#e5a968" />
              <stop offset="100%" stopColor="#fef08a" />
            </linearGradient>

            <linearGradient id="rtgBronzeDark" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#9a5b28" />
              <stop offset="100%" stopColor="#582a0d" />
            </linearGradient>

            {/* Silver / Platinum Gradients */}
            <linearGradient id="rtgSilverGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#e2e8f0" />
              <stop offset="70%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>

            <linearGradient id="rtgSilverDark" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="50%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* Background Shield Gradients */}
            <linearGradient id="rtgShieldBg" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0a0f1d" stopOpacity="0.95" />
            </linearGradient>

            <filter id="rtgShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Outer Shield Border Frame */}
          <path
            d="M100 12 L168 45 L168 115 Q168 160 100 188 Q32 160 32 115 L32 45 Z"
            fill="url(#rtgShieldBg)"
            stroke="url(#rtgSilverGlow)"
            strokeWidth="3.5"
            strokeLinejoin="round"
            filter="url(#rtgShadow)"
          />

          {/* Inner Shield Bevel Accent */}
          <path
            d="M100 20 L160 50 L160 112 Q160 152 100 178 Q40 152 40 112 L40 50 Z"
            fill="none"
            stroke="url(#rtgBronzeGlow)"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />

          {/* LEFT HALF: Platinum / Silver Network Matrix & "R" Structure */}
          {/* Top Left Geometric Network Lines */}
          <g stroke="url(#rtgSilverGlow)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="56" y1="58" x2="80" y2="46" />
            <line x1="80" y1="46" x2="100" y2="58" />
            <line x1="56" y1="58" x2="74" y2="76" />
            <line x1="74" y1="76" x2="98" y2="68" />
            <line x1="80" y1="46" x2="74" y2="76" />
            <line x1="56" y1="58" x2="56" y2="82" />
          </g>

          {/* Network Nodes (Silver & Bronze Connectors) */}
          <circle cx="56" cy="58" r="4.5" fill="url(#rtgSilverGlow)" />
          <circle cx="80" cy="46" r="4" fill="url(#rtgSilverGlow)" />
          <circle cx="100" cy="58" r="4" fill="url(#rtgBronzeGlow)" />
          <circle cx="74" cy="76" r="3.5" fill="url(#rtgSilverGlow)" />
          <circle cx="56" cy="82" r="3.5" fill="url(#rtgSilverGlow)" />

          {/* 3D Letter "R" Architecture (Silver Metallic) */}
          <path
            d="M52 86 L74 86 C86 86 92 92 92 100 C92 107 86 112 76 113 L93 138 L78 138 L65 116 L65 138 L52 138 Z"
            fill="url(#rtgSilverGlow)"
            stroke="#1e293b"
            strokeWidth="1"
          />
          <path
            d="M65 96 L73 96 C77 96 80 97 80 100 C80 103 77 104 73 104 L65 104 Z"
            fill="#0f172a"
          />

          {/* RIGHT HALF: Bronze / Gold Ascending Arrow & "T" - "G" Growth Architecture */}
          {/* Main Growth Arrow (Rising Chart) */}
          <path
            d="M78 82 L100 66 L120 84 L148 54 L142 46 L164 42 L160 64 L152 56 L122 88 L100 72 L82 86 Z"
            fill="url(#rtgBronzeGlow)"
            stroke="url(#rtgBronzeLight)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* 3D Letter "T" / Central Pillar Facet */}
          <path
            d="M96 74 L104 74 L104 154 L96 150 Z"
            fill="url(#rtgSilverDark)"
          />
          <path
            d="M104 74 L112 74 L112 150 L104 154 Z"
            fill="url(#rtgSilverGlow)"
          />

          {/* 3D Letter "G" and Lower Shield Wing (Warm Gold / Bronze Metallic) */}
          <path
            d="M116 94 L146 94 L146 104 L128 104 L128 126 L140 126 L140 116 L132 116 L132 108 L148 108 L148 134 L116 134 Z"
            fill="url(#rtgBronzeLight)"
            stroke="#582a0d"
            strokeWidth="0.8"
          />

          {/* Bottom Dynamic Wing Sweep */}
          <path
            d="M104 154 L148 134 L140 144 Q122 158 104 164 Z"
            fill="url(#rtgBronzeDark)"
          />
          <path
            d="M96 154 L52 134 L60 144 Q78 158 96 164 Z"
            fill="url(#rtgSilverDark)"
          />

          {/* Center Energy Highlight */}
          <circle cx="100" cy="74" r="3" fill="#ffffff" />
        </svg>
      </div>

      {showText && (
        <div className="text-center mt-2">
          <span className="block text-base sm:text-lg font-black tracking-wider text-slate-100 uppercase font-sans">
            RTG-SYSTEM
          </span>
          <span className="block text-[10px] text-[#e5a968] font-bold tracking-normal mt-0.5">
            منظومة متكاملة لمتجرك الإلكتروني
          </span>
        </div>
      )}
    </div>
  );
};
