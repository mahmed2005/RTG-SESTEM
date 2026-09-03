import React, { useEffect, useState } from "react";
import { RtgLogo } from "./RtgLogo";
import { soundFx } from "../services/soundEffects";
import { motion, AnimatePresence } from "motion/react";
import { SubscriptionPlan } from "../types";
import { DEFAULT_SUBSCRIPTION_PLANS, getSocialLinks, SocialLinks } from "../data/initialStores";

interface LandingScreenProps {
  onOpenLogin: () => void;
  onEnterDemo: () => void;
  onOpenRegister: () => void;
  onOpenAdmin?: () => void;
  subscriptionPlans?: SubscriptionPlan[];
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onOpenLogin,
  onEnterDemo,
  onOpenRegister,
  onOpenAdmin,
  subscriptionPlans = DEFAULT_SUBSCRIPTION_PLANS,
}) => {
  const [isPlansModalOpen, setIsPlansModalOpen] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(() => getSocialLinks());

  // Reload social links when modal or state changes
  useEffect(() => {
    setSocialLinks(getSocialLinks());
  }, [isPlansModalOpen]);

  // Active plans list to display
  const activePlans = subscriptionPlans && subscriptionPlans.length > 0
    ? subscriptionPlans
    : DEFAULT_SUBSCRIPTION_PLANS;
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
    <div className="min-h-screen bg-[#121418] text-slate-200 overflow-y-auto px-4 py-8 pb-20">
      <div className="max-w-lg mx-auto space-y-6 flex flex-col items-center">
        {/* Full Official Image As Sent By User - Uncropped and in Full Fidelity */}
        <motion.div
          initial={{ opacity: 0, y: -15, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center flex flex-col items-center w-full"
        >
          <RtgLogo size="full" />
          <div className="mt-3.5 space-y-1">
            <h2 className="text-xs sm:text-sm font-bold text-slate-200 font-['IBM_Plex_Sans_Arabic','Cairo',sans-serif] tracking-normal flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c57b42]"></span>
              منظومة متكاملة لمتجرك الإلكتروني
              <span className="w-1.5 h-1.5 rounded-full bg-[#c57b42]"></span>
            </h2>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
              PROFESSIONAL POINT OF SALE & INVENTORY SYSTEM
            </p>
          </div>
        </motion.div>

        {/* Short Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-center"
        >
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto font-['IBM_Plex_Sans_Arabic','Tajawal',sans-serif]">
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
            className="landing-feature-card bg-[#181c22] border border-[#2c323f] rounded-2xl p-3 text-center space-y-1.5 hover:border-[#c57b42]/40 transition-colors shadow-sm"
          >
            <div className="w-10 h-10 bg-[#c57b42]/15 rounded-xl flex items-center justify-center mx-auto text-[#c57b42]">
              <i className="fa-solid fa-cash-register text-lg"></i>
            </div>
            <p className="text-[11px] font-bold text-slate-200">كشير بيع</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="landing-feature-card bg-[#181c22] border border-[#2c323f] rounded-2xl p-3 text-center space-y-1.5 hover:border-[#c57b42]/40 transition-colors shadow-sm"
          >
            <div className="w-10 h-10 bg-[#94a3b8]/15 rounded-xl flex items-center justify-center mx-auto text-[#cbd5e1]">
              <i className="fa-solid fa-boxes-stacked text-lg"></i>
            </div>
            <p className="text-[11px] font-bold text-slate-200">إدارة مخزن</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="landing-feature-card bg-[#181c22] border border-[#2c323f] rounded-2xl p-3 text-center space-y-1.5 hover:border-[#c57b42]/40 transition-colors shadow-sm"
          >
            <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center mx-auto text-emerald-400">
              <i className="fa-solid fa-receipt text-lg"></i>
            </div>
            <p className="text-[11px] font-bold text-slate-200">سجل فواتير</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="landing-feature-card bg-[#181c22] border border-[#2c323f] rounded-2xl p-3 text-center space-y-1.5 hover:border-[#c57b42]/40 transition-colors shadow-sm"
          >
            <div className="w-10 h-10 bg-purple-500/15 rounded-xl flex items-center justify-center mx-auto text-purple-400">
              <i className="fa-solid fa-chart-pie text-lg"></i>
            </div>
            <p className="text-[11px] font-bold text-slate-200">لوحة تقارير</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="landing-feature-card bg-[#181c22] border border-[#2c323f] rounded-2xl p-3 text-center space-y-1.5 hover:border-[#c57b42]/40 transition-colors shadow-sm"
          >
            <div className="w-10 h-10 bg-amber-500/15 rounded-xl flex items-center justify-center mx-auto text-amber-400">
              <i className="fa-solid fa-hand-holding-dollar text-lg"></i>
            </div>
            <p className="text-[11px] font-bold text-slate-200">إدارة ديون</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="landing-feature-card bg-[#181c22] border border-[#2c323f] rounded-2xl p-3 text-center space-y-1.5 hover:border-[#c57b42]/40 transition-colors shadow-sm"
          >
            <div className="w-10 h-10 bg-[#c57b42]/15 rounded-xl flex items-center justify-center mx-auto text-[#c57b42]">
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
            className="w-full btn-brand-bronze font-bold py-3.5 rounded-2xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#c57b42]/20"
          >
            <i className="fa-solid fa-arrow-right-to-bracket"></i> تسجيل الدخول للمشتركين
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleAction(onEnterDemo)}
            className="w-full bg-[#1f232b] hover:bg-[#262b35] text-slate-200 border border-[#2c323f] font-bold py-3 rounded-2xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <i className="fa-solid fa-gamepad text-[#c57b42]"></i> تجربة مجانية (بيانات تجريبية)
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleAction(onOpenRegister)}
            className="w-full bg-[#181c22] hover:bg-[#1f232b] text-emerald-400 border border-emerald-500/30 font-bold py-3 rounded-2xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <i className="fa-solid fa-store"></i> سجّل متجرك الجديد الآن
          </motion.button>
        </motion.div>

        {/* Modern Interactive Square Button for Plans */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4 }}
          className="w-full"
        >
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              soundFx.playClick();
              setIsPlansModalOpen(true);
            }}
            className="w-full group relative overflow-hidden bg-gradient-to-br from-[#181c22] via-[#202530] to-[#151921] border-2 border-[#c57b42]/50 hover:border-[#c57b42] rounded-2xl p-4 shadow-xl shadow-black/40 transition-all text-right cursor-pointer"
          >
            {/* Ambient subtle glow */}
            <div className="absolute -top-10 -left-10 w-28 h-28 bg-[#c57b42]/15 rounded-full blur-xl pointer-events-none group-hover:bg-[#c57b42]/25 transition-all"></div>

            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3.5">
                {/* Square Accent Icon Box */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#c57b42] to-[#8f5223] text-white flex items-center justify-center text-xl shadow-lg shadow-[#c57b42]/30 shrink-0 border border-[#e0a36e]/40 group-hover:rotate-3 transition-transform">
                  <i className="fa-solid fa-crown"></i>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-white group-hover:text-[#e0a36e] transition-colors">
                      باقات واشتراكات المنظومة
                    </h4>
                    <span className="text-[10px] bg-[#c57b42]/20 text-[#e0a36e] border border-[#c57b42]/40 px-2 py-0.5 rounded-md font-bold">
                      {activePlans.length} باقات مفعّلة
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    اضغط هنا لاستعراض تفاصيل وأسعار الباقات المحددة من الإدارة
                  </p>
                </div>
              </div>

              {/* Arrow Indicator Button */}
              <div className="w-9 h-9 rounded-xl bg-[#29303e] text-[#e0a36e] group-hover:bg-[#c57b42] group-hover:text-white flex items-center justify-center text-xs transition-all shadow-inner shrink-0">
                <i className="fa-solid fa-arrow-left"></i>
              </div>
            </div>
          </motion.button>
        </motion.div>

        {/* About Section */}
        <div className="w-full bg-[#181c22] border border-[#2c323f] rounded-2xl p-4 space-y-2.5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <i className="fa-solid fa-circle-info text-[#c57b42]"></i> عن منظومة RTG-SYSTEM
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
            <i className="fa-solid fa-link text-[#c57b42]"></i> تواصل معنا
          </h3>
          <div className="flex justify-center gap-3">
            {/* WhatsApp - Genuine Brand Color #25D366 */}
            <motion.a
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              href={socialLinks.whatsapp || "https://wa.me/218934590635"}
              target="_blank"
              rel="noreferrer"
              className="social-btn w-11 h-11 rounded-full bg-[#25D366] hover:bg-[#20ba59] flex items-center justify-center text-white text-lg shadow-lg shadow-[#25D366]/30 transition-transform cursor-pointer"
              title="واتساب"
            >
              <i className="fa-brands fa-whatsapp"></i>
            </motion.a>

            {/* Instagram - Genuine Brand Vibrant Gradient */}
            <motion.a
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              href={socialLinks.instagram || "https://instagram.com"}
              target="_blank"
              rel="noreferrer"
              className="social-btn w-11 h-11 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-95 flex items-center justify-center text-white text-lg shadow-lg shadow-[#dc2743]/30 transition-transform cursor-pointer"
              title="إنستغرام"
            >
              <i className="fa-brands fa-instagram"></i>
            </motion.a>

            {/* TikTok - Genuine Brand Black with Contrast Glow */}
            <motion.a
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              href={socialLinks.tiktok || "https://tiktok.com"}
              target="_blank"
              rel="noreferrer"
              className="social-btn w-11 h-11 rounded-full bg-black border border-slate-700 hover:border-[#00f2fe] flex items-center justify-center text-white text-lg shadow-lg shadow-black/50 transition-all cursor-pointer"
              title="تيك توك"
            >
              <i className="fa-brands fa-tiktok"></i>
            </motion.a>

            {/* Facebook - Genuine Brand Color #1877F2 */}
            <motion.a
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              href={socialLinks.facebook || "https://www.facebook.com/profile.php?id=100063457567880"}
              target="_blank"
              rel="noreferrer"
              className="social-btn w-11 h-11 rounded-full bg-[#1877F2] hover:bg-[#166fe5] flex items-center justify-center text-white text-lg shadow-lg shadow-[#1877F2]/30 transition-transform cursor-pointer"
              title="فيسبوك"
            >
              <i className="fa-brands fa-facebook-f"></i>
            </motion.a>
          </div>
          <p className="text-center text-[10px] text-slate-400">
            واتساب: <span className="font-mono text-emerald-400 font-bold">{socialLinks.whatsappPhone || "0934590635"}</span> — دعم فني متواصل
          </p>
        </div>

        {/* Footer Note with Discreet Admin Lock */}
        <div className="text-center pt-4 border-t border-[#2c323f] w-full flex items-center justify-center gap-2">
          <p className="text-[10px] text-slate-500 font-mono">
            © 2025 RTG-SYSTEM — جميع الحقوق محفوظة
          </p>
          {onOpenAdmin && (
            <button
              onClick={() => handleAction(onOpenAdmin)}
              title="لوحة الإدارة"
              className="text-slate-500 hover:text-[#c57b42] transition-colors p-1 cursor-pointer text-[11px] opacity-70 hover:opacity-100"
              aria-label="Admin Access"
            >
              <i className="fa-solid fa-lock"></i>
            </button>
          )}
        </div>
      </div>

      {/* Subscription Plans Full Modal */}
      <AnimatePresence>
        {isPlansModalOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              className="bg-[#15181e] border border-[#2c323f] rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
              dir="rtl"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-[#2c323f] flex items-center justify-between bg-[#1a1d24]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#c57b42]/15 text-[#c57b42] flex items-center justify-center text-lg border border-[#c57b42]/30">
                    <i className="fa-solid fa-gem"></i>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-white">
                      باقات وأسعار اشتراكات RTG-SYSTEM
                    </h2>
                    <p className="text-xs text-slate-400">
                      اختر الباقة المناسبة لحجم ونشاط متجرك مع مزامنة سحابية مستمرة
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPlansModalOpen(false)}
                  className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* Modal Body: Plans Grid */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activePlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`relative rounded-2xl p-4 border flex flex-col justify-between transition-all ${
                        plan.badge && plan.badge.includes("الأكثر")
                          ? "bg-gradient-to-b from-[#252a35] to-[#1a1d24] border-[#c57b42] shadow-lg shadow-[#c57b42]/10"
                          : "bg-[#1a1d24] border-[#2c323f] hover:border-slate-600"
                      }`}
                    >
                      {plan.badge && (
                        <div className="absolute -top-2.5 left-4 bg-gradient-to-r from-[#c57b42] to-[#a25c27] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
                          {plan.badge}
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between pt-1">
                          <h4 className="text-sm font-black text-white">{plan.name}</h4>
                          <span className="text-[11px] font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md">
                            {plan.months} {plan.months === 1 ? "شهر" : plan.months === 2 ? "شهران" : "أشهر"}
                          </span>
                        </div>

                        {/* Price Display */}
                        <div className="flex items-baseline gap-2 pt-1 pb-2 border-b border-[#2c323f]">
                          <span className="text-2xl font-black text-white font-mono">{plan.price}</span>
                          <span className="text-xs font-bold text-[#c57b42]">دينار ليبي (د.ل)</span>
                          {plan.originalPrice && plan.originalPrice > plan.price && (
                            <span className="text-xs text-slate-500 line-through font-mono mr-1">
                              {plan.originalPrice} د.ل
                            </span>
                          )}
                        </div>

                        {/* Features */}
                        <ul className="space-y-2 py-2 text-xs text-slate-300">
                          {plan.features.map((feat, fIdx) => (
                            <li key={fIdx} className="flex items-start gap-2">
                              <i className="fa-solid fa-check text-emerald-400 mt-0.5 shrink-0 text-[11px]"></i>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Subscribe CTA */}
                      <button
                        onClick={() => {
                          setIsPlansModalOpen(false);
                          handleAction(onOpenRegister);
                        }}
                        className="w-full mt-3 py-2.5 px-3 rounded-xl bg-[#252a35] hover:bg-[#c57b42] text-slate-200 hover:text-white border border-[#c57b42]/30 hover:border-transparent text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <i className="fa-solid fa-bolt text-[#c57b42] group-hover:text-white"></i>
                        <span>اشتراك في هذه الباقة</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Guarantee Banner */}
                <div className="bg-[#1a1d24] border border-[#2c323f] rounded-2xl p-3.5 flex items-center gap-3 text-right">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-base shrink-0">
                    <i className="fa-solid fa-shield-halved"></i>
                  </div>
                  <div className="text-xs text-slate-300 space-y-0.5">
                    <p className="font-bold text-white">ضمان ودعم فني متواصل</p>
                    <p className="text-[11px] text-slate-400">
                      تشمل كافة الاشتراكات ربط ومزامنة قاعدة البيانات السحابية، ونسخ احتياطي يومي وحماية مشفرة.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[#2c323f] bg-[#1a1d24] flex items-center justify-between">
                <button
                  onClick={() => setIsPlansModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
                <button
                  onClick={() => {
                    setIsPlansModalOpen(false);
                    handleAction(onOpenRegister);
                  }}
                  className="px-5 py-2 rounded-xl btn-brand-bronze text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-store"></i>
                  <span>طلب تسجيل اشتراك جديد</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
