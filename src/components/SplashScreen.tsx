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
        return prev + 5;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      id="splashScreen"
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_50%_30%,#182032_0%,#0e1320_55%,#070a11_100%)] text-center select-none"
    >
      {/* Floating particles matching bronze/copper & silver */}
      <div
        className="absolute w-1.5 h-1.5 bg-[#c5834e]/40 rounded-full animate-float"
        style={{ top: "15%", left: "20%", animationDelay: "0s" }}
      />
      <div
        className="absolute w-2 h-2 bg-[#94a3b8]/30 rounded-full animate-float"
        style={{ top: "28%", right: "18%", animationDelay: "1s" }}
      />
      <div
        className="absolute w-1.5 h-1.5 bg-[#d99866]/50 rounded-full animate-float"
        style={{ bottom: "25%", left: "30%", animationDelay: "2s" }}
      />
      <div
        className="absolute w-2.5 h-2.5 bg-[#c5834e]/25 rounded-full animate-float"
        style={{ top: "50%", right: "25%", animationDelay: "0.5s" }}
      />

      <RtgLogo size="splash" className="animate-float" />

      <h1 className="text-3xl sm:text-4xl font-black text-white mt-5 tracking-wider animate-fadeInUp">
        RTG-SYSTEM
      </h1>
      <p className="text-sm text-[#c5834e] mt-1.5 font-bold animate-fadeInUp">
        منظومة متكاملة لمتجرك الإلكتروني
      </p>

      {/* Progress Bar */}
      <div className="w-52 h-2 bg-slate-900 rounded-full mt-8 overflow-hidden shadow-inner border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-[#8c562a] via-[#c5834e] to-[#e0a36e] rounded-full transition-all duration-100 ease-out shadow-lg shadow-[#c5834e]/40"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center gap-2 mt-3.5">
        <p className="text-[11px] text-slate-400 font-medium">جاري تجهيز المنظومة...</p>
        <button
          onClick={onComplete}
          className="text-[10px] text-slate-400 hover:text-white bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700 ml-2 transition-colors cursor-pointer"
        >
          تخطي
        </button>
      </div>
    </div>
  );
};
