import React, { useEffect } from "react";
import { RtgLogo } from "./RtgLogo";
import { soundFx } from "../services/soundEffects";
import { motion } from "motion/react";

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
  useEffect(() => {
    // Attempt to play welcome chime
    const triggerWelcome = () => {
      soundFx.playWelcome();
      window.removeEventListener("click", triggerWelcome);
      window.removeEventListener("touchstart", triggerWelcome);
    };

    // Browsers require a user gesture for audio context; listen for first gesture or trigger directly
    try {
      soundFx.playWelcome();
    } catch {}

    window.addEventListener("click", triggerWelcome, { once: true });
    window.addEventListener("touchstart", triggerWelcome, { once: true });

    return () => {
      window.removeEventListener("click", triggerWelcome);
      window.removeEventListener("touchstart", triggerWelcome);
    };
  }, []);

  const handleAction = (cb: () => void) => {
    soundFx.playClick();
    cb();
  };

  return (
    <div className="min-h-screen bg-[#0b0e17] text-slate-200 overflow-y-auto px-4 py-8 pb-20">
      <div className="max-w-lg mx-auto space-y-6 flex flex-col items-center">
        {/* Logo and Brand Title with Framer Motion */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center flex flex-col items-center"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <RtgLogo size="large" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mt-3.5 tracking-wider font-sans uppercase drop-shadow-md">
            RTG-SYSTEM
          </h1>
          <p className="text-xs sm:text-sm text-[#c5834e] mt-1 font-bold">
            منظومة متكاملة لمتجرك الإلكتروني
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-mono tracking-widest uppercase">
            PROFESSIONAL POINT OF SALE & INVENTORY SYSTEM
          </p>
        </motion.div>

        {/* Short Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-center"
        >
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
            منظومة متكاملة وسلسة لإدارة متجرك ومبيعاتك — كاشير سريع، جرد لحظي، فواتير مميزة، ومزامنة سحابية فائقة السرعة مع جوجل شيت.
          </p>
        </motion.div>

        {/* Core Features Grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="grid grid-cols-3 gap-2.5 w-full"
        >
          <motion.div
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="landing-feature-card bg-[#121725] border border-slate-800 rounded-2xl p-3 text-center space-y-1.5 hover:border-[#c5834e]/40 transition-colors shadow-sm"
          >
            <div className="w-10 h-10 bg-[#c5834e]/15 rounded-xl flex items-center justify-center mx-auto text-[#c5834e]">
              <i className="fa-solid fa-cash-register text-lg"></i>
            </div>
            <p className="text-[11px] font-bold text-slate-200">كشير بيع</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="landing-feature-card bg-[#121725] border border-slate-800 rounded-2xl p-3 text-center space-y-1.5 hover:border-[#c5834e]/40 transition-colors shadow-sm"
          >
            <div className="w-10 h-10 bg-[#94a3b8]/15 rounded-xl flex items-center justify-center mx-auto text-[#cbd5e1]">
              <i className="fa-solid fa-boxes-stacked text-lg"></i>
            </div>
            <p className="text-[11px] font-bold text-slate-200">إدارة مخزن</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="landing-feature-card bg-[#121725] border border-slate-800 rounded-2xl p-3 text-center space-y-1.5 hover:border-[#c5834e]/40 transition-colors shadow-sm"
          >
            <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center mx-auto text-emerald-400">
              <i className="fa-solid fa-receipt text-lg"></i>
            </div>
            <p className="text-[11px] font-bold text-slate-200">سجل فواتير</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="landing-feature-card bg-[#121725] border border-slate-800 rounded-2xl p-3 text-center space-y-1.5 hover:border-[#c5834e]/40 transition-colors shadow-sm"
          >
            <div className="w-10 h-10 bg-purple-500/15 rounded-xl flex items-center justify-center mx-auto text-purple-400">
              <i className="fa-solid fa-chart-pie text-lg"></i>
            </div>
            <p className="text-[11px] font-bold text-slate-200">لوحة تقارير</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="landing-feature-card bg-[#121725] border border-slate-800 rounded-2xl p-3 text-center space-y-1.5 hover:border-[#c5834e]/40 transition-colors shadow-sm"
          >
            <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center mx-auto text-amber-400">
              <i className="fa-solid fa-hand-holding-dollar text-lg"></i>
            </div>
            <p className="text-[11px] font-bold text-slate-200">إدارة ديون</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="landing-feature-card bg-[#121725] border border-slate-800 rounded-2xl p-3 text-center space-y-1.5 hover:border-[#c5834e]/40 transition-colors shadow-sm"
          >
            <div className="w-10 h-10 bg-[#c5834e]/15 rounded-xl flex items-center justify-center mx-auto text-[#c5834e]">
              <i className="fa-solid fa-print text-lg"></i>
            </div>
            <p className="text-[11px] font-bold text-slate-200">طباعة فواتير</p>
          </motion.div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="w-full space-y-2.5"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleAction(onOpenLogin)}
            className="w-full btn-brand-bronze font-bold py-3.5 rounded-2xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#c5834e]/20"
          >
            <i className="fa-solid fa-arrow-right-to-bracket"></i> تسجيل الدخول للمشتركين
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleAction(onEnterDemo)}
            className="w-full bg-[#182032] hover:bg-[#202b42] text-slate-200 border border-slate-700/80 font-bold py-3 rounded-2xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <i className="fa-solid fa-gamepad text-[#c5834e]"></i> تجربة مجانية (بيانات تجريبية)
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleAction(onOpenRegister)}
            className="w-full bg-[#121725] hover:bg-[#1a2236] text-emerald-400 border border-emerald-500/30 font-bold py-3 rounded-2xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <i className="fa-solid fa-store"></i> سجّل متجرك الجديد الآن
          </motion.button>
        </motion.div>

        {/* Subscription Plans */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="w-full space-y-2.5"
        >
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
        </motion.div>

        {/* About Section */}
        <div className="w-full bg-[#121725] border border-slate-800 rounded-2xl p-4 space-y-2.5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <i className="fa-solid fa-circle-info text-[#c5834e]"></i> عن منظومة RTG-SYSTEM
          </h3>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            <strong className="text-white font-bold">RTG-SYSTEM</strong> — منظومة إدارة مبيعات متطورة واحترافية متوافقة مع الهواتف والأجهزة اللوحية والحواسيب. صُممت لتسهيل تدوين المبيعات، ضبط المخازن، إدارة الديون، وطباعة الإيصالات بسرعة وسلاسة تامة.
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            تدعم التزامن السحابي المباشر والمشفر لحفظ وتأمين بياناتك وسجلاتك دون أي تعقيد تقني.
          </p>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] bg-[#c5834e]/15 text-[#e0a36e] border border-[#c5834e]/30 px-2 py-0.5 rounded-full font-bold">
              ✓ مزامنة سحابية لحظية 24/7
            </span>
            <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
              ✓ سريعة وفورية بدون تأخير
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-bold">
              ✓ دعم فني 24/7
            </span>
          </div>
        </div>

        {/* Social Media & Contact */}
        <div className="w-full space-y-2.5">
          <h3 className="text-sm font-bold text-slate-200 text-center flex items-center justify-center gap-2">
            <i className="fa-solid fa-link text-[#c5834e]"></i> تواصل معنا
          </h3>
          <div className="flex justify-center gap-3">
            <motion.a
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              href="https://wa.me/218934590635"
              target="_blank"
              rel="noreferrer"
              className="social-btn w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center text-white text-lg shadow-lg shadow-emerald-500/20"
              title="واتساب"
            >
              <i className="fa-brands fa-whatsapp"></i>
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              href="https://www.instagram.com/rtg_gearx?igsh=Y3JreTg0eTAzbmw0"
              target="_blank"
              rel="noreferrer"
              className="social-btn w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg shadow-lg shadow-purple-500/20"
              title="انستقرام"
            >
              <i className="fa-brands fa-instagram"></i>
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              href="https://www.tiktok.com/@rtg_gearx"
              target="_blank"
              rel="noreferrer"
              className="social-btn w-11 h-11 rounded-full bg-[#182032] hover:bg-[#202b42] flex items-center justify-center text-white text-lg shadow-lg border border-slate-700"
              title="تيك توك"
            >
              <i className="fa-brands fa-tiktok"></i>
            </motion.a>
            <motion.a
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              href="https://www.facebook.com/profile.php?id=100063457567880"
              target="_blank"
              rel="noreferrer"
              className="social-btn w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white text-lg shadow-lg shadow-blue-600/20"
              title="فيسبوك"
            >
              <i className="fa-brands fa-facebook-f"></i>
            </motion.a>
          </div>
          <p className="text-center text-[10px] text-slate-400">
            واتساب: <span className="font-mono text-emerald-400 font-bold">0934590635</span> — دعم فني متواصل
          </p>
        </div>

        {/* Footer Note with Discreet Admin Lock */}
        <div className="text-center pt-4 border-t border-slate-800 w-full flex items-center justify-center gap-2">
          <p className="text-[10px] text-slate-500 font-mono">
            © 2025 RTG-SYSTEM — جميع الحقوق محفوظة
          </p>
          {onOpenAdmin && (
            <button
              onClick={() => handleAction(onOpenAdmin)}
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
