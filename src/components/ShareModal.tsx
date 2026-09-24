import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { soundFx } from "../services/soundEffects";
import {
  shareViaWhatsApp,
  shareViaTelegram,
  shareViaNative,
  copyTextToClipboard,
} from "../services/shareHelper";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  shareText: string;
  recipientPhone?: string;
  subtitle?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title,
  shareText,
  recipientPhone,
  subtitle,
}) => {
  const [copied, setCopied] = useState(false);
  const [customPhone, setCustomPhone] = useState(recipientPhone || "");
  const hasNativeShare = typeof navigator !== "undefined" && Boolean(navigator.share);

  if (!isOpen) return null;

  const handleWhatsApp = () => {
    soundFx.playSuccess();
    shareViaWhatsApp(shareText, customPhone);
  };

  const handleTelegram = () => {
    soundFx.playClick();
    shareViaTelegram(shareText);
  };

  const handleNative = async () => {
    soundFx.playClick();
    const success = await shareViaNative(title, shareText);
    if (success) {
      soundFx.playSuccess();
      onClose();
    }
  };

  const handleCopy = async () => {
    soundFx.playClick();
    const success = await copyTextToClipboard(shareText);
    if (success) {
      soundFx.playSuccess();
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[95] flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#2c323f] rounded-3xl p-4 sm:p-6 w-full max-w-md shadow-2xl text-right space-y-4"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-base">
                <i className="fa-solid fa-share-nodes"></i>
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {subtitle || "مشاركة الفاتورة أو التقرير عبر واتساب وتطبيقات التواصل"}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          {/* Quick WhatsApp Input for customer phone */}
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-3 space-y-2">
            <label className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 block flex items-center justify-between">
              <span>رقم هاتف المستلم (واتساب):</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                اختياري — للمراسلة المباشرة
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="مثال: 0912345678"
                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-[#181c22] border border-emerald-300 dark:border-emerald-500/30 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white font-mono text-left"
                dir="ltr"
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleWhatsApp}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer shrink-0"
              >
                <i className="fa-brands fa-whatsapp text-sm"></i>
                <span>إرسال واتساب</span>
              </motion.button>
            </div>
          </div>

          {/* Sharing Platforms Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* WhatsApp general share */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleWhatsApp}
              className="p-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer transition-all"
            >
              <i className="fa-brands fa-whatsapp text-xl"></i>
              <span>واتساب (WhatsApp)</span>
            </motion.button>

            {/* Telegram */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleTelegram}
              className="p-3 rounded-2xl bg-[#229ED9] hover:bg-[#1d8bc0] text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-md shadow-[#229ED9]/20 cursor-pointer transition-all"
            >
              <i className="fa-brands fa-telegram text-xl"></i>
              <span>تيليجرام (Telegram)</span>
            </motion.button>

            {/* Native Share (Instagram, SMS, Mail, AirDrop) */}
            {hasNativeShare && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNative}
                className="p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-1">
                  <i className="fa-brands fa-instagram text-base"></i>
                  <i className="fa-solid fa-share-nodes text-xs"></i>
                </div>
                <span>إنستغرام وتطبيقات أخرى</span>
              </motion.button>
            )}

            {/* Copy Full Text */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCopy}
              className={`p-3 rounded-2xl border font-bold text-xs flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                copied
                  ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40"
                  : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700"
              } ${!hasNativeShare ? "col-span-2" : ""}`}
            >
              <i className={`fa-solid ${copied ? "fa-check text-emerald-500" : "fa-copy"} text-lg`}></i>
              <span>{copied ? "تم النسخ بنجاح ✓" : "نسخ النص كاملاً"}</span>
            </motion.button>
          </div>

          {/* Text Preview Accordion */}
          <div className="bg-slate-50 dark:bg-[#181c22] border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 text-[10px] text-slate-600 dark:text-slate-300 max-h-28 overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed select-text">
            {shareText}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
