import React from "react";
import { RtgLogo } from "./RtgLogo";

interface LandingScreenProps {
  onOpenLogin: () => void;
  onEnterDemo: () => void;
  onOpenRegister: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onOpenLogin,
  onEnterDemo,
  onOpenRegister,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 overflow-y-auto px-4 py-8 pb-20">
      <div className="max-w-lg mx-auto space-y-6 flex flex-col items-center">
        {/* Logo and Brand Title */}
        <div className="text-center animate-fadeInUp">
          <RtgLogo size="large" className="animate-float" />
          <h1 className="text-3xl font-black text-white mt-3 tracking-wider">RTG GEARX</h1>
          <p className="text-xs text-slate-400 mt-1 font-bold">نظام إدارة المبيعات الاحترافي</p>
          <p className="text-[10px] text-slate-500 mt-0.5 font-mono tracking-wider">
            MOBILE & GAMING ACCESSORIES
          </p>
        </div>

        {/* Short Summary */}
        <div className="text-center animate-fadeInUp">
          <p className="text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
            منظومة متكاملة لإدارة متجرك الإلكتروني — سهلة وخفيفة تشتغل على الهاتف والكمبيوتر بكل سلاسة ودقة.
          </p>
        </div>

        {/* Core Features Grid */}
        <div className="grid grid-cols-3 gap-2.5 w-full animate-fadeInUp">
          <div className="landing-feature-card bg-[#1e293b] border border-slate-800 rounded-xl p-3 text-center space-y-1.5">
            <div className="w-10 h-10 bg-[#ff1e27]/10 rounded-lg flex items-center justify-center mx-auto text-[#ff1e27]">
              <i className="fa-solid fa-cash-register text-lg"></i>
            </div>
            <p className="text-[11px] font-bold text-slate-200">كشير بيع</p>
          </div>
          <div className="landing-feature-card bg-[#1e293b] border border-slate-800 rounded-xl p-3 text-center space-y-1.5">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto text-blue-400">
              <i className="fa-solid fa-boxes-stacked text-lg"></i>
            </div>
            <p className="text-[11px] font-bold text-slate-200">إدارة مخزن</p>
          </div>
          <div className="landing-feature-card bg-[#1e293b] border border-slate-800 rounded-xl p-3 text-center space-y-1.5">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mx-auto text-emerald-400">
              <i className="fa-solid fa-receipt text-lg"></i>
            </div>
            <p className="text-[11px] font-bold text-slate-200">سجل فواتير</p>
          </div>
          <div className="landing-feature-card bg-[#1e293b] border border-slate-800 rounded-xl p-3 text-center space-y-1.5">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto text-purple-400">
              <i className="fa-solid fa-chart-pie text-lg"></i>
            </div>
            <p className="text-[11px] font-bold text-slate-200">لوحة تقارير</p>
          </div>
          <div className="landing-feature-card bg-[#1e293b] border border-slate-800 rounded-xl p-3 text-center space-y-1.5">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center mx-auto text-amber-400">
              <i className="fa-solid fa-hand-holding-dollar text-lg"></i>
            </div>
            <p className="text-[11px] font-bold text-slate-200">إدارة ديون</p>
          </div>
          <div className="landing-feature-card bg-[#1e293b] border border-slate-800 rounded-xl p-3 text-center space-y-1.5">
            <div className="w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center mx-auto text-pink-400">
              <i className="fa-solid fa-print text-lg"></i>
            </div>
            <p className="text-[11px] font-bold text-slate-200">طباعة فواتير</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5 animate-fadeInUp">
          <button
            onClick={onOpenLogin}
            className="w-full bg-[#ff1e27] hover:bg-[#b91c1c] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-red-600/25 glow-btn transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-arrow-right-to-bracket"></i> تسجيل الدخول
          </button>
          <button
            onClick={onEnterDemo}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-gamepad text-amber-400"></i> تجربة مجانية (بيانات وهمية)
          </button>
          <button
            onClick={onOpenRegister}
            className="w-full bg-[#1e293b] hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-store"></i> سجّل متجرك الآن
          </button>
        </div>

