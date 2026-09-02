import React, { useState } from "react";
import { RtgLogo } from "./RtgLogo";
import { StoreSubscriber } from "../types";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (
    licenseKey: string,
    scriptUrl: string,
    shopName: string,
    email: string,
    subscriber?: StoreSubscriber
  ) => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  subscribers?: StoreSubscriber[];
  masterScriptUrl?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  showToast,
  subscribers = [],
  masterScriptUrl = "",
}) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleLogin = () => {
    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      showToast("يرجى إدخال كود المتجر أو اسم المستخدم", "error");
      setErrorMessage("يرجى كتابة كود المتجر أو اسم المستخدم للمتابعة");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    // 1. Check local subscribers list
    const foundSub = subscribers.find(
      (s) =>
        s.storeCode.toUpperCase() === cleanId.toUpperCase() ||
        s.username.toLowerCase() === cleanId.toLowerCase()
    );

    if (foundSub) {
      // Check password if set
      if (foundSub.password && cleanPass && foundSub.password !== cleanPass) {
        setLoading(false);
        setErrorMessage("كلمة المرور غير صحيحة، يرجى المحاولة مجدداً");
        showToast("كلمة المرور غير صحيحة", "error");
        return;
      }

      // Check status
      if (foundSub.status === "معلق") {
        setLoading(false);
        setErrorMessage("تم تعليق هذا المتجر مؤقتاً، يرجى التواصل مع الإدارة: 0934590635");
        showToast("حساب المتجر معلق حالياً", "error");
        return;
      }

      // Check expiration date
      if (foundSub.endDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const end = new Date(foundSub.endDate);
        end.setHours(23, 59, 59, 999);

        if (end.getTime() < today.getTime()) {
          setLoading(false);
          setErrorMessage(
            `انتهت صلاحية اشتراك المتجر بتاريخ (${foundSub.endDate}). يرجى التواصل مع الإدارة للتجديد: 0934590635`
          );
          showToast("عذراً، اشتراك المتجر منتهي الصلاحية", "error");
          return;
        }
      }

      // Success with subscriber record
      setTimeout(() => {
        setLoading(false);
        onSuccess(
          foundSub.storeCode,
          foundSub.cloudUrl || masterScriptUrl,
          foundSub.storeName,
          foundSub.username,
          foundSub
        );
        showToast(`مرحباً بك مجدداً في ${foundSub.storeName} ✓`, "success");
      }, 500);
      return;
    }

    // 2. Support quick demo / test keys locally
    if (
      cleanId.toUpperCase().includes("DEMO") ||
      cleanId.toUpperCase().includes("RTG") ||
      cleanId.toUpperCase().includes("VIP") ||
      cleanId === "123456"
    ) {
      setTimeout(() => {
        setLoading(false);
        onSuccess(
          cleanId.toUpperCase(),
          masterScriptUrl ||
            "https://script.google.com/macros/s/AKfycbxK9GGz87EzNCezo_Smm8If_wpVLTZ1UrlE-JDRkPQOwFaQVGkurxM_oj-8WE-BHMNc8Q/exec",
          `متجر ${cleanId.toUpperCase()}`,
          cleanId
        );
        showToast("✓ تم تفعيل المنظومة بنجاح!", "success");
      }, 600);
      return;
    }

    // 3. Remote check via Master Apps Script (if URL is set)
    if (masterScriptUrl) {
      const callbackName = "onLicenseChecked_" + Date.now();
      const script = document.createElement("script");
      const checkUrl = `${masterScriptUrl}?action=checkLicense&key=${encodeURIComponent(
        cleanId
      )}&password=${encodeURIComponent(cleanPass)}&callback=${callbackName}`;
      script.src = checkUrl;
      script.id = callbackName;

      const timeoutId = setTimeout(() => {
        if (document.getElementById(callbackName)) {
          document.getElementById(callbackName)?.remove();
        }
        setLoading(false);
        setErrorMessage("تعذر التحقق من الخادم، تأكد من كود المتجر وكلمة المرور");
        showToast("تعذر التحقق من الاشتراك السحابي", "error");
      }, 4000);

      (window as unknown as Record<
        string,
        (res: { valid?: boolean; scriptUrl?: string; shopName?: string; message?: string }) => void
      >)[callbackName] = (response) => {
        clearTimeout(timeoutId);
        if (document.getElementById(callbackName)) {
          document.getElementById(callbackName)?.remove();
        }
        delete (window as unknown as Record<string, unknown>)[callbackName];
        setLoading(false);

        if (response && response.valid) {
          onSuccess(
            cleanId,
            response.scriptUrl || masterScriptUrl,
            response.shopName || `متجر ${cleanId}`,
            cleanId
          );
          showToast("مرحباً بك! تم التحقق من الترخيص السحابي بنجاح ✓", "success");
        } else {
          const msg = response?.message || "كود المتجر أو كلمة المرور غير صحيحة!";
          setErrorMessage(msg);
          showToast(msg, "error");
        }
      };

      document.body.appendChild(script);
      return;
    }

    // 4. If nothing matched and no master URL
    setLoading(false);
    setErrorMessage("كود المتجر أو اسم المستخدم غير مسجل في النظام. تواصل مع الإدارة للحصول على ترخيص.");
    showToast("بيانات الدخول غير مسجلة", "error");
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[56] flex items-center justify-center p-4 animate-fadeInUp" dir="rtl">
      <div className="bg-[#121725] rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-800 text-center space-y-4">
        <RtgLogo size="large" />
        <div>
          <h2 className="text-xl font-black text-white tracking-wide">RTG-SESTEM</h2>
          <p className="text-xs text-[#c5834e] mt-1 font-bold">بوابة تسجيل الدخول للمنظومة الذكية</p>
        </div>

        {/* Store Code or Username */}
        <div className="space-y-1 text-right">
          <label className="text-[11px] font-bold text-slate-400">
            كود المتجر أو اسم المستخدم *
          </label>
          <div className="relative">
            <i className="fa-solid fa-store text-slate-500 absolute right-3.5 top-3.5 text-sm"></i>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="مثال: RTG-8821 أو store1"
              className="w-full pr-10 pl-4 py-3 bg-[#0d111a] border border-slate-700 rounded-xl text-right font-mono text-white focus:border-[#c5834e] outline-none text-xs transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1 text-right">
          <label className="text-[11px] font-bold text-slate-400">
            كلمة المرور
          </label>
          <div className="relative">
            <i className="fa-solid fa-lock text-slate-500 absolute right-3.5 top-3.5 text-sm"></i>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="كلمة المرور الخاصة بحساب المتجر"
              className="w-full pr-10 pl-10 py-3 bg-[#0d111a] border border-slate-700 rounded-xl text-right font-mono text-white focus:border-[#c5834e] outline-none text-xs transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-3 text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
            >
              <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
            </button>
          </div>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full btn-brand-bronze font-bold py-3.5 rounded-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-[#c5834e]/20"
        >
          {loading ? (
            <>
              <i className="fa-solid fa-spinner fa-spin"></i> جاري التحقق من الحساب...
            </>
          ) : (
            <>
              <i className="fa-solid fa-arrow-right-to-bracket"></i> تسجيل الدخول للمتجر
            </>
          )}
        </button>

        {errorMessage && (
          <p className="text-xs text-rose-400 font-bold bg-rose-950/40 border border-rose-800/60 p-2.5 rounded-xl text-right leading-relaxed">
            <i className="fa-solid fa-triangle-exclamation ml-1"></i> {errorMessage}
          </p>
        )}

        <div className="border-t border-slate-800 pt-3 space-y-1.5">
          <p className="text-[10px] text-slate-400">الشهر الأول تجريبي ومجاني لجميع المشتركين الجدد ⚡</p>
          <a
            href="https://wa.me/218934590635"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <i className="fa-brands fa-whatsapp text-base"></i> تواصل مع الإدارة للتفعيل والتسجيل: 0934590635
          </a>
        </div>

        <button
          onClick={onClose}
          className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors pt-1 cursor-pointer block mx-auto"
        >
          <i className="fa-solid fa-arrow-right ml-1"></i> رجوع للصفحة الرئيسية
        </button>
      </div>
    </div>
  );
};
