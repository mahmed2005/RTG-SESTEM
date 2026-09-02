import React from "react";
import { RtgLogo } from "./RtgLogo";

interface LandingScreenProps {
  onOpenLogin: () => void;
  onEnterDemo: () => void;
  onOpenRegister: () => void;
  onOpenAdmin?: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onOpenLogin,
  onEnterDemo,
  onOpenRegister,
  onOpenAdmin,
}) => {
  return (
    <div className="min-h-screen bg-[#0b0e17] text-slate-200 overflow-y-auto px-4 py-8 pb-20">
      <div className="max-w-lg mx-auto space-y-6 flex flex-col items-center">
        {/* Logo and Brand Title */}
        <div className="text-center animate-fadeInUp flex flex-col items-center">
          <RtgLogo size="large" className="animate-float" />
          <h1 className="text-3xl font-black text-white mt-3 tracking-wider font-sans">
            RTG-SESTEM
          </h1>
          <p className="text-xs text-[#c5834e] mt-1 font-bold">
            منظومة متكاملة لمتجرك الإلكتروني
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-mono tracking-widest uppercase">
            PROFESSIONAL POINT OF SALE & INVENTORY SYSTEM
          </p>
        </div>

        {/* Short Summary */}
        <div className="text-center animate-fadeInUp">
          <p className="text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
            منظومة متكاملة وسلسة لإدارة متجرك ومبيعاتك — تدعم الكاشير السريع، الجرد اللحظي، الفواتير، والتزامن السحابي المشفر الفوري.
          </p>
        </div>

        {/* Core Features Grid */}
        <div className="grid grid-cols-3 gap-2.5 w-full animate-fadeInUp">
          <div className="landing-feature-card bg-[#121725] border border-slate-800 rounded-2xl p-3 text-center space-y-1.5 hover:border-[#c5834e]/40 transition-colors">
            <div className="w-10 h-10 bg-[#c5834e]/15 rounded-xl flex items-center justify-center mx-auto text-[#c5834e]">
              <i className="fa-solid fa-cash-register text-lg"></i>
            </div>
            <p className="text-[11px] font-bold text-slate-200">كشير بيع</p>
          </div>
          <div className="landing-feature-card bg-[#121725] border border-slate-800 rounded-2xl p-3 text-center space-y-1.5 hover:border-[#c5834e]/40 transition-colors">
            <div className="w-10 h-10 bg-[#94a3b8]/15 rounded-xl flex items-center justify-center mx-auto text-[#cbd5e1]">
              <i className="fa-solid fa-boxes-stacked text-lg"></i>
            </div>
            <p className="text-[11px] font-bold text-slate-200">إدارة مخزن</p>
          </div>
          <div className="landing-feature-card bg-[#121725] border border-slate-800 rounded-2xl p-3 text-center space-y-1.5 hover:border-[#c5834e]/40 transition-colors">
            <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center mx-auto text-emerald-400">
              <i className="fa-solid fa-receipt text-lg"></i>
            </div>
            <p className="text-[11px] font-bold text-slate-200">سجل فواتير</p>
          </div>
          <div className="landing-feature-card bg-[#121725] border border-slate-800 rounded-2xl p-3 text-center space-y-1.5 hover:border-[#c5834e]/40 transition-colors">
            <div className="w-10 h-10 bg-purple-500/15 rounded-xl flex items-center justify-center mx-auto text-purple-400">
              <i className="fa-solid fa-chart-pie text-lg"></i>
            </div>
            <p className="text-[11px] font-bold text-slate-200">لوحة تقارير</p>
          </div>
          <div className="landing-feature-card bg-[#121725] border border-slate-800 rounded-2xl p-3 text-center space-y-1.5 hover:border-[#c5834e]/40 transition-colors">
            <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center mx-auto text-amber-400">
              <i className="fa-solid fa-hand-holding-dollar text-lg"></i>
            </div>
            <p className="text-[11px] font-bold text-slate-200">إدارة ديون</p>
          </div>
          <div className="landing-feature-card bg-[#121725] border border-slate-800 rounded-2xl p-3 text-center space-y-1.5 hover:border-[#c5834e]/40 transition-colors">
            <div className="w-10 h-10 bg-[#c5834e]/15 rounded-xl flex items-center justify-center mx-auto text-[#c5834e]">
              <i className="fa-solid fa-print text-lg"></i>
            </div>
            <p className="text-[11px] font-bold text-slate-200">طباعة فواتير</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5 animate-fadeInUp">
          <button
            onClick={onOpenLogin}
            className="w-full btn-brand-bronze font-bold py-3.5 rounded-2xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-arrow-right-to-bracket"></i> تسجيل الدخول
          </button>
          <button
            onClick={onEnterDemo}
            className="w-full bg-[#182032] hover:bg-[#202b42] text-slate-200 border border-slate-700/80 font-bold py-3 rounded-2xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-gamepad text-[#c5834e]"></i> تجربة مجانية (بيانات تجريبية)
          </button>
          <button
            onClick={onOpenRegister}
            className="w-full bg-[#121725] hover:bg-[#1a2236] text-emerald-400 border border-emerald-500/30 font-bold py-3 rounded-2xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-store"></i> سجّل متجرك الآن
          </button>
        </div>

        {/* Subscription Plans */}
        <div className="w-full space-y-2.5 animate-fadeInUp">
          <h3 className="text-sm font-bold text-slate-200 text-center flex items-center justify-center gap-2">
            <i className="fa-solid fa-crown text-[#c5834e]"></i> باقات الاشتراك
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#121725] border border-emerald-500/30 rounded-2xl p-3 text-center space-y-1">
              <div className="text-xl">⚡</div>
              <p className="text-[11px] font-bold text-emerald-400">مجاني</p>
              <p className="text-xs font-black text-white">0 د.ل</p>
              <p className="text-[9px] text-slate-400">أول شهر</p>
            </div>
            <div className="bg-[#121725] border border-[#c5834e]/60 rounded-2xl p-3 text-center space-y-1 relative shadow-lg shadow-[#c5834e]/10">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#c5834e] text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow">
                الأكثر طلباً
              </div>
              <div className="text-xl">🚀</div>
              <p className="text-[11px] font-bold text-[#c5834e]">شهرين</p>
              <p className="text-xs font-black text-white">75 د.ل</p>
              <p className="text-[9px] text-slate-400">توفير 25 د.ل</p>
            </div>
            <div className="bg-[#121725] border border-amber-500/30 rounded-2xl p-3 text-center space-y-1">
              <div className="text-xl">💎</div>
              <p className="text-[11px] font-bold text-amber-400">سنوي</p>
              <p className="text-xs font-black text-white">250 د.ل</p>
              <p className="text-[9px] text-slate-400">الأوفر</p>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="w-full bg-[#121725] border border-slate-800 rounded-2xl p-4 space-y-2.5 animate-fadeInUp">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <i className="fa-solid fa-circle-info text-[#c5834e]"></i> عن منظومة RTG-SESTEM
          </h3>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            <strong className="text-white font-bold">RTG-SESTEM</strong> — منظومة إدارة مبيعات متطورة واحترافية متوافقة مع الهواتف والأجهزة اللوحية والحواسيب. صُممت لتسهيل تدوين المبيعات، ضبط المخازن، إدارة الديون، وطباعة الإيصالات بسرعة وسلاسة تامة.
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            تدعم التزامن السحابي المباشر والمشفر لحفظ وتأمين بياناتك وسجلاتك دون أي تعقيد تقني.
          </p>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] bg-[#c5834e]/15 text-[#e0a36e] border border-[#c5834e]/30 px-2 py-0.5 rounded-full font-bold">
              ✓ تزامن سحابي مشفر 24/7
            </span>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
              ✓ سهلة وخفيفة
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-bold">
              ✓ دعم فني 24/7
            </span>
          </div>
        </div>

        {/* Social Media & Contact */}
        <div className="w-full space-y-2.5 animate-fadeInUp">
          <h3 className="text-sm font-bold text-slate-200 text-center flex items-center justify-center gap-2">
            <i className="fa-solid fa-link text-[#c5834e]"></i> تواصل معنا
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
              className="social-btn w-11 h-11 rounded-full bg-[#182032] hover:bg-[#202b42] flex items-center justify-center text-white text-lg shadow-lg border border-slate-700"
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

        {/* Footer Note with Discreet Admin Lock */}
        <div className="text-center pt-4 border-t border-slate-800 w-full flex items-center justify-center gap-2">
          <p className="text-[10px] text-slate-500 font-mono">
            © 2025 RTG-SESTEM — جميع الحقوق محفوظة
          </p>
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              title="لوحة الإدارة"
              className="text-slate-600 hover:text-[#c5834e] transition-colors p-1 cursor-pointer text-[11px] opacity-70 hover:opacity-100"
              aria-label="Admin Access"
            >
              <i className="fa-solid fa-lock"></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
