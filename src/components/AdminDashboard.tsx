import React, { useState, useMemo } from "react";
import { StoreSubscriber } from "../types";
import { RtgLogo } from "./RtgLogo";
import {
  MASTER_SUBSCRIPTIONS_SCRIPT_CODE,
  STORE_ENGINE_SCRIPT_CODE,
} from "../data/appsScriptTemplates";
import { cloudGetSubscribers, normalizeScriptUrl } from "../services/cloudService";

interface AdminDashboardProps {
  subscribers: StoreSubscriber[];
  onAddSubscriber: (sub: StoreSubscriber) => void;
  onUpdateSubscriber: (id: string, sub: StoreSubscriber) => void;
  onDeleteSubscriber: (id: string, storeCode?: string, username?: string) => void;
  onSyncSubscribers?: (subs: StoreSubscriber[]) => void;
  onLoginAsStore: (sub: StoreSubscriber) => void;
  onClose: () => void;
  adminPassword: string;
  onChangeAdminPassword: (newPass: string) => void;
  masterScriptUrl: string;
  onSaveMasterScriptUrl: (url: string) => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  subscribers,
  onAddSubscriber,
  onUpdateSubscriber,
  onDeleteSubscriber,
  onSyncSubscribers,
  onLoginAsStore,
  onClose,
  adminPassword,
  onChangeAdminPassword,
  masterScriptUrl,
  onSaveMasterScriptUrl,
  showToast,
}) => {
  // Navigation tabs inside Admin Panel
  const [activeAdminTab, setActiveAdminTab] = useState<"stores" | "cloud" | "settings">("stores");

  // Search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreSubscriber | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Add Form State
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreCode, setNewStoreCode] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newCloudUrl, setNewCloudUrl] = useState("");
  const [newPlan, setNewPlan] = useState<"تجريبي" | "شهري" | "سنوي" | "دائم VIP">("شهري");
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [newEndDate, setNewEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split("T")[0];
  });
  const [newNotes, setNewNotes] = useState("");

  // Master Script URL input state
  const [masterUrlInput, setMasterUrlInput] = useState(masterScriptUrl);
  const [testingMaster, setTestingMaster] = useState(false);
  const [masterStatus, setMasterStatus] = useState<string | null>(null);

  // Admin Password Edit state
  const [currPassInput, setCurrPassInput] = useState("");
  const [newPassInput, setNewPassInput] = useState("");
  const [confirmPassInput, setConfirmPassInput] = useState("");

  // Code Viewer state in Cloud Tab
  const [activeScriptView, setActiveScriptView] = useState<"master" | "store">("master");

  // Helper to calculate days remaining
  const calculateDaysRemaining = (endDateStr: string): number => {
    if (!endDateStr) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);
    const diff = end.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Filtered Subscribers
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((sub) => {
      const days = calculateDaysRemaining(sub.endDate);
      const isExpiringSoon = days >= 0 && days <= 7;
      const isExpired = days < 0;

      // Filter by status dropdown
      if (statusFilter === "active" && (sub.status !== "نشط" || isExpired)) return false;
      if (statusFilter === "expiring" && (!isExpiringSoon || sub.status !== "نشط")) return false;
      if (statusFilter === "expired" && (!isExpired && sub.status !== "منتهي الصلاحية")) return false;
      if (statusFilter === "suspended" && sub.status !== "معلق") return false;

      // Search match
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        sub.storeName.toLowerCase().includes(q) ||
        sub.storeCode.toLowerCase().includes(q) ||
        sub.username.toLowerCase().includes(q) ||
        sub.phone.includes(q)
      );
    });
  }, [subscribers, searchTerm, statusFilter]);

  // Key stats
  const stats = useMemo(() => {
    let activeCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;

    subscribers.forEach((s) => {
      const days = calculateDaysRemaining(s.endDate);
      if (days < 0 || s.status === "منتهي الصلاحية") {
        expiredCount++;
      } else if (days <= 7 && s.status === "نشط") {
        expiringCount++;
        activeCount++;
      } else if (s.status === "نشط") {
        activeCount++;
      }
    });

    return {
      total: subscribers.length,
      active: activeCount,
      expiring: expiringCount,
      expired: expiredCount,
    };
  }, [subscribers]);

  // Generate random store credentials
  const generateRandomCode = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `RTG-${randomNum}`;
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let res = "";
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  // Open Add Modal with fresh defaults
  const handleOpenAdd = () => {
    const generatedCode = generateRandomCode();
    setNewStoreName("");
    setNewStoreCode(generatedCode);
    setNewUsername(`store_${generatedCode.toLowerCase().replace("-", "")}`);
    setNewPassword(generateRandomPassword());
    setNewPhone("");
    setNewCloudUrl("");
    setNewPlan("شهري");
    const today = new Date().toISOString().split("T")[0];
    setNewStartDate(today);

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setNewEndDate(nextMonth.toISOString().split("T")[0]);

    setNewNotes("");
    setIsAddOpen(true);
  };

  // Handle plan change to auto-calculate end date
  const handlePlanChange = (plan: "تجريبي" | "شهري" | "سنوي" | "دائم VIP") => {
    setNewPlan(plan);
    const d = new Date(newStartDate || new Date());
    if (plan === "تجريبي") {
      d.setDate(d.getDate() + 30);
    } else if (plan === "شهري") {
      d.setMonth(d.getMonth() + 1);
    } else if (plan === "سنوي") {
      d.setFullYear(d.getFullYear() + 1);
    } else if (plan === "دائم VIP") {
      d.setFullYear(d.getFullYear() + 10);
    }
    setNewEndDate(d.toISOString().split("T")[0]);
  };

  // Submit Add Form
  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) {
      showToast("يرجى إدخال اسم المتجر", "error");
      return;
    }
    if (!newStoreCode.trim()) {
      showToast("يرجى إدخال كود المتجر / مفتاح الترخيص", "error");
      return;
    }

    const cleanCode = newStoreCode.trim().toUpperCase();
    if (subscribers.some((s) => s.storeCode.toUpperCase() === cleanCode)) {
      showToast(`كود المتجر (${cleanCode}) مسجل مسبقاً!`, "error");
      return;
    }

    const { url: cleanCloudUrl, warning } = normalizeScriptUrl(newCloudUrl.trim());
    if (warning) {
      showToast(warning, "error", 8000);
    }

    const newSub: StoreSubscriber = {
      id: `STORE-${Date.now().toString().slice(-5)}`,
      storeCode: cleanCode,
      username: newUsername.trim() || `store_${cleanCode.toLowerCase()}`,
      password: newPassword.trim() || "123456",
      storeName: newStoreName.trim(),
      phone: newPhone.trim(),
      cloudUrl: cleanCloudUrl,
      startDate: newStartDate,
      endDate: newEndDate,
      plan: newPlan,
      status: "نشط",
      notes: newNotes.trim(),
      createdAt: new Date().toISOString().split("T")[0],
    };

    onAddSubscriber(newSub);
    setIsAddOpen(false);
    showToast(`✓ تم تسجيل "${newSub.storeName}" بنجاح في المنظومة`, "success");

    // Copy welcome card for WhatsApp
    handleCopyCredentials(newSub);
  };

  // Edit Store Submit
  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStore) return;

    const { url: cleanCloudUrl, warning } = normalizeScriptUrl(editingStore.cloudUrl || "");
    if (warning) {
      showToast(warning, "error", 8000);
    }

    const updatedSub: StoreSubscriber = {
      ...editingStore,
      storeCode: editingStore.storeCode.trim().toUpperCase(),
      cloudUrl: cleanCloudUrl,
    };

    onUpdateSubscriber(editingStore.id, updatedSub);
    setEditingStore(null);
    showToast(`✓ تم تحديث بيانات "${editingStore.storeName}" بنجاح`, "success");
  };

  // Quick Renewal (+1 month or +1 year)
  const handleQuickRenew = (sub: StoreSubscriber, monthsToAdd: number) => {
    const currentEnd = new Date(sub.endDate);
    const baseDate = isNaN(currentEnd.getTime()) || currentEnd < new Date() ? new Date() : currentEnd;
    baseDate.setMonth(baseDate.getMonth() + monthsToAdd);
    const newEndStr = baseDate.toISOString().split("T")[0];

    const updated: StoreSubscriber = {
      ...sub,
      endDate: newEndStr,
      status: "نشط",
    };

    onUpdateSubscriber(sub.id, updated);
    showToast(`✓ تم تمديد اشتراك "${sub.storeName}" حتى ${newEndStr}`, "success");
  };

  // Toggle Suspend / Activate
  const handleToggleStatus = (sub: StoreSubscriber) => {
    const nextStatus = sub.status === "نشط" ? "معلق" : "نشط";
    onUpdateSubscriber(sub.id, { ...sub, status: nextStatus });
    showToast(`تم تغيير حالة متجر "${sub.storeName}" إلى: (${nextStatus})`, "info");
  };

  // Copy Store Credentials to WhatsApp Ready Format
  const handleCopyCredentials = (sub: StoreSubscriber) => {
    const text =
      `📋 *بيانات تفعيل واشتراك منظومة RTG-SESTEM*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🏬 *اسم المتجر:* ${sub.storeName}\n` +
      `🔑 *كود الترخيص:* ${sub.storeCode}\n` +
      `👤 *اسم المستخدم:* ${sub.username}\n` +
      `🔒 *كلمة المرور:* ${sub.password}\n` +
      `📅 *تاريخ البدء:* ${sub.startDate}\n` +
      `⏳ *تاريخ الانتهاء:* ${sub.endDate} (${sub.plan})\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🌐 *رابط الدخول للمنظومة:* ${window.location.origin}\n` +
      `⚡ *دعم فني واستفسارات:* 0934590635\n` +
      `شكراً لثقتكم بمنظومة RTG-SESTEM.`;

    navigator.clipboard.writeText(text);
    showToast("✓ تم نسخ بيانات الدخول المنسقة للواتساب!", "success");
  };

  // Cloud Sync state
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  // Sync Subscribers from Master Google Sheet
  const handleSyncSubscribersFromCloud = async () => {
    const url = masterUrlInput.trim() || masterScriptUrl.trim();
    if (!url) {
      showToast("يرجى إدخال وحفظ رابط الخادم المركزي أولاً من تبويب (الربط السحابي والأكواد)", "info");
      return;
    }

    setIsSyncingCloud(true);
    showToast("جاري جلب المشتركين من جدول جوجل شيت الرئيسي...", "info");

    try {
      const liveStores = await cloudGetSubscribers(url);
      if (liveStores && Array.isArray(liveStores)) {
        if (onSyncSubscribers) {
          onSyncSubscribers(liveStores);
        }
        showToast(`✓ تم استلام وتحديث (${liveStores.length}) مشترك من جوجل شيت بنجاح!`, "success", 4000);
      } else {
        showToast("تعذر استلام البيانات، تأكد من صحة الرابط ونشره كـ Web App مع صلاحية Anyone", "error", 5000);
      }
    } catch (e) {
      console.error("Cloud subscribers sync error:", e);
      showToast("حدث خطأ أثناء الاتصال بالخادم المركزي", "error");
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Test Master Script Connection
  const handleTestMasterScript = () => {
    const url = masterUrlInput.trim();
    if (!url) {
      showToast("يرجى إدخال رابط الخادم المركزي أولاً", "error");
      return;
    }

    setTestingMaster(true);
    setMasterStatus(null);
    showToast("جاري فحص الاتصال بالخادم المركزي...", "info");

    const callbackName = "onMasterPing_" + Date.now();
    const script = document.createElement("script");
    script.src = `${url}?action=getAllStores&callback=${callbackName}`;
    script.id = callbackName;

    const timeout = setTimeout(() => {
      if (document.getElementById(callbackName)) {
        document.getElementById(callbackName)?.remove();
      }
      setTestingMaster(false);
      setMasterStatus("failed");
      showToast("تعذر الاتصال بالخادم المركزي، تأكد من صحة الرابط والصلاحيات (Anyone)", "error");
    }, 5500);

    (window as unknown as Record<string, (res: unknown) => void>)[callbackName] = (data: any) => {
      clearTimeout(timeout);
      if (document.getElementById(callbackName)) {
        document.getElementById(callbackName)?.remove();
      }
      delete (window as unknown as Record<string, unknown>)[callbackName];
      setTestingMaster(false);
      setMasterStatus("success");
      onSaveMasterScriptUrl(url);

      // Auto update subscribers list if returned
      if (data && data.success && Array.isArray(data.stores) && onSyncSubscribers) {
        onSyncSubscribers(data.stores);
      }

      showToast("✓ الاتصال بالخادم المركزي نشط ومتصل 100%!", "success");
    };

    document.body.appendChild(script);
  };

  // Handle Save Master Script URL
  const handleSaveMasterUrl = () => {
    onSaveMasterScriptUrl(masterUrlInput.trim());
    showToast("✓ تم حفظ رابط الخادم المركزي بنجاح", "success");
  };

  // Handle Admin Password Change
  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currPassInput !== adminPassword) {
      showToast("كلمة المرور الحالية غير صحيحة", "error");
      return;
    }
    if (!newPassInput.trim() || newPassInput.length < 5) {
      showToast("كلمة المرور الجديدة يجب أن تكون 5 خانات على الأقل", "error");
      return;
    }
    if (newPassInput !== confirmPassInput) {
      showToast("كلمتا المرور غير متطابقتين", "error");
      return;
    }

    onChangeAdminPassword(newPassInput.trim());
    setCurrPassInput("");
    setNewPassInput("");
    setConfirmPassInput("");
    showToast("✓ تم تحديث كلمة مرور الأدمن بنجاح!", "success");
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#090d16] text-slate-100 flex flex-col font-['Tajawal',sans-serif] overflow-hidden" dir="rtl">
      {/* ======================= TOP ADMIN BAR ======================= */}
      <header className="bg-[#0e1422] border-b border-slate-800/90 px-4 sm:px-6 py-3 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c5834e]/30 to-[#121829] border border-[#c5834e]/40 flex items-center justify-center shadow-inner">
            <i className="fa-solid fa-shield-halved text-[#c5834e] text-lg"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-wide">
                لوحة الإدارة المركزية
              </h1>
              <span className="text-[10px] font-bold bg-[#c5834e]/20 text-[#c5834e] px-2 py-0.5 rounded-full border border-[#c5834e]/40">
                RTG-SESTEM MASTER
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              إدارة المشتركين والمتاجر والتراخيص ومحرك المزامنة السحابية
            </p>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleSyncSubscribersFromCloud}
            disabled={isSyncingCloud}
            className="px-3.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            title="جلب وتحديث بيانات المشتركين مباشرة من جدول جوجل شيت الرئيسي"
          >
            <i className={`fa-solid fa-cloud-arrow-down ${isSyncingCloud ? "fa-spin text-[#c5834e]" : "text-blue-400"}`}></i>
            <span className="hidden sm:inline">مزامنة سحابية</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 text-xs font-bold bg-[#c5834e] hover:bg-[#a6632f] text-white rounded-xl flex items-center gap-1.5 shadow-md shadow-[#c5834e]/20 cursor-pointer transition-all active:scale-95"
          >
            <i className="fa-solid fa-plus"></i>
            <span className="hidden sm:inline">إضافة متجر جديد</span>
          </button>

          <button
            onClick={onClose}
            className="px-3 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
            title="الخروج من لوحة الإدارة والعودة للصفحة الرئيسية"
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </header>

      {/* ======================= STATS BANNER ======================= */}
      <div className="bg-[#121829] border-b border-slate-800/80 px-4 sm:px-6 py-2.5 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-right">
          {/* Total */}
          <div className="bg-[#090d16]/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">إجمالي المتاجر</span>
              <span className="text-base font-black font-mono text-white">{stats.total}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs">
              <i className="fa-solid fa-store"></i>
            </div>
          </div>

          {/* Active */}
          <div className="bg-[#090d16]/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">المتاجر النشطة</span>
              <span className="text-base font-black font-mono text-emerald-400">{stats.active}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs">
              <i className="fa-solid fa-circle-check"></i>
            </div>
          </div>

          {/* Expiring Soon */}
          <div className="bg-[#090d16]/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">تنتهي خلال 7 أيام</span>
              <span className="text-base font-black font-mono text-amber-400">{stats.expiring}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs">
              <i className="fa-solid fa-clock"></i>
            </div>
          </div>

          {/* Expired */}
          <div className="bg-[#090d16]/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">اشتراكات منتهية</span>
              <span className="text-base font-black font-mono text-rose-400">{stats.expired}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center text-xs">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
          </div>
        </div>
      </div>

      {/* ======================= NAVIGATION TABS ======================= */}
      <div className="bg-[#0e1422] border-b border-slate-800 px-4 sm:px-6 flex gap-2 shrink-0">
        <button
          onClick={() => setActiveAdminTab("stores")}
          className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeAdminTab === "stores"
              ? "border-[#c5834e] text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <i className="fa-solid fa-users-gear text-[#c5834e]"></i>
          <span>المشتركون والمتاجر ({subscribers.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab("cloud")}
          className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeAdminTab === "cloud"
              ? "border-[#c5834e] text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <i className="fa-solid fa-cloud-arrow-up text-[#c5834e]"></i>
          <span>الربط السحابي ومحرك الأكواد</span>
        </button>

        <button
          onClick={() => setActiveAdminTab("settings")}
          className={`px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeAdminTab === "settings"
              ? "border-[#c5834e] text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <i className="fa-solid fa-gear text-[#c5834e]"></i>
          <span>إعدادات النظام والأمان</span>
        </button>
      </div>

      {/* ======================= MAIN BODY CONTENT ======================= */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* TAB 1: STORES & SUBSCRIBERS */}
        {activeAdminTab === "stores" && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="bg-[#121829] p-3 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <i className="fa-solid fa-magnifying-glass absolute right-3.5 top-3 text-slate-500 text-xs"></i>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث باسم المتجر، كود الترخيص، اسم المستخدم، أو رقم الهاتف..."
                  className="w-full pr-9 pl-4 py-2 bg-[#090d16] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-[#c5834e]"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-[#090d16] border border-slate-700/80 rounded-xl text-xs text-slate-200 outline-none focus:border-[#c5834e] cursor-pointer"
                >
                  <option value="all">كل الحالات ({subscribers.length})</option>
                  <option value="active">المتاجر النشطة</option>
                  <option value="expiring">تنتهي قريباً (خلال 7 أيام)</option>
                  <option value="expired">منتهية الصلاحية</option>
                  <option value="suspended">معلقة / موقوفة</option>
                </select>

                <button
                  onClick={handleOpenAdd}
                  className="px-3.5 py-2 text-xs font-bold bg-[#c5834e] hover:bg-[#a6632f] text-white rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <i className="fa-solid fa-plus"></i> إضافة متجر
                </button>
              </div>
            </div>

            {/* Stores Table */}
            <div className="bg-[#121829] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0e1422] text-slate-400 font-bold border-b border-slate-800">
                      <th className="py-3.5 px-4">كود المتجر / الترخيص</th>
                      <th className="py-3.5 px-4">اسم المتجر وبيانات الاتصال</th>
                      <th className="py-3.5 px-4">بيانات الدخول</th>
                      <th className="py-3.5 px-4 text-center">فترة الاشتراك والانتهاء</th>
                      <th className="py-3.5 px-4 text-center">الخادم السحابي</th>
                      <th className="py-3.5 px-4 text-center">الحالة</th>
                      <th className="py-3.5 px-4 text-center">إجراءات الإدارة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredSubscribers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          <i className="fa-solid fa-store-slash text-3xl mb-2 block opacity-40"></i>
                          لا توجد متاجر تطابق البحث أو الفلتر المحدد.
                        </td>
                      </tr>
                    ) : (
                      filteredSubscribers.map((sub) => {
                        const daysLeft = calculateDaysRemaining(sub.endDate);
                        const isExpired = daysLeft < 0 || sub.status === "منتهي الصلاحية";
                        const isExpiringSoon = daysLeft >= 0 && daysLeft <= 7;
                        const showPass = !!showPasswordMap[sub.id];

                        return (
                          <tr
                            key={sub.id}
                            className="hover:bg-slate-800/40 transition-colors group"
                          >
                            {/* Store Code */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-white bg-[#090d16] px-2.5 py-1 rounded-lg border border-[#c5834e]/30 text-xs">
                                  {sub.storeCode}
                                </span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(sub.storeCode);
                                    showToast("تم نسخ كود الترخيص!", "success");
                                  }}
                                  title="نسخ كود الترخيص"
                                  className="text-slate-500 hover:text-[#c5834e] cursor-pointer"
                                >
                                  <i className="fa-solid fa-copy"></i>
                                </button>
                              </div>
                            </td>

                            {/* Store Name & Phone */}
                            <td className="py-3 px-4">
                              <div className="font-bold text-white text-xs">{sub.storeName}</div>
                              {sub.phone && (
                                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                  <i className="fa-solid fa-phone text-[10px] text-emerald-400"></i>
                                  <span className="font-mono">{sub.phone}</span>
                                </div>
                              )}
                              {sub.notes && (
                                <div className="text-[10px] text-slate-500 truncate max-w-[180px] mt-0.5">
                                  {sub.notes}
                                </div>
                              )}
                            </td>

                            {/* Credentials */}
                            <td className="py-3 px-4 font-mono text-[11px]">
                              <div className="text-slate-300">
                                <span className="text-slate-500 ml-1">يوزر:</span>
                                <span className="font-bold">{sub.username}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-slate-500">باسورد:</span>
                                <span className="font-bold text-[#c5834e]">
                                  {showPass ? sub.password : "••••••"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowPasswordMap((prev) => ({
                                      ...prev,
                                      [sub.id]: !prev[sub.id],
                                    }))
                                  }
                                  className="text-slate-500 hover:text-slate-300 cursor-pointer text-[10px]"
                                  title={showPass ? "إخفاء" : "إظهار"}
                                >
                                  <i className={`fa-solid ${showPass ? "fa-eye-slash" : "fa-eye"}`}></i>
                                </button>
                              </div>
                            </td>

                            {/* Subscription Duration */}
                            <td className="py-3 px-4 text-center">
                              <div className="font-mono text-xs font-bold text-slate-200">
                                {sub.endDate}
                              </div>
                              <div className="text-[10px] mt-1">
                                {isExpired ? (
                                  <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                    انتهى منذ {Math.abs(daysLeft)} يوم
                                  </span>
                                ) : isExpiringSoon ? (
                                  <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                    متبقي {daysLeft} أيام فقط
                                  </span>
                                ) : (
                                  <span className="text-emerald-400 font-mono">
                                    متبقي {daysLeft} يوم ({sub.plan})
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Cloud Sync URL */}
                            <td className="py-3 px-4 text-center">
                              {sub.cloudUrl ? (
                                <span
                                  title={sub.cloudUrl}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30"
                                >
                                  <i className="fa-solid fa-cloud-check"></i> متصل
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                                  <i className="fa-solid fa-laptop"></i> محلي
                                </span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  sub.status === "نشط" && !isExpired
                                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                    : isExpired
                                    ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                    : "bg-slate-700/40 text-slate-400 border-slate-700"
                                }`}
                              >
                                {isExpired ? "منتهي الصلاحية" : sub.status}
                              </span>
                            </td>

                            {/* Action Controls */}
                            <td className="py-3 px-4">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                {/* Login as Store */}
                                <button
                                  onClick={() => onLoginAsStore(sub)}
                                  title="تسجيل الدخول المباشر كمتجر لمعاينة نظامه"
                                  className="px-2 py-1 text-xs font-bold bg-[#c5834e] hover:bg-[#a6632f] text-white rounded-lg cursor-pointer transition-all active:scale-95 shadow-sm"
                                >
                                  <i className="fa-solid fa-arrow-right-to-bracket ml-1"></i> دخول
                                </button>

                                {/* Copy WhatsApp Credentials */}
                                <button
                                  onClick={() => handleCopyCredentials(sub)}
                                  title="نسخ بيانات الدخول كرسالة واتساب منسقة"
                                  className="px-2 py-1 text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg border border-emerald-500/30 cursor-pointer transition-all"
                                >
                                  <i className="fa-brands fa-whatsapp"></i> بيانات
                                </button>

                                {/* Quick Renew +1 Month */}
                                <button
                                  onClick={() => handleQuickRenew(sub, 1)}
                                  title="تجديد الاشتراك + شهر واحد"
                                  className="px-2 py-1 text-[11px] font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 cursor-pointer"
                                >
                                  + شهر
                                </button>

                                {/* Edit Store */}
                                <button
                                  onClick={() => setEditingStore({ ...sub })}
                                  title="تعديل تفاصيل المتجر"
                                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 cursor-pointer"
                                >
                                  <i className="fa-solid fa-pen-to-square"></i>
                                </button>

                                {/* Suspend / Activate */}
                                <button
                                  onClick={() => handleToggleStatus(sub)}
                                  title={sub.status === "نشط" ? "إيقاف مؤقت" : "تفعيل الحساب"}
                                  className={`p-1.5 rounded-lg border cursor-pointer ${
                                    sub.status === "نشط"
                                      ? "text-amber-400 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20"
                                      : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20"
                                  }`}
                                >
                                  <i className={`fa-solid ${sub.status === "نشط" ? "fa-pause" : "fa-play"}`}></i>
                                </button>

                                {/* Delete Store */}
                                <button
                                  onClick={() => setDeleteConfirmId(sub.id)}
                                  title="حذف المتجر من المنظومة"
                                  className="p-1.5 text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 rounded-lg border border-rose-500/30 cursor-pointer transition-colors"
                                >
                                  <i className="fa-solid fa-trash-can"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CLOUD ENGINE & APPS SCRIPTS */}
        {activeAdminTab === "cloud" && (
          <div className="space-y-6">
            {/* Master Server URL Config */}
            <div className="bg-[#121829] p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#c5834e]/20 text-[#c5834e] flex items-center justify-center">
                    <i className="fa-solid fa-server text-base"></i>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">رابط الخادم السحابي المركزي للمشتركين</h2>
                    <p className="text-[11px] text-slate-400">
                      هذا الرابط يربط تسجيل الدخول المركزي والتحقق من صلاحية التراخيص فورياً
                    </p>
                  </div>
                </div>

                {masterStatus === "success" && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                    <i className="fa-solid fa-circle-check"></i> متصل بنجاح
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={masterUrlInput}
                  onChange={(e) => setMasterUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-4 py-2.5 bg-[#090d16] border border-slate-700 rounded-xl font-mono text-xs text-white placeholder-slate-500 outline-none focus:border-[#c5834e]"
                />
                <button
                  type="button"
                  onClick={handleTestMasterScript}
                  disabled={testingMaster}
                  className="px-4 py-2.5 text-xs font-bold bg-[#c5834e] hover:bg-[#a6632f] text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {testingMaster ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin"></i> جاري الفحص...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-bolt"></i> فحص الاتصال وحفظ
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSaveMasterUrl}
                  className="px-4 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 cursor-pointer"
                >
                  حفظ فقط
                </button>
              </div>
            </div>

            {/* Architecture Explanation Card */}
            <div className="bg-[#121829] p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-circle-info text-[#c5834e]"></i>
                كيف يعمل النظام السحابي لمنظومة RTG-SESTEM؟
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                تحتاج فقط إلى <strong>ملفين اثنين سحابيين</strong> ليعمل كل شيء بأعلى كفاءة وأمان:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* File 1 */}
                <div className="bg-[#090d16] p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#c5834e]">
                    <span className="w-5 h-5 rounded-full bg-[#c5834e]/20 flex items-center justify-center text-[10px]">1</span>
                    الملف الأول: خادم المشتركين المركزي (Master Subscribers)
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    ملف واحد خاص بك كـ Admin، يحتوي على ورقة عمل باسم <strong>&quot;المشتركون&quot;</strong>.
                    يسجل فيه كود ترخيص كل مشترك، يوزره، باسورد، تاريخ البدء والانتهاء، ورابط خادم متجره الخاص.
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono bg-slate-900/80 p-2 rounded border border-slate-800">
                    العناوين: [كود المتجر] [اسم المستخدم] [كلمة المرور] [اسم المتجر] [الهاتف] [رابط الخادم الخاص] [تاريخ البدء] [تاريخ الانتهاء] [الباقة] [الحالة]
                  </div>
                </div>

                {/* File 2 */}
                <div className="bg-[#090d16] p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-10px">2</span>
                    الملف الثاني: قالب المتجر المنفرد (Store Engine Template)
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    ملف مستقل لكل متجر مشترك لضمان خصوصية بياناته 100%. تنشئه له بنسخ القالب، ويحتوي على 3 أوراق عمل:
                    <strong>&quot;المنتجات&quot;</strong> و <strong>&quot;الفواتير&quot;</strong> و <strong>&quot;الديون&quot;</strong>.
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono bg-slate-900/80 p-2 rounded border border-slate-800">
                    يتم تثبيت محرك المتجر الخاص به وتزويده برابط تطبيقه في لوحة الأدمن.
                  </div>
                </div>
              </div>
            </div>

            {/* Script Code Viewer & Copy Buttons */}
            <div className="bg-[#121829] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
              {/* Code Tab Switcher */}
              <div className="bg-[#0e1422] p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveScriptView("master")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeScriptView === "master"
                        ? "bg-[#c5834e] text-white shadow-sm"
                        : "bg-slate-800 text-slate-300 hover:text-white"
                    }`}
                  >
                    1. كود الخادم المركزي (Master Script)
                  </button>
                  <button
                    onClick={() => setActiveScriptView("store")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeScriptView === "store"
                        ? "bg-[#c5834e] text-white shadow-sm"
                        : "bg-slate-800 text-slate-300 hover:text-white"
                    }`}
                  >
                    2. كود محرك المتجر الخاص (Store Engine)
                  </button>
                </div>

                <button
                  onClick={() => {
                    const code =
                      activeScriptView === "master"
                        ? MASTER_SUBSCRIPTIONS_SCRIPT_CODE
                        : STORE_ENGINE_SCRIPT_CODE;
                    navigator.clipboard.writeText(code);
                    showToast("✓ تم نسخ كود السكريبت بالكامل بنجاح!", "success");
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                >
                  <i className="fa-solid fa-copy"></i>
                  <span>نسخ الكود البرمجي بالكامل</span>
                </button>
              </div>

              {/* Code Box */}
              <div className="p-4 bg-[#090d16] font-mono text-xs text-slate-300 overflow-x-auto max-h-[420px] select-all leading-relaxed whitespace-pre" dir="ltr">
                {activeScriptView === "master"
                  ? MASTER_SUBSCRIPTIONS_SCRIPT_CODE
                  : STORE_ENGINE_SCRIPT_CODE}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SETTINGS & MASTER SECURITY */}
        {activeAdminTab === "settings" && (
          <div className="max-w-xl mx-auto space-y-5">
            {/* Change Admin Password */}
            <div className="bg-[#121829] p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <div className="w-8 h-8 rounded-lg bg-[#c5834e]/20 text-[#c5834e] flex items-center justify-center text-sm">
                  <i className="fa-solid fa-key"></i>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">تغيير كلمة مرور الإدارة (Master Admin Password)</h3>
                  <p className="text-[11px] text-slate-400">
                    كلمة المرور المستخدمة للدخول عبر القفل السري في التذييل
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    كلمة المرور الحالية *
                  </label>
                  <input
                    type="password"
                    required
                    value={currPassInput}
                    onChange={(e) => setCurrPassInput(e.target.value)}
                    placeholder="أدخل كلمة المرور الحالية"
                    className="w-full px-3 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-[#c5834e]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    كلمة المرور الجديدة *
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassInput}
                    onChange={(e) => setNewPassInput(e.target.value)}
                    placeholder="كلمة مرور جديدة قوية"
                    className="w-full px-3 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-[#c5834e]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    تأكيد كلمة المرور الجديدة *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassInput}
                    onChange={(e) => setConfirmPassInput(e.target.value)}
                    placeholder="أعد كتابة كلمة المرور الجديدة"
                    className="w-full px-3 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-[#c5834e]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#c5834e] hover:bg-[#a6632f] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
                >
                  <i className="fa-solid fa-lock"></i> حفظ وتحديث كلمة المرور
                </button>
              </form>
            </div>

            {/* Quick System Info */}
            <div className="bg-[#121829] p-4 rounded-2xl border border-slate-800 text-xs space-y-2 text-slate-300">
              <div className="font-bold text-white flex items-center gap-1.5">
                <i className="fa-solid fa-shield text-[#c5834e]"></i> معلومات أمان منظومة RTG-SESTEM
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                يتم تشفير وحفظ بيانات التراخيص والمشتركين في الخوادم السحابية المشفرة مع دعم العمل حتى في حال انقطاع الإنترنت (Offline-First).
              </p>
              <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                رقم هاتف الدعم الفني للإدارة: <span className="font-mono text-emerald-400 font-bold">0934590635</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================= MODAL: ADD STORE ======================= */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeInUp">
          <div className="bg-[#121829] rounded-2xl border border-slate-800 p-5 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#c5834e]/20 text-[#c5834e] flex items-center justify-center">
                  <i className="fa-solid fa-store"></i>
                </div>
                <h3 className="text-sm font-bold text-white">تسجيل متجر جديد في المنظومة</h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="space-y-3.5">
              {/* Store Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  اسم المتجر *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="مثال: متجر النور للإلكترونيات"
                  className="w-full px-3 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-[#c5834e]"
                />
              </div>

              {/* Store Code / License Key */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  كود الترخيص / كود المتجر *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newStoreCode}
                    onChange={(e) => setNewStoreCode(e.target.value.toUpperCase())}
                    placeholder="مثال: RTG-8821"
                    className="flex-1 px-3 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs font-mono font-bold text-white outline-none focus:border-[#c5834e]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const code = generateRandomCode();
                      setNewStoreCode(code);
                      setNewUsername(`store_${code.toLowerCase().replace("-", "")}`);
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-slate-700 cursor-pointer"
                  >
                    توليد كود
                  </button>
                </div>
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    اسم المستخدم للدخول *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="username"
                    className="w-full px-3 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs font-mono text-white outline-none focus:border-[#c5834e]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    كلمة المرور *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="password"
                      className="w-full pr-3 pl-8 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs font-mono font-bold text-white outline-none focus:border-[#c5834e]"
                    />
                    <button
                      type="button"
                      onClick={() => setNewPassword(generateRandomPassword())}
                      title="توليد كلمة سر جديدة"
                      className="absolute left-2 top-2 text-slate-400 hover:text-[#c5834e] text-xs cursor-pointer"
                    >
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  رقم هاتف المتجر / واتساب
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="091XXXXXXX"
                  className="w-full px-3 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs font-mono text-white outline-none focus:border-[#c5834e]"
                />
              </div>

              {/* Plan & Dates */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    نوع الباقة *
                  </label>
                  <select
                    value={newPlan}
                    onChange={(e) =>
                      handlePlanChange(e.target.value as "تجريبي" | "شهري" | "سنوي" | "دائم VIP")
                    }
                    className="w-full px-2.5 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-[#c5834e] cursor-pointer"
                  >
                    <option value="تجريبي">شهر تجريبي</option>
                    <option value="شهري">اشتراك شهري</option>
                    <option value="سنوي">اشتراك سنوي</option>
                    <option value="دائم VIP">دائم VIP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    تاريخ البدء *
                  </label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs font-mono text-white outline-none focus:border-[#c5834e]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    تاريخ الانتهاء *
                  </label>
                  <input
                    type="date"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs font-mono text-white outline-none focus:border-[#c5834e]"
                  />
                </div>
              </div>

              {/* Cloud Sync URL */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  رابط الخادم السحابي الخاص بالمتجر (اختياري)
                </label>
                <input
                  type="url"
                  value={newCloudUrl}
                  onChange={(e) => setNewCloudUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs font-mono text-white outline-none focus:border-[#c5834e]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  ملاحظات
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="أي تفاصيل عن الدفع أو المتجر..."
                  className="w-full px-3 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-[#c5834e]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="submit"
                  className="bg-[#c5834e] hover:bg-[#a6632f] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                >
                  <i className="fa-solid fa-check"></i> حفظ وإصدار الترخيص
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs border border-slate-700 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: EDIT STORE ======================= */}
      {editingStore && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fadeInUp">
          <div className="bg-[#121829] rounded-2xl border border-slate-800 p-5 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#c5834e]/20 text-[#c5834e] flex items-center justify-center">
                  <i className="fa-solid fa-pen-to-square"></i>
                </div>
                <h3 className="text-sm font-bold text-white">تعديل بيانات المتجر: {editingStore.storeName}</h3>
              </div>
              <button
                onClick={() => setEditingStore(null)}
                className="text-slate-400 hover:text-white cursor-pointer p-1"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  اسم المتجر *
                </label>
                <input
                  type="text"
                  required
                  value={editingStore.storeName}
                  onChange={(e) => setEditingStore({ ...editingStore, storeName: e.target.value })}
                  className="w-full px-3 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-[#c5834e]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  كود الترخيص *
                </label>
                <input
                  type="text"
                  required
                  value={editingStore.storeCode}
                  onChange={(e) => setEditingStore({ ...editingStore, storeCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs font-mono font-bold text-white outline-none focus:border-[#c5834e]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    اسم المستخدم *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStore.username}
                    onChange={(e) => setEditingStore({ ...editingStore, username: e.target.value })}
                    className="w-full px-3 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs font-mono text-white outline-none focus:border-[#c5834e]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    كلمة المرور *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStore.password}
                    onChange={(e) => setEditingStore({ ...editingStore, password: e.target.value })}
                    className="w-full px-3 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs font-mono font-bold text-white outline-none focus:border-[#c5834e]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  رقم الهاتف
                </label>
                <input
                  type="text"
                  value={editingStore.phone}
                  onChange={(e) => setEditingStore({ ...editingStore, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs font-mono text-white outline-none focus:border-[#c5834e]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    نوع الباقة
                  </label>
                  <select
                    value={editingStore.plan}
                    onChange={(e) =>
                      setEditingStore({
                        ...editingStore,
                        plan: e.target.value as "تجريبي" | "شهري" | "سنوي" | "دائم VIP",
                      })
                    }
                    className="w-full px-2.5 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-[#c5834e] cursor-pointer"
                  >
                    <option value="تجريبي">شهر تجريبي</option>
                    <option value="شهري">اشتراك شهري</option>
                    <option value="سنوي">اشتراك سنوي</option>
                    <option value="دائم VIP">دائم VIP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    تاريخ البدء
                  </label>
                  <input
                    type="date"
                    value={editingStore.startDate}
                    onChange={(e) => setEditingStore({ ...editingStore, startDate: e.target.value })}
                    className="w-full px-2.5 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs font-mono text-white outline-none focus:border-[#c5834e]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    تاريخ الانتهاء
                  </label>
                  <input
                    type="date"
                    value={editingStore.endDate}
                    onChange={(e) => setEditingStore({ ...editingStore, endDate: e.target.value })}
                    className="w-full px-2.5 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs font-mono text-white outline-none focus:border-[#c5834e]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  رابط الخادم السحابي الخاص بالمتجر
                </label>
                <input
                  type="url"
                  value={editingStore.cloudUrl}
                  onChange={(e) => setEditingStore({ ...editingStore, cloudUrl: e.target.value })}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs font-mono text-white outline-none focus:border-[#c5834e]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  حالة الاشتراك
                </label>
                <select
                  value={editingStore.status}
                  onChange={(e) =>
                    setEditingStore({
                      ...editingStore,
                      status: e.target.value as "نشط" | "منتهي الصلاحية" | "معلق",
                    })
                  }
                  className="w-full px-3 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-[#c5834e] cursor-pointer"
                >
                  <option value="نشط">نشط</option>
                  <option value="منتهي الصلاحية">منتهي الصلاحية</option>
                  <option value="معلق">معلق / موقوف</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  ملاحظات
                </label>
                <input
                  type="text"
                  value={editingStore.notes || ""}
                  onChange={(e) => setEditingStore({ ...editingStore, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-[#090d16] border border-slate-700 rounded-lg text-xs text-white outline-none focus:border-[#c5834e]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="submit"
                  className="bg-[#c5834e] hover:bg-[#a6632f] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
                >
                  <i className="fa-solid fa-floppy-disk"></i> حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => setEditingStore(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs border border-slate-700 cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: DELETE CONFIRM ======================= */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-fadeInUp">
          <div className="bg-[#121829] rounded-2xl border border-rose-500/30 p-5 w-full max-w-sm text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-xl">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h3 className="text-sm font-bold text-white">تأكيد حذف المتجر؟</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              هل أنت متأكد من رغبتك في إزالة هذا المتجر نهائياً من سجل المشتركين؟ لن يتمكن من تسجيل الدخول بعد الآن وسيتم حذفه من ملف جوجل شيت الرئيسي.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  const targetSub = subscribers.find((s) => s.id === deleteConfirmId);
                  onDeleteSubscriber(deleteConfirmId, targetSub?.storeCode, targetSub?.username);
                  setDeleteConfirmId(null);
                  showToast("تم حذف المتجر بنجاح من المنظومة وقاعدة البيانات", "info");
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl text-xs cursor-pointer shadow-md"
              >
                نعم، احذف نهائياً
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl text-xs border border-slate-700 cursor-pointer"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
