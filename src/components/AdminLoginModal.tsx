import React, { useState } from "react";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  adminPassword: string;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  adminPassword,
  showToast,
}) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === adminPassword) {
      setError(false);
      setPassword("");
      onSuccess();
      showToast("✓ مرحباً بك في لوحة الإدارة المركزية", "success");
    } else {
      setError(true);
      showToast("كلمة المرور غير صحيحة", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[65] flex items-center justify-center p-4 animate-fadeInUp" dir="rtl">
      <div className="bg-[#121725] rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-800 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#c5834e]/20 border border-[#c5834e]/40 text-[#c5834e] flex items-center justify-center mx-auto text-xl shadow-inner">
          <i className="fa-solid fa-lock"></i>
        </div>

        <div>
          <h2 className="text-base font-black text-white">لوحة تحكم الإدارة</h2>
          <p className="text-xs text-slate-400 mt-1">أدخل كلمة المرور السرية للمتابعة</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <input
              type="password"
              autoFocus
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(false);
              }}
              placeholder="كلمة مرور المشرف..."
              className="w-full px-4 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl text-center text-xs text-white placeholder-slate-500 outline-none focus:border-[#c5834e] transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 font-bold bg-rose-950/40 border border-rose-800/60 p-2 rounded-lg">
              <i className="fa-solid fa-triangle-exclamation ml-1"></i> كلمة المرور غير صحيحة!
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="submit"
              className="bg-[#c5834e] hover:bg-[#a6632f] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
            >
              <i className="fa-solid fa-arrow-right-to-bracket"></i> دخول
            </button>
            <button
              type="button"
              onClick={() => {
                setPassword("");
                setError(false);
                onClose();
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs border border-slate-700 cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
