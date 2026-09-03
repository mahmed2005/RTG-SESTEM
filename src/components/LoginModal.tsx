import React, { useState } from "react";
import { RtgLogo } from "./RtgLogo";
import { StoreSubscriber } from "../types";
import { normalizeScriptUrl, cloudGetSubscribers, fetchCloudData } from "../services/cloudService";
import { DEFAULT_MASTER_SCRIPT_URL, saveSubscribers } from "../data/initialStores";

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
  onSubscribersRefreshed?: (subs: StoreSubscriber[]) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  showToast,
  subscribers = [],
  masterScriptUrl = "",
  onSubscribersRefreshed,
}) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const effectiveMasterUrl = (masterScriptUrl && masterScriptUrl.trim()) || DEFAULT_MASTER_SCRIPT_URL;

  const verifyAndProceed = (sub: StoreSubscriber, cleanPass: string): boolean => {
    // Check password if set
    if (sub.password && cleanPass && sub.password !== cleanPass) {
      setLoading(false);
      setErrorMessage("كلمة المرور غير صحيحة، يرجى التأكد من كلمة المرور الخاصة بحسابك");
      showToast("كلمة المرور غير صحيحة", "error");
      return false;
    }

    // Check account status
    if (sub.status === "معلق") {
      setLoading(false);
      setErrorMessage("تم تعليق حساب هذا المتجر مؤقتاً، يرجى التواصل مع الإدارة: 0934590635");
      showToast("حساب المتجر معلق حالياً", "error");
      return false;
    }

    // Check subscription expiration date
    if (sub.endDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const end = new Date(sub.endDate);
      end.setHours(23, 59, 59, 999);

      if (end.getTime() < today.getTime()) {
        setLoading(false);
        setErrorMessage(
          `انتهت صلاحية اشتراك المتجر بتاريخ (${sub.endDate}). يرجى التواصل مع الإدارة للتجديد: 0934590635`
        );
        showToast("عذراً، اشتراك المتجر منتهي الصلاحية", "error");
        return false;
      }
    }

    // Success
    setLoading(false);
    const targetUrl = sub.cloudUrl
      ? normalizeScriptUrl(sub.cloudUrl).url
      : effectiveMasterUrl;

    onSuccess(
      sub.storeCode,
      targetUrl,
      sub.storeName,
      sub.username,
      sub
    );
    showToast(`مرحباً بك مجدداً في ${sub.storeName} ✓`, "success");
    return true;
  };

  const handleLogin = async () => {
    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      showToast("يرجى إدخال كود المتجر أو اسم المستخدم", "error");
      setErrorMessage("يرجى كتابة كود المتجر أو اسم المستخدم للمتابعة");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    // 1. Check local subscribers database first
    let foundSub = subscribers.find(
      (s) =>
        s.storeCode.toUpperCase() === cleanId.toUpperCase() ||
        s.username.toLowerCase() === cleanId.toLowerCase()
    );

    if (foundSub) {
      // If password matches or user didn't change it, verify immediately
      if (!foundSub.password || !cleanPass || foundSub.password === cleanPass) {
        if (verifyAndProceed(foundSub, cleanPass)) return;
      }
    }

    // 2. Query Central Cloud live via cloudGetSubscribers
    if (effectiveMasterUrl) {
      try {
        const freshSubs = await cloudGetSubscribers(effectiveMasterUrl);
        if (freshSubs && freshSubs.length > 0) {
          saveSubscribers(freshSubs);
          if (onSubscribersRefreshed) {
            onSubscribersRefreshed(freshSubs);
          }
          foundSub = freshSubs.find(
            (s) =>
              s.storeCode.toUpperCase() === cleanId.toUpperCase() ||
              s.username.toLowerCase() === cleanId.toLowerCase()
          );
          if (foundSub) {
            if (verifyAndProceed(foundSub, cleanPass)) return;
            return;
          }
        }
      } catch (err) {
        console.warn("Live cloud check fallback to JSONP", err);
      }

      // 3. Remote check via checkLicense action
      try {
        const response = await fetchCloudData<{
          valid?: boolean;
          cloudUrl?: string;
          scriptUrl?: string;
          storeName?: string;
          shopName?: string;
          storeCode?: string;
          username?: string;
          startDate?: string;
          endDate?: string;
          plan?: string;
          message?: string;
        }>(effectiveMasterUrl, "checkLicense", { key: cleanId, password: cleanPass });

        setLoading(false);

        if (response && response.valid) {
          const rawUrl = response.cloudUrl || response.scriptUrl || "";
          const targetUrl = rawUrl ? normalizeScriptUrl(rawUrl).url : effectiveMasterUrl;
          const storeName = response.storeName || response.shopName || `متجر ${cleanId}`;
          const storeCode = response.storeCode || cleanId;
          const username = response.username || cleanId;

          onSuccess(
            storeCode,
            targetUrl,
            storeName,
            username,
            {
              id: "REMOTE-" + Date.now(),
              storeCode,
              storeName,
              username,
              cloudUrl: targetUrl,
              startDate: response.startDate || "",
              endDate: response.endDate || "",
              plan: response.plan || "شهري",
              status: "نشط",
            }
          );
          showToast(`مرحباً بك! تم التحقق من اشتراك ${storeName} بنجاح ✓`, "success");
          return;
        } else if (response && response.message) {
          setErrorMessage(response.message);
          showToast(response.message, "error");
          return;
        }
      } catch {
        setLoading(false);
        setErrorMessage("تعذر الاتصال بالخادم السحابي");
        showToast("تعذر الاتصال بالخادم السحابي", "error");
        return;
      }
    }

    setLoading(false);
    setErrorMessage(
      "بيانات الدخول غير مسجلة في قاعدة بيانات المشتركين. يرجى التأكد من اسم المستخدم وكلمة المرور."
    );
    showToast("الحساب غير مسجل في المنظومة", "error");
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