        {/* Subscription Plans */}
        <div className="w-full space-y-2.5 animate-fadeInUp">
          <h3 className="text-sm font-bold text-slate-200 text-center flex items-center justify-center gap-2">
            <i className="fa-solid fa-crown text-amber-400"></i> باقات الاشتراك
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#1e293b] border border-emerald-500/30 rounded-xl p-3 text-center space-y-1">
              <div className="text-xl">🎮</div>
              <p className="text-[11px] font-bold text-emerald-400">مجاني</p>
              <p className="text-xs font-black text-white">0 د.ل</p>
              <p className="text-[9px] text-slate-400">أول شهر</p>
            </div>
            <div className="bg-[#1e293b] border border-[#ff1e27]/50 rounded-xl p-3 text-center space-y-1 relative shadow-lg shadow-red-950/40">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#ff1e27] text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow">
                الأكثر طلباً
              </div>
              <div className="text-xl">🚀</div>
              <p className="text-[11px] font-bold text-red-400">شهرين</p>
              <p className="text-xs font-black text-white">75 د.ل</p>
              <p className="text-[9px] text-slate-400">توفير 25 د.ل</p>
            </div>
            <div className="bg-[#1e293b] border border-amber-500/30 rounded-xl p-3 text-center space-y-1">
              <div className="text-xl">💎</div>
              <p className="text-[11px] font-bold text-amber-400">سنوي</p>
              <p className="text-xs font-black text-white">250 د.ل</p>
              <p className="text-[9px] text-slate-400">الأوفر</p>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="w-full bg-[#1e293b] border border-slate-800 rounded-2xl p-4 space-y-2.5 animate-fadeInUp">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <i className="fa-solid fa-circle-info text-blue-400"></i> من نحن؟
          </h3>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            <strong className="text-white">RTG GEARX</strong> — متجر إلكتروني ليبي متخصص في إكسسوارات ألعاب الجيمنج والهواتف. ننظّم بطولات ومسابقات ألعاب، ونقدم جوائز في أغلب البثوث المباشرة.
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            هذه المنظومة صُمّمت لمتجرنا الخاص لتنظيم المبيعات والمخزن والديون بدقة، ومتاحة الآن لكافة التجار والمتاجر الإلكترونية لتطوير تجارتهم.
          </p>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
              ✓ سهلة الاستخدام
            </span>
            <span className="text-[10px] bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
              ✓ دعم 24 ساعة
            </span>
            <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
              ✓ خفيفة جداً
            </span>
          </div>
        </div>

        {/* Social Media & Contact */}
        <div className="w-full space-y-2.5 animate-fadeInUp">
          <h3 className="text-sm font-bold text-slate-200 text-center flex items-center justify-center gap-2">
            <i className="fa-solid fa-link text-slate-400"></i> تواصل معنا
          </h3>
          <div className="flex justify-center gap-3">
            <a
              href="https://wa.me/218934590635"
              target="_blank"
              rel="noreferrer"
              className="social-btn w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white text-lg shadow-lg shadow-emerald-500/20"
              title="واتساب"
            >
              <i className="fa-brands fa-whatsapp"></i>
            </a>
            <a
              href="https://www.instagram.com/rtg_gearx?igsh=Y3JreTg0eTAzbmw0"
              target="_blank"
              rel="noreferrer"
              className="social-btn w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg shadow-lg shadow-purple-500/20"
              title="انستقرام"
            >
              <i className="fa-brands fa-instagram"></i>
            </a>
            <a
              href="https://www.tiktok.com/@rtg_gearx"
              target="_blank"
              rel="noreferrer"
              className="social-btn w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white text-lg shadow-lg border border-slate-700"
              title="تيك توك"
            >
              <i className="fa-brands fa-tiktok"></i>
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=100063457567880"
              target="_blank"
              rel="noreferrer"
              className="social-btn w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white text-lg shadow-lg shadow-blue-600/20"
              title="فيسبوك"
            >
              <i className="fa-brands fa-facebook-f"></i>
            </a>
          </div>
          <p className="text-center text-[10px] text-slate-400">
            واتساب: <span className="font-mono text-emerald-400 font-bold">0934590635</span> — دعم فني متواصل
          </p>
        </div>

        {/* Footer Note */}
        <div className="text-center pt-4 border-t border-slate-800 w-full">
          <p className="text-[10px] text-slate-500 font-mono">
            © 2025 RTG GEARX — جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  );
};
