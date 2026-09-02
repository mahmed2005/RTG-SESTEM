import React from "react";

interface LogoutModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeInUp">
      <div className="bg-[#1e293b] rounded-2xl border border-slate-800 p-5 w-full max-w-sm shadow-2xl text-center space-y-4">
        <div className="w-12 h-12 bg-amber-500/15 text-amber-400 rounded-full flex items-center justify-center text-xl mx-auto border border-amber-500/30">
          <i className="fa-solid fa-power-off"></i>
        </div>

        <div>
          <h3 className="text-sm font-black text-white">هل تود تسجيل الخروج فعلاً؟</h3>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            سيتم مسح جلسة الترخيص النشطة والرجوع إلى شاشة البداية الرئيسية.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onConfirm}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-xs glow-btn cursor-pointer"
          >
            تأكيد الخروج
          </button>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
