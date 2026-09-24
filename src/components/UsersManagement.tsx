import React, { useState } from "react";
import { StoreUser, StorePermission } from "../types";
import { soundFx } from "../services/soundEffects";
import { cloudSaveStoreUser, cloudDeleteStoreUser, cloudGetStoreUsers } from "../services/cloudService";
import { motion, AnimatePresence } from "motion/react";

interface UsersManagementProps {
  users: StoreUser[];
  onUpdateUsers?: (newUsers: StoreUser[]) => void;
  onUsersUpdated?: (newUsers: StoreUser[]) => void;
  shopName?: string;
  storeUsername?: string;
  storeUnifiedUsername?: string;
  apiUrl?: string;
  cloudUrl?: string;
  showToast: (msg: string, type?: "success" | "error" | "info", duration?: number) => void;
}

const PERMISSION_CONFIG: {
  id: StorePermission;
  name: string;
  badge: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  desc: string;
}[] = [
  {
    id: "pos",
    name: "كاشير البيع المباشر",
    badge: "كاشير",
    icon: "fa-cash-register",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    desc: "إمكانية فتح واجهة البيع السريع POS، إضافة منتجات للسلة، تحديد طريقة الدفع (كاش/سداد/حوالة)، وطباعة الفواتير وإيصالات الاستلام.",
  },
  {
    id: "orders",
    name: "سجل الفواتير",
    badge: "الفواتير",
    icon: "fa-receipt",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    desc: "متابعة الفواتير السابقة، تعديل حالة الطلب (في الانتظار، في الطريق، تم التوصيل)، واستخدام ميزة إرجاع الفاتورة لإعادة الكميات للمخزن.",
  },
  {
    id: "inventory",
    name: "إدارة المخزن والجرد",
    badge: "المخزن",
    icon: "fa-boxes-stacked",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    desc: "تعديل أسعار البيع والتكلفة والكميات، إضافة منتجات جديدة وتوريدها، طباعة أكواد الباركود، وتصدير كشف PDF لجرد المخزون.",
  },
  {
    id: "dashboard",
    name: "لوحة التقارير المالية",
    badge: "التقارير",
    icon: "fa-chart-pie",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    desc: "متابعة إجمالي المبيعات، صافي الربح الفعلي، كشف الحساب الشهري، وتحليلات أداء المبيعات وتوزيع طرق الدفع.",
  },
  {
    id: "debts",
    name: "سجل الديون والمعاملات",
    badge: "الديون",
    icon: "fa-hand-holding-dollar",
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    desc: "تسجيل ديون العملاء والمستحقات، تسجيل الدفعات الجزئية، ومتابعة تواريخ الاستحقاق وإغلاق الديون.",
  },
];

