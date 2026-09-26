import React, { useState } from "react";
import { RtgLogo } from "./RtgLogo";
import { StoreSubscriber, UserSession, StoreUser, StorePermission } from "../types";
import {
  normalizeScriptUrl,
  cloudGetSubscribers,
  fetchCloudData,
  cloudLoginEmployee,
} from "../services/cloudService";
import { DEFAULT_MASTER_SCRIPT_URL, saveSubscribers } from "../data/initialStores";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (
    licenseKey: string,
    scriptUrl: string,
    shopName: string,
    email: string,
    subscriber?: StoreSubscriber,
    userSession?: UserSession
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

  /**
   * Two-Tier Verification Logic:
   * Tier 1: Match Store Owner (Admin_Password in Master Sheet) -> Full Access + Users Management
   * Tier 2: Match Employee (Password in Client Sheet Users table) -> Dynamic Permissions
   */
  const verifyCredentialsForStore = async (
    sub: StoreSubscriber,
    cleanPass: string
  ): Promise<boolean> => {
    // 1. Check account suspension in Master Sheet
    if (sub.status === "معلق") {
      setLoading(false);
      setErrorMessage("تم تعليق حساب هذا المتجر مؤقتاً، يرجى التواصل مع الإدارة: 0934590635");
      showToast("حساب المتجر معلق حالياً", "error");
      return true;
    }

    // 2. Check subscription expiration date
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
        return true;
      }
    }

    const targetUrl = sub.cloudUrl
      ? normalizeScriptUrl(sub.cloudUrl).url
      : effectiveMasterUrl;
    const cleanId = identifier.trim();

    // ====================================================
    // TIER 1: Check Admin / Store Owner Password (100% full access)
    // ====================================================
    if (sub.password && cleanPass && sub.password === cleanPass) {
      setLoading(false);
      const adminSession: UserSession = {
        role: "admin",
        userTitle: sub.username ? `${sub.username} (المالك)` : "المالك / المدير العام",
        username: sub.username,
        permissions: ["pos", "orders", "inventory", "dashboard", "debts"],
        loginAt: new Date().toISOString(),
      };

      onSuccess(
        sub.storeCode,
        targetUrl,
        sub.storeName,
        sub.username,
        sub,
        adminSession
      );
      showToast(`✓ مرحباً بك مجدداً كمدير لمتجر ${sub.storeName}`, "success");
      return true;
    }

    // ====================================================
    // TIER 2: Check Employee Account in Client Sheet (Users table)
    // ====================================================
    // Check locally cached users first (for fast offline support)
    const cachedUsersRaw = localStorage.getItem("rtg_store_users");
    if (cachedUsersRaw) {
      try {
        const cachedUsers: StoreUser[] = JSON.parse(cachedUsersRaw);
        const localEmp = cachedUsers.find(
          (u) =>
            (u.username.toLowerCase() === sub.username.toLowerCase() ||
             u.userTitle.toLowerCase() === cleanId.toLowerCase() ||
             cleanId.toLowerCase() === sub.username.toLowerCase()) &&
            u.password === cleanPass
        );

        if (localEmp) {
          if (localEmp.status === "معلق") {
            setLoading(false);
            setErrorMessage("تم تعليق حساب هذا الموظف مؤقتاً، يرجى مراجعة إدارة المتجر");
            showToast("حساب هذا الموظف معلق مؤقتاً", "error");
            return true;
          }

          setLoading(false);
          const employeeSession: UserSession = {
            role: "employee",
            userTitle: localEmp.userTitle || "موظف",
            username: localEmp.userTitle || localEmp.username || cleanId,
            permissions: localEmp.permissions || ["pos"],
            loginAt: new Date().toISOString(),
          };

          onSuccess(
            sub.storeCode,
            targetUrl,
            sub.storeName,
            sub.username,
            sub,
            employeeSession
          );
          showToast(`✓ مرحباً بك يا ${localEmp.userTitle} في متجر ${sub.storeName}`, "success");
          return true;
        }
      } catch {}
    }

    // Query Client Sheet Live via cloudLoginEmployee
    if (targetUrl) {
      try {
        // Search by either store username or direct employee title
        const empRes = await cloudLoginEmployee(targetUrl, cleanId || sub.username, cleanPass);
        if (empRes && empRes.success && empRes.user) {
          if (empRes.user.status === "معلق") {
            setLoading(false);
            setErrorMessage("تم تعليق حساب هذا الموظف مؤقتاً، يرجى مراجعة إدارة المتجر");
            showToast("حساب هذا الموظف معلق مؤقتاً", "error");
            return true;
          }

          setLoading(false);
          const employeeSession: UserSession = {
            role: "employee",
            userTitle: empRes.user.userTitle || "موظف",
            username: empRes.user.userTitle || empRes.user.username || cleanId,
            permissions: empRes.user.permissions || ["pos"],
            loginAt: new Date().toISOString(),
          };

          onSuccess(
            sub.storeCode,
            targetUrl,
            sub.storeName,
            sub.username,
            sub,
            employeeSession
          );
          showToast(
            `✓ مرحباً بك يا ${empRes.user.userTitle} في متجر ${sub.storeName}`,
            "success"
          );
          return true;
        } else if (empRes && empRes.message && empRes.message.includes("معلق")) {
          setLoading(false);
          setErrorMessage(empRes.message);
          showToast(empRes.message, "error");
          return true;
        }
      } catch (err) {
        console.warn("Client sheet employee login error:", err);
      }
    }

    // If neither Admin nor Employee matched
    setLoading(false);
    setErrorMessage("بيانات الدخول غير صحيحة (يرجى التأكد من اسم المستخدم وكلمة المرور)");
    showToast("بيانات الدخول غير صحيحة", "error");
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

    if (!cleanPass) {
      showToast("يرجى إدخال كلمة المرور", "error");
      setErrorMessage("يرجى كتابة كلمة المرور للمتابعة");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    // Helper: Flexible store finder
    const matchStore = (s: StoreSubscriber, id: string) => {
      const normId = id.trim().toLowerCase();
      const normIdNoSpaces = normId.replace(/\s+/g, "");
      const normCode = (s.storeCode || "").trim().toLowerCase();
      const normUser = (s.username || "").trim().toLowerCase();
      const normUserNoSpaces = normUser.replace(/\s+/g, "");
      const normName = (s.storeName || "").trim().toLowerCase();

      return (
        normCode === normId ||
        normUser === normId ||
        normUserNoSpaces === normIdNoSpaces ||
        (normId.length >= 3 && normUser.startsWith(normId)) ||
        (normUser.length >= 3 && normId.startsWith(normUser)) ||
        normName === normId ||
        normName.includes(normId)
      );
    };

    // 0. Direct match: Check if identifier matches a direct employee title/name with matching password
    const cachedUsersRaw = localStorage.getItem("rtg_store_users");
    if (cachedUsersRaw) {
      try {
        const cachedUsers: StoreUser[] = JSON.parse(cachedUsersRaw);
        const directEmp = cachedUsers.find(
          (u) =>
            (u.userTitle.toLowerCase() === cleanId.toLowerCase() ||
             u.username.toLowerCase() === cleanId.toLowerCase()) &&
            u.password === cleanPass
        );
        if (directEmp) {
          if (directEmp.status === "معلق") {
            setLoading(false);
            setErrorMessage("تم تعليق حساب هذا الموظف مؤقتاً، يرجى مراجعة إدارة المتجر");
            showToast("حساب هذا الموظف معلق مؤقتاً", "error");
            return;
          }
          const matchedSub = subscribers.find((s) => s.username.toLowerCase() === directEmp.username.toLowerCase()) || subscribers[0];
          const employeeSession: UserSession = {
            role: "employee",
            userTitle: directEmp.userTitle || "موظف",
            username: directEmp.username,
            permissions: directEmp.permissions || ["pos"],
            loginAt: new Date().toISOString(),
          };
          setLoading(false);
          onSuccess(
            matchedSub?.storeCode || directEmp.username,
            matchedSub?.cloudUrl || localStorage.getItem("rtg_script_url") || "",
            matchedSub?.storeName || `متجر ${directEmp.username}`,
            directEmp.username,
            matchedSub || {
              id: "EMP-" + Date.now(),
              storeCode: directEmp.username,
              storeName: `متجر ${directEmp.username}`,
              username: directEmp.username,
              password: "",
              phone: "",
              cloudUrl: localStorage.getItem("rtg_script_url") || "",
              startDate: "",
              endDate: "",
              plan: "شهري",
              status: "نشط",
            },
            employeeSession
          );
          showToast(`✓ مرحباً بك يا ${directEmp.userTitle}`, "success");
          return;
        }
      } catch {}
    }

    // 1. Search local subscribers list
    let foundSub = subscribers.find((s) => matchStore(s, cleanId));

    if (foundSub) {
      const handled = await verifyCredentialsForStore(foundSub, cleanPass);
      if (handled) return;
    }

    // 2. Query Central Master Cloud live
    if (effectiveMasterUrl) {
      try {
        const freshSubs = await cloudGetSubscribers(effectiveMasterUrl);
        if (freshSubs && freshSubs.length > 0) {
          saveSubscribers(freshSubs);
          if (onSubscribersRefreshed) {
            onSubscribersRefreshed(freshSubs);
          }
          foundSub = freshSubs.find((s) => matchStore(s, cleanId));
          if (foundSub) {
            const handled = await verifyCredentialsForStore(foundSub, cleanPass);
            if (handled) return;
          }
        }
      } catch (err) {
        console.warn("Live cloud check fallback to JSONP", err);
      }

      // 3. Remote check via checkLicense (Supports Two-Tier Master & Employee Login)
      try {
        const response = await fetchCloudData<{
          valid?: boolean;
          role?: "admin" | "employee";
          isOwner?: boolean;
          userTitle?: string;
          permissions?: StorePermission[] | string;
          user?: StoreUser;
          storeFound?: boolean;
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
        }>(effectiveMasterUrl, "checkLicense", { key: cleanId, username: cleanId, password: cleanPass });

        if (response && response.valid) {
          setLoading(false);
          const rawUrl = response.cloudUrl || response.scriptUrl || "";
          const targetUrl = rawUrl ? normalizeScriptUrl(rawUrl).url : effectiveMasterUrl;
          const storeName = response.storeName || response.shopName || `متجر ${cleanId}`;
          const storeCode = response.storeCode || cleanId;
          const username = response.username || cleanId;

          const remoteSub: StoreSubscriber = {
            id: "REMOTE-" + Date.now(),
            storeCode,
            storeName,
            username,
            password: response.role === "admin" ? cleanPass : "",
            phone: "",
            cloudUrl: targetUrl,
            startDate: response.startDate || "",
            endDate: response.endDate || "",
            plan: response.plan || "شهري",
            status: "نشط",
          };

          // Employee login verified by Master Cloud Server
          if (response.role === "employee") {
            let rawPerms = response.permissions || (response.user && response.user.permissions);
            let perms: StorePermission[] = ["pos"];
            if (Array.isArray(rawPerms)) {
              perms = rawPerms as StorePermission[];
            } else if (typeof rawPerms === "string") {
              try { perms = JSON.parse(rawPerms); } catch { perms = ["pos"]; }
            }

            const employeeSession: UserSession = {
              role: "employee",
              userTitle: response.userTitle || (response.user && response.user.userTitle) || "موظف مبيعات",
              username: response.userTitle || (response.user && response.user.userTitle) || cleanId,
              permissions: perms.length > 0 ? perms : ["pos"],
              loginAt: new Date().toISOString(),
            };

            onSuccess(
              storeCode,
              targetUrl,
              storeName,
              username,
              remoteSub,
              employeeSession
            );
            showToast(`✓ مرحباً بك يا ${employeeSession.userTitle} في متجر ${storeName}`, "success");
            return;
          }

          // Admin / Owner login
          const adminSession: UserSession = {
            role: "admin",
            userTitle: "المالك / المدير العام",
            username,
            permissions: ["pos", "orders", "inventory", "dashboard", "debts"],
            loginAt: new Date().toISOString(),
          };

          onSuccess(
            storeCode,
            targetUrl,
            storeName,
            username,
            remoteSub,
            adminSession
          );
          showToast(`مرحباً بك! تم التحقق من اشتراك ${storeName} بنجاح ✓`, "success");
          return;
        }

        // Direct store verification fallback if Master Server identified store with cloudUrl
        if (response && response.storeFound && (response.cloudUrl || response.scriptUrl)) {
          const rawUrl = response.cloudUrl || response.scriptUrl || "";
          const targetUrl = rawUrl ? normalizeScriptUrl(rawUrl).url : "";
          if (targetUrl) {
            try {
              const empRes = await cloudLoginEmployee(targetUrl, response.username || cleanId, cleanPass);
              if (empRes && empRes.success && empRes.user) {
                setLoading(false);
                const storeName = response.storeName || `متجر ${cleanId}`;
                const storeCode = response.storeCode || cleanId;
                const username = response.username || cleanId;

                const remoteSub: StoreSubscriber = {
                  id: "REMOTE-" + Date.now(),
                  storeCode,
                  storeName,
                  username,
                  password: "",
                  phone: "",
                  cloudUrl: targetUrl,
                  startDate: response.startDate || "",
                  endDate: response.endDate || "",
                  plan: response.plan || "شهري",
                  status: "نشط",
                };

                const employeeSession: UserSession = {
                  role: "employee",
                  userTitle: empRes.user.userTitle || "موظف",
                  username,
                  permissions: empRes.user.permissions || ["pos"],
                  loginAt: new Date().toISOString(),
                };

                onSuccess(
                  storeCode,
                  targetUrl,
                  storeName,
                  username,
                  remoteSub,
                  employeeSession
                );
                showToast(
                  `✓ مرحباً بك يا ${empRes.user.userTitle} في متجر ${storeName}`,
                  "success"
                );
                return;
              } else if (empRes && empRes.message && empRes.message.includes("معلق")) {
                setLoading(false);
                setErrorMessage(empRes.message);
                showToast(empRes.message, "error");
                return;
              }
            } catch (empErr) {
              console.warn("Client fallback employee login error:", empErr);
            }
          }
        }

        if (response && response.message) {
          setLoading(false);
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
    <div className="fixed inset-0 bg-[#121418]/90 backdrop-blur-md z-[56] flex items-center justify-center p-4 animate-fadeInUp" dir="rtl">
      <div className="bg-[#121418] rounded-3xl p-6 w-full max-w-md shadow-2xl border border-[#2c323f] text-center space-y-4">
        <RtgLogo size="large" />
        <div>
          <h2 className="text-xl font-black text-white tracking-wide">RTG-SESTEM</h2>
          <p className="text-xs text-[#c5834e] mt-1 font-bold">بوابة تسجيل الدخول للمنظومة الذكية</p>
        </div>

        {/* Store Code or Username */}
        <div className="space-y-1 text-right">
          <label className="text-xs font-bold text-slate-300">
            اسم المستخدم أو كود المتجر
          </label>
          <div className="relative">
            <i className="fa-solid fa-user text-slate-500 absolute right-3.5 top-3.5 text-sm"></i>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="أدخل اسم المستخدم أو كود المتجر"
              className="w-full pr-10 pl-4 py-3 bg-[#181c22] border border-[#2c323f] rounded-xl text-right font-medium text-white focus:border-[#c5834e] outline-none text-xs transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1 text-right">
          <label className="text-xs font-bold text-slate-300">
            كلمة المرور
          </label>
          <div className="relative">
            <i className="fa-solid fa-lock text-slate-500 absolute right-3.5 top-3.5 text-sm"></i>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="أدخل كلمة المرور"
              className="w-full pr-10 pl-10 py-3 bg-[#181c22] border border-[#2c323f] rounded-xl text-right font-medium text-white focus:border-[#c5834e] outline-none text-xs transition-all"
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

        <div className="border-t border-[#2c323f] pt-3 space-y-1.5">
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
