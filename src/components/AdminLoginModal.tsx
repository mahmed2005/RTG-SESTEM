import React, { useState, useEffect } from "react";
import { cloudFetchMasterAdminPassword } from "../services/cloudService";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  adminPassword: string;
  masterScriptUrl?: string;
  onUpdateAdminPassword?: (newPass: string) => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  adminPassword,
  masterScriptUrl,
  onUpdateAdminPassword,
  showToast,
}) => {
  const [password, setPassword] = useState("");
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Background refresh of admin password from central Google Sheets when modal opens
  useEffect(() => {
    if (isOpen && masterScriptUrl && masterScriptUrl.trim()) {
      cloudFetchMasterAdminPassword(masterScriptUrl)
        .then((latestPass) => {
          if (latestPass && onUpdateAdminPassword) {
            onUpdateAdminPassword(latestPass);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, masterScriptUrl, onUpdateAdminPassword]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = password.trim();
    if (!entered) return;

    // 1. Instant check against currently known admin password
    if (entered === (adminPassword || "").trim()) {
      setError(false);
      setPassword("");
      onSuccess();
      showToast("✓ مرحباً بك في لوحة الإدارة المركزية", "success");
      return;
    }

    // 2. If entered doesn't match local cache, verify LIVE against Google Sheets
    if (masterScriptUrl && masterScriptUrl.trim()) {
      setIsVerifying(true);
      setError(false);

      try {
        const cloudPass = await cloudFetchMasterAdminPassword(masterScriptUrl);
        setIsVerifying(false);

        if (cloudPass && cloudPass.trim() === entered) {
          // Matched central Google Sheets!
          if (onUpdateAdminPassword) {
            onUpdateAdminPassword(cloudPass.trim());
          }
          setPassword("");
          onSuccess();
          showToast("✓ تم التحقق والمطابقة بنجاح من قاعدة بيانات جوجل شيت", "success");
          return;
        }

        // Did not match cloud either
        if (cloudPass && onUpdateAdminPassword) {
          onUpdateAdminPassword(cloudPass.trim());
        }
        setError(true);
        setErrorMessage("كلمة المرور غير صحيحة (تمت المطابقة مع خادم جوجل شيت)");
        showToast("كلمة المرور غير صحيحة", "error");
        return;
      } catch {
        setIsVerifying(false);
      }
    }

    // 3. Fallback error
    setError(true);
    setErrorMessage("كلمة المرور غير صحيحة!");
    showToast("كلمة المرور غير صحيحة", "error");
  };

  return (
    <div
      className="fixed inset-0 bg-[#121418]/90 backdrop-blur-md z-[65] flex items-center justify-center p-4 animate-fadeInUp"
      dir="rtl"
    >
      <div className="bg-[#121418] rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-[#2c323f] text-center space-y-4">
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
              type={showPasswordText ? "text" : "password"}
              autoFocus
              required
              disabled={isVerifying}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(false);
              }}
              placeholder="كلمة مرور المشرف..."
              className="w-full px-10 py-2.5 bg-[#181c22] border border-[#2c323f] rounded-xl text-center text-xs text-white placeholder-slate-500 outline-none focus:border-[#c5834e] transition-colors font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPasswordText(!showPasswordText)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer p-1"
              title={showPasswordText ? "إخفاء" : "إظهار"}
            >
              <i className={`fa-solid ${showPasswordText ? "fa-eye-slash" : "fa-eye"}`}></i>
            </button>
          </div>

          {isVerifying && (
            <div className="text-[11px] text-[#c5834e] bg-[#c5834e]/10 border border-[#c5834e]/20 p-2 rounded-lg flex items-center justify-center gap-2 animate-pulse">
              <i className="fa-solid fa-arrows-rotate animate-spin"></i>
              <span>جاري التحقق المباشر من خادم جوجل شيت المركزي...</span>
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-400 font-bold bg-rose-950/40 border border-rose-800/60 p-2 rounded-lg">
              <i className="fa-solid fa-triangle-exclamation ml-1"></i>
              {errorMessage || "كلمة المرور غير صحيحة!"}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="submit"
              disabled={isVerifying}
              className="bg-[#c5834e] hover:bg-[#a6632f] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
            >
              {isVerifying ? (
                <i className="fa-solid fa-circle-notch animate-spin"></i>
              ) : (
                <i className="fa-solid fa-arrow-right-to-bracket"></i>
              )}
              <span>دخول</span>
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
