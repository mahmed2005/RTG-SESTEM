import React, { useEffect, useState } from "react";
import { RtgLogo } from "./RtgLogo";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 300);
          return 100;
        }
        return prev + 4;
      });
    }, 60);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      id="splashScreen"
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_50%_30%,#1e293b_0%,#0f172a_50%,#050810_100%)] text-center select-none"
    >
      {/* Floating particles */}
      <div
        className="absolute w-1 h-1 bg-red-500/40 rounded-full animate-float"
        style={{ top: "15%", left: "20%", animationDelay: "0s" }}
      />
      <div
        className="absolute w-1.5 h-1.5 bg-red-500/30 rounded-full animate-float"
        style={{ top: "30%", right: "15%", animationDelay: "1s" }}
      />
      <div
        className="absolute w-1 h-1 bg-red-500/50 rounded-full animate-float"
        style={{ bottom: "25%", left: "30%", animationDelay: "2s" }}
      />
      <div
        className="absolute w-2 h-2 bg-red-500/20 rounded-full animate-float"
        style={{ top: "50%", right: "25%", animationDelay: "0.5s" }}
      />
      <div
        className="absolute w-1 h-1 bg-red-500/40 rounded-full animate-float"
        style={{ bottom: "15%", right: "35%", animationDelay: "1.5s" }}
      />

      <RtgLogo size="splash" />

      <h1 className="text-3xl font-black text-white mt-5 tracking-wider animate-fadeInUp">
        RTG GEARX
      </h1>
      <p className="text-sm text-slate-400 mt-2 font-medium animate-fadeInUp">
        نظام إدارة المبيعات الاحترافي
      </p>
      <p className="text-[11px] text-slate-500 mt-1 font-mono tracking-widest animate-fadeInUp">
        MOBILE & GAMING ACCESSORIES
      </p>

      {/* Progress Bar */}
      <div className="w-48 h-1.5 bg-slate-800 rounded-full mt-8 overflow-hidden shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-[#ff1e27] via-red-500 to-rose-400 rounded-full transition-all duration-100 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center gap-2 mt-3">
        <p className="text-[11px] text-slate-500 font-medium">جاري تجهيز المنظومة...</p>
        <button
          onClick={onComplete}
          className="text-[10px] text-slate-400 hover:text-white bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700 ml-2 transition-colors"
        >
          تخطي
        </button>
      </div>
    </div>
  );
};