export const UsersManagement: React.FC<UsersManagementProps> = ({
  users,
  onUpdateUsers,
  onUsersUpdated,
  shopName,
  storeUsername,
  storeUnifiedUsername,
  apiUrl,
  cloudUrl,
  showToast,
}) => {
  // Read effective Web App URL and unified store username
  const effectiveApiUrl = (
    apiUrl ||
    cloudUrl ||
    (typeof window !== "undefined"
      ? localStorage.getItem("rtg_script_url") || localStorage.getItem("store_script_url")
      : "") ||
    ""
  ).trim();

  const effectiveStoreUsername = (
    storeUsername ||
    storeUnifiedUsername ||
    (typeof window !== "undefined" ? localStorage.getItem("rtg_license_key") : "") ||
    "RTG-USER"
  ).trim();

  // Helper to dispatch updates locally and to storage
  const commitUsers = (newUsers: StoreUser[]) => {
    if (onUpdateUsers) onUpdateUsers(newUsers);
    if (onUsersUpdated) onUsersUpdated(newUsers);
    try {
      localStorage.setItem("rtg_store_users", JSON.stringify(newUsers));
    } catch {}
  };

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StoreUser | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Form states
  const [userTitle, setUserTitle] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<StorePermission[]>([
    "pos",
    "orders",
  ]);
  const [status, setStatus] = useState<"نشط" | "معلق">("نشط");

  // Delete modal state
  const [deletingUser, setDeletingUser] = useState<StoreUser | null>(null);

  // Visibility toggle map for table passwords
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenAddModal = () => {
    soundFx.playClick();
    setEditingUser(null);
    setUserTitle("");
    setPassword(generateRandomPassword());
    setSelectedPermissions(["pos"]);
    setStatus("نشط");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: StoreUser) => {
    soundFx.playClick();
    setEditingUser(u);
    setUserTitle(u.userTitle);
    setPassword(u.password);
    setSelectedPermissions(u.permissions || ["pos"]);
    setStatus(u.status || "نشط");
    setIsModalOpen(true);
  };

  const generateRandomPassword = () => {
    const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let pass = "";
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleTogglePermission = (perm: StorePermission) => {
    soundFx.playClick();
    setSelectedPermissions((prev) => {
      if (prev.includes(perm)) {
        if (prev.length === 1) {
          showToast("يجب إبقاء صلاحية واحدة على الأقل للموظف", "info");
          return prev;
        }
        return prev.filter((p) => p !== perm);
      } else {
        return [...prev, perm];
      }
    });
  };

  const applyPreset = (preset: "cashier" | "inventory" | "accountant" | "all") => {
    soundFx.playClick();
    if (preset === "cashier") {
      setSelectedPermissions(["pos", "orders"]);
      showToast("تم تطبيق قالب: كاشير بيع وفواتير", "info");
    } else if (preset === "inventory") {
      setSelectedPermissions(["inventory"]);
      showToast("تم تطبيق قالب: مسؤول مخزن وجرد", "info");
    } else if (preset === "accountant") {
      setSelectedPermissions(["orders", "dashboard", "debts"]);
      showToast("تم تطبيق قالب: محاسب وإدارة مالية", "info");
    } else if (preset === "all") {
      setSelectedPermissions(["pos", "orders", "inventory", "dashboard", "debts"]);
      showToast("تم تطبيق كافة الصلاحيات", "info");
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanTitle = userTitle.trim();
    const cleanPassword = password.trim();

    if (!cleanTitle) {
      showToast("يرجى إدخال اسم أو صفة الموظف (مثلاً: كاشير 1، أحمد، المحاسب)", "error");
      return;
    }

    if (!cleanPassword || cleanPassword.length < 3) {
      showToast("يرجى إدخال كلمة مرور مكونة من 3 خانات على الأقل", "error");
      return;
    }

    if (selectedPermissions.length === 0) {
      showToast("يرجى اختيار صلاحية واحدة على الأقل للموظف", "error");
      return;
    }

    // Check duplicate title in store
    const duplicate = users.find(
      (u) =>
        u.userTitle.toLowerCase() === cleanTitle.toLowerCase() &&
        u.id !== editingUser?.id
    );
    if (duplicate) {
      showToast(`يوجد موظف آخر مسجل بنفس الاسم أو الصفة "${cleanTitle}"`, "error");
      return;
    }

    const nowStr = new Date().toLocaleString("ar-LY");
    const userObj: StoreUser = {
      id: editingUser ? editingUser.id : "USR-" + Date.now().toString().slice(-6),
      username: effectiveStoreUsername || "store_user",
      userTitle: cleanTitle,
      password: cleanPassword,
      permissions: selectedPermissions,
      status: status,
      createdAt: editingUser?.createdAt || nowStr,
      lastLogin: editingUser?.lastLogin || "",
    };

    let updatedList: StoreUser[];
    if (editingUser) {
      updatedList = users.map((u) => (u.id === editingUser.id ? userObj : u));
    } else {
      updatedList = [userObj, ...users];
    }

    commitUsers(updatedList);
    soundFx.playSuccess();
    setIsModalOpen(false);

    // Sync to Cloud Sheet
    if (effectiveApiUrl) {
      try {
        const ok = await cloudSaveStoreUser(effectiveApiUrl, userObj);
        if (ok) {
          showToast(
            editingUser
              ? `✓ تم تحديث وتثبيت صلاحيات "${cleanTitle}" في الشيت السحابي بنجاح`
              : `✓ تم إضافة الموظف "${cleanTitle}" ومزامنته مع الشيت السحابي`,
            "success"
          );
        } else {
          showToast(`⚠️ تم الحفظ محلياً وتعذر الحفظ السحابي، تحقق من اتصال الإنترنت`, "info");
        }
      } catch (err) {
        console.warn("Cloud user save warning:", err);
        showToast(`⚠️ تم الحفظ محلياً، وتعذر الوصول للخادم السحابي`, "info");
      }
    } else {
      showToast(
        `⚠️ تم الحفظ محلياً فقط! لربط ومزامنة الموظف مع جوجل شيت، يرجى التوجه للإعدادات وربط رابط الخادم السحابي.`,
        "info",
        6000
      );
    }
  };

  const handleToggleStatus = async (user: StoreUser) => {
    soundFx.playClick();
    const newStatus = user.status === "معلق" ? "نشط" : "معلق";
    const updated = { ...user, status: newStatus as "نشط" | "معلق" };
    const newList = users.map((u) => (u.id === user.id ? updated : u));
    commitUsers(newList);

    showToast(
      newStatus === "نشط"
        ? `✓ تم تفعيل حساب "${user.userTitle}" بنجاح`
        : `⚠️ تم تعليق حساب "${user.userTitle}" مؤقتاً`,
      newStatus === "نشط" ? "success" : "info"
    );

    if (effectiveApiUrl) {
      try {
        await cloudSaveStoreUser(effectiveApiUrl, updated);
      } catch {}
    } else {
      showToast("⚠️ تم التعديل محلياً فقط، يرجى ربط خادم المتجر لتحديث شيت الموظفين", "info");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    soundFx.playClick();
    const target = deletingUser;
    const newList = users.filter((u) => u.id !== target.id);
    commitUsers(newList);
    setDeletingUser(null);

    if (effectiveApiUrl) {
      try {
        const ok = await cloudDeleteStoreUser(effectiveApiUrl, target.username, target.userTitle, target.id);
        if (ok) {
          showToast(`✓ تم حذف حساب الموظف "${target.userTitle}" من المنظومة والشيت السحابي`, "info");
        } else {
          showToast(`⚠️ تم الحذف محلياً، لم يُعثر على الموظف في الشيت`, "info");
        }
      } catch {
        showToast(`⚠️ تم الحذف محلياً، وتعذر الاتصال بالشيت السحابي`, "info");
      }
    } else {
      showToast(`⚠️ تم حذف الموظف محلياً فقط! يرجى ربط خادم المتجر السحابي لتحديث جدول جوجل شيت.`, "info", 6000);
    }
  };

  const handleSyncFromCloud = async () => {
    if (!effectiveApiUrl) {
      showToast("⚠️ يرجى ربط رابط خادم المتجر السحابي أولاً من شاشة الإعدادات لتفعيل المزامنة مع جوجل شيت", "error", 6000);
      return;
    }
    soundFx.playClick();
    setIsSyncing(true);
    showToast("جاري جلب أحدث بيانات الموظفين من جدول المتجر...", "info", 3000);
    try {
      const cloudUsers = await cloudGetStoreUsers(effectiveApiUrl, effectiveStoreUsername);
      if (cloudUsers && cloudUsers.length > 0) {
        commitUsers(cloudUsers);
        showToast(`✓ تم تحديث بيانات ${cloudUsers.length} موظف من الشيت بنجاح`, "success");
      } else {
        showToast("لم يتم العثور على موظفين في ورقة Users أو تم إنشاء الشيت للتو", "info");
      }
    } catch {
      showToast("تعذر جلب الموظفين حالياً من الشيت، تحقق من إتاحة السكربت", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      u.userTitle.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.permissions.some((p) => p.includes(q))
    );
  });

  // Calculate statistics
  const totalEmployees = users.length;
  const activeEmployees = users.filter((u) => u.status !== "معلق").length;
  const posEmployees = users.filter((u) => u.permissions.includes("pos")).length;
  const invEmployees = users.filter((u) => u.permissions.includes("inventory")).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/60 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c5834e]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c5834e]/20 border border-[#c5834e]/30 text-[#e4a87a] text-xs font-black">
              <i className="fa-solid fa-shield-halved"></i>
              نظام إدارة الصلاحيات المتقدم (RBAC) • خاص بالمالك
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <span>إدارة الموظفين وتخصيص الصلاحيات</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              تحكم كامل في إضافة موظفي متجر{" "}
              <span className="font-bold text-[#e4a87a]">"{shopName}"</span>، تحديد كلمة مرور مستقلة
              لكل موظف، وحجب أو إتاحة صفحات المنظومة بدقة بالغة.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSyncFromCloud}
              disabled={isSyncing}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              title="مزامنة بيانات ورقة Users مع جوجل شيت"
            >
              <i className={`fa-solid fa-arrows-rotate ${isSyncing ? "animate-spin text-[#c5834e]" : ""}`}></i>
              <span>{isSyncing ? "جاري التحديث..." : "مزامنة الشيت"}</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#c5834e] to-[#a6632f] hover:from-[#d6935e] hover:to-[#b6733f] text-white text-xs font-black cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-[#c5834e]/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <i className="fa-solid fa-user-plus"></i>
              <span>إضافة موظف جديد +</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 mt-5 border-t border-slate-700/50">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3">
            <span className="text-[11px] text-slate-400 font-bold block">إجمالي الموظفين</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-white">{totalEmployees}</span>
              <span className="text-[10px] text-slate-400">حسابات مسجلة</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3">
            <span className="text-[11px] text-slate-400 font-bold block">الحسابات النشطة</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-emerald-400">{activeEmployees}</span>
              <span className="text-[10px] text-emerald-400/80">جاهز للدخول</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3">
            <span className="text-[11px] text-slate-400 font-bold block">موظفو الكاشير (POS)</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-blue-400">{posEmployees}</span>
              <span className="text-[10px] text-blue-400/80">صلاحية بيع</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-3">
            <span className="text-[11px] text-slate-400 font-bold block">مسؤولو المخزن والجرد</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl font-black text-amber-400">{invEmployees}</span>
              <span className="text-[10px] text-amber-400/80">تحكم بالبضائع</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Server URL Warning Banner if Not Linked */}
      {!effectiveApiUrl && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-amber-200 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-inner">
              <i className="fa-solid fa-triangle-exclamation text-amber-400 text-xl animate-pulse"></i>
            </div>
            <div>
              <div className="font-black text-sm text-white flex items-center gap-2">
                <span>تنبيه: رابط خادم المتجر السحابي (Web App URL) غير مرتبط حالياً</span>
                <span className="text-[10px] bg-amber-500/30 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/40">حفظ محلي فقط</span>
              </div>
              <div className="text-xs text-amber-200/80 leading-relaxed mt-0.5">
                أي موظف تقوم بإضافته أو تعديل صلاحياته الآن يُحفظ داخل هذا المتصفح فقط. لتثبيت الموظفين ومزامنتهم وحفظهم نهائياً في ورقة <strong className="text-white font-mono bg-slate-900/60 px-1.5 py-0.5 rounded border border-amber-500/30">Users</strong> في شيت المتجر، يرجى ربط رابط الخادم السحابي من شاشة الإعدادات.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified Store Info Tip */}
      <div className="bg-[#c5834e]/10 border border-[#c5834e]/30 rounded-2xl p-3.5 flex items-start gap-3">
        <i className="fa-solid fa-circle-info text-[#c5834e] text-base mt-0.5"></i>
        <div className="text-xs text-slate-300 leading-relaxed">
          <span className="font-black text-white">كيف يسجل الموظفون الدخول للمنظومة؟</span>
          <br />
          يدعم النظام طريقتين مريحتين للدخول:
          <span className="font-bold text-[#e4a87a]"> (1) كتابة اسم المستخدم الموحد للمتجر </span>
          <span className="font-mono font-black text-[#e4a87a] bg-slate-900/80 px-2 py-0.5 rounded border border-[#c5834e]/30 select-all">
            {effectiveStoreUsername}
          </span>{" "}
          مع <span className="font-bold text-white">كلمة مرور الموظف</span> الخاصة،
          أو <span className="font-bold text-[#e4a87a]"> (2) كتابة اسم الموظف المباشر (مثل: كاشير 1، أحمد) </span> مع كلمة مروره الخاصة.
          ستفتح المنظومة للموظف فوراً وفق الصلاحيات المحددة له في الجدول أدناه.
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <i className="fa-solid fa-magnifying-glass absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم الموظف أو الصلاحية..."
            className="w-full bg-slate-900/70 border border-slate-700/70 rounded-xl pr-9 pl-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#c5834e]"
          />
        </div>

        <div className="text-xs text-slate-400 font-bold self-end sm:self-center">
          عرض {filteredUsers.length} من أصل {users.length} موظف
        </div>
      </div>

      {/* Employees Table / Cards */}
      {filteredUsers.length === 0 ? (
        <div className="bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-3xl p-10 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-400 text-2xl">
            <i className="fa-solid fa-users-slash"></i>
          </div>
          <h3 className="text-base font-bold text-white">لا يوجد موظفون مسجلون حالياً</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            يمكنك الآن إضافة حسابات لموظفيك (كاشير، أمين مخزن، محاسب) وتعيين كلمات مرور مستقلة لكل
            منهم بضغطة زر.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-[#c5834e] hover:bg-[#b5733e] text-white text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-2 shadow-md"
          >
            <i className="fa-solid fa-plus"></i>
            إضافة أول موظف الآن
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const isVisible = visiblePasswords[user.id] || false;
            const isSuspended = user.status === "معلق";

            return (
              <motion.div
                key={user.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-slate-900/80 border rounded-2xl p-4.5 space-y-3.5 transition-all shadow-md relative overflow-hidden ${
                  isSuspended
                    ? "border-rose-900/40 bg-slate-950/60 opacity-80"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Header: Name + Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-sm ${
                        isSuspended
                          ? "bg-slate-800 text-slate-400"
                          : "bg-gradient-to-br from-[#c5834e] to-[#8c491e]"
                      }`}
                    >
                      <i className="fa-solid fa-user-tie"></i>
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white flex items-center gap-1.5">
                        <span>{user.userTitle}</span>
                        {isSuspended && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            معلق
                          </span>
                        )}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        المتجر: {user.username}
                      </span>
                    </div>
                  </div>

                  {/* Status Toggle Switch */}
                  <button
                    onClick={() => handleToggleStatus(user)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      isSuspended
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                    }`}
                    title="تبديل حالة الحساب (نشط / معلق)"
                  >
                    <i
                      className={`fa-solid ${
                        isSuspended ? "fa-circle-pause" : "fa-circle-check"
                      } ml-1`}
                    ></i>
                    {isSuspended ? "حساب معلق" : "حساب نشط"}
                  </button>
                </div>

                {/* Password display card */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 block font-bold">كلمة المرور الخاصة:</span>
                    <div className="font-mono text-xs font-black tracking-widest text-[#e4a87a]">
                      {isVisible ? user.password : "••••••••"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => togglePasswordVisibility(user.id)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs cursor-pointer transition-all"
                      title={isVisible ? "إخفاء" : "إظهار"}
                    >
                      <i className={`fa-solid ${isVisible ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        navigator.clipboard.writeText(user.password);
                        showToast(`تم نسخ كلمة مرور "${user.userTitle}"`, "success");
                      }}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs cursor-pointer transition-all"
                      title="نسخ كلمة المرور"
                    >
                      <i className="fa-solid fa-copy"></i>
                    </button>
                  </div>
                </div>

                {/* Permissions Badges */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold block">
                    الصلاحيات الممنوحة ({user.permissions?.length || 0}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PERMISSION_CONFIG.map((cfg) => {
                      const hasPerm = (user.permissions || []).includes(cfg.id);
                      if (!hasPerm) return null;
                      return (
                        <span
                          key={cfg.id}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${cfg.bgColor} ${cfg.borderColor} ${cfg.color}`}
                        >
                          <i className={`fa-solid ${cfg.icon}`}></i>
                          <span>{cfg.badge}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Meta & Actions */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                  <span>
                    آخر دخول: {user.lastLogin ? user.lastLogin.split(" ")[0] : "لم يدخل بعد"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(user)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer transition-all flex items-center gap-1 border border-slate-700"
                    >
                      <i className="fa-solid fa-pen-to-square text-[#c5834e]"></i>
                      تعديل
                    </button>
                    <button
                      onClick={() => setDeletingUser(user)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold cursor-pointer transition-all flex items-center gap-1 border border-rose-500/30"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                      حذف
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#c5834e]/20 border border-[#c5834e]/30 flex items-center justify-center text-[#c5834e] text-sm">
                    <i className={editingUser ? "fa-solid fa-user-pen" : "fa-solid fa-user-plus"}></i>
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-white">
                      {editingUser ? `تعديل بيانات وصلاحيات الموظف` : `إضافة موظف جديد`}
                    </h3>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      المتجر: {storeUsername}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer transition-all"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <form onSubmit={handleSaveUser} className="space-y-4">
                {/* Employee Title / Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">
                    اسم الموظف أو الصفة الوظيفية <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={userTitle}
                    onChange={(e) => setUserTitle(e.target.value)}
                    placeholder="مثال: كاشير 1، أمين المخزن أحمد، المحاسب"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#c5834e]"
                    required
                  />
                  <span className="text-[10px] text-slate-500 block">
                    يظهر هذا الاسم في الفواتير المطبوعة وسجل المعاملات.
                  </span>
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 block">
                      كلمة المرور الخاصة بهذا الموظف <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setPassword(generateRandomPassword());
                      }}
                      className="text-[10px] text-[#e4a87a] hover:underline font-bold cursor-pointer flex items-center gap-1"
                    >
                      <i className="fa-solid fa-dice"></i>
                      توليد كلمة سر عشوائية
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="كلمة مرور الدخول للموظف"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#c5834e] tracking-wider"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                    </button>
                  </div>
                </div>

                {/* Status Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300 block">حالة الحساب</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatus("نشط")}
                      className={`p-2 rounded-xl text-xs font-bold border cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                        status === "نشط"
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <i className="fa-solid fa-circle-check"></i>
                      نشط (مسموح بالدخول)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus("معلق")}
                      className={`p-2 rounded-xl text-xs font-bold border cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                        status === "معلق"
                          ? "bg-rose-500/20 border-rose-500/50 text-rose-400"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <i className="fa-solid fa-circle-pause"></i>
                      معلق (محظور مؤقتاً)
                    </button>
                  </div>
                </div>

                {/* Quick Presets Buttons */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 block">
                      تحديد الصلاحيات الممنوحة <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">قوالب سريعة:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyPreset("cashier")}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer transition-all border border-slate-700"
                    >
                      <i className="fa-solid fa-cash-register ml-1 text-emerald-400"></i>
                      كاشير بيع
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("inventory")}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer transition-all border border-slate-700"
                    >
                      <i className="fa-solid fa-boxes-stacked ml-1 text-amber-400"></i>
                      أمين مخزن
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("accountant")}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer transition-all border border-slate-700"
                    >
                      <i className="fa-solid fa-chart-pie ml-1 text-purple-400"></i>
                      محاسب مالي
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset("all")}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer transition-all border border-slate-700"
                    >
                      <i className="fa-solid fa-check-double ml-1 text-[#e4a87a]"></i>
                      صلاحية كاملة
                    </button>
                  </div>
                </div>

                {/* Permissions Checkboxes List */}
                <div className="space-y-2 pt-1">
                  {PERMISSION_CONFIG.map((cfg) => {
                    const isChecked = selectedPermissions.includes(cfg.id);
                    return (
                      <div
                        key={cfg.id}
                        onClick={() => handleTogglePermission(cfg.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                          isChecked
                            ? `${cfg.bgColor} ${cfg.borderColor}`
                            : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-xs mt-0.5 border ${
                            isChecked
                              ? "bg-[#c5834e] border-[#c5834e] text-white"
                              : "border-slate-600 bg-slate-900"
                          }`}
                        >
                          {isChecked && <i className="fa-solid fa-check text-[10px]"></i>}
                        </div>

                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-white flex items-center gap-1.5">
                              <i className={`fa-solid ${cfg.icon} ${cfg.color}`}></i>
                              {cfg.name}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">
                              {cfg.id}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{cfg.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#c5834e] to-[#a6632f] hover:from-[#d6935e] hover:to-[#b6733f] text-white text-xs font-black cursor-pointer transition-all shadow-lg flex items-center gap-2"
                  >
                    <i className="fa-solid fa-floppy-disk"></i>
                    <span>حفظ وتثبيت الصلاحيات</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingUser && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto text-xl">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>

              <div className="space-y-1">
                <h3 className="font-black text-base text-white">
                  تأكيد حذف حساب الموظف؟
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  هل أنت متأكد من رغبتك في حذف حساب{" "}
                  <span className="font-bold text-white">"{deletingUser.userTitle}"</span>؟ لن يتمكن
                  الموظف من تسجيل الدخول للمنظومة بعد الآن.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setDeletingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-all"
                >
                  تراجع
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black cursor-pointer transition-all shadow-md shadow-rose-600/30 flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-trash-can"></i>
                  نعم، احذف الحساب
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
