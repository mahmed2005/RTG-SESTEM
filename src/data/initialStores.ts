import { StoreSubscriber, SubscriptionPlan } from "../types";

export const DEFAULT_ADMIN_PASSWORD = "rtg@admin2025";
export const DEFAULT_MASTER_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxST8gCnxrB9XL0fTMSa5bWu1iAoBbcAtpRZSr3mm83ARgVPMaiF4J4db9biR52DLS8/exec";
export const MASTER_SCRIPT_STORAGE_KEY = "rtg_master_cloud_script_url";
export const ADMIN_PASSWORD_STORAGE_KEY = "rtg_admin_master_password";
export const SUBSCRIBERS_STORAGE_KEY = "rtg_subscribers_master_list";
export const SUBSCRIPTION_PLANS_STORAGE_KEY = "rtg_subscription_plans_list";

export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "plan-1m",
    name: "باقة 1 شهر (تجربة سريعة)",
    months: 1,
    price: 45,
    badge: "مرونة شهرية",
    features: [
      "نظام كاشير بيع مباشر وفوري",
      "إدارة المخزون والتنبيه عند نفاد الكميات",
      "إصدار وطباعة فواتير حرارية وبلوتوث",
      "مزامنة سحابية مستمرة مع خادمك الخاص",
      "دعم فني وتحديثات مستمرة",
    ],
  },
  {
    id: "plan-3m",
    name: "باقة 3 أشهر (الأكثر طلباً)",
    months: 3,
    price: 115,
    originalPrice: 135,
    badge: "الأكثر طلباً 🚀",
    popular: true,
    features: [
      "كافة مميزات المنظومة المتكاملة",
      "إدارة الديون وسجل المرتجعات",
      "تقارير أرباح ومبيعات ورسوم بيانية",
      "مزامنة سحابية فائقة السرعة 24/7",
      "توفير 20 دينار مقارنة بالشهري",
      "دعم فني ذو أولوية عالية",
    ],
  },
  {
    id: "plan-6m",
    name: "باقة 6 أشهر (توفير عالي)",
    months: 6,
    price: 210,
    originalPrice: 270,
    badge: "توفير 60 د.ل",
    features: [
      "كافة مميزات المنظومة بدون أي قيود",
      "ربط خادم سحابي مستقل مشفر للمتجر",
      "نسخ احتياطي تلقائي للبيانات وحمايتها",
      "إمكانية الدخول من أكثر من جهاز في نفس الوقت",
      "دعم فني مباشر ومساعدة في التهيئة",
    ],
  },
  {
    id: "plan-12m",
    name: "باقة سنوية 12 شهر (الأوفر)",
    months: 12,
    price: 350,
    originalPrice: 540,
    badge: "الأوفر والأفضل قيمة 💎",
    features: [
      "اشتراك سنوي كامل بأقل تكلفة شهرية",
      "تجهيز وربط خادم جوجل شيت مجاناً",
      "تحديثات حصرية متميزة على مدار العام",
      "تقارير سنوية شاملة للمبيعات والأرباح",
      "دعم فني VIP على مدار الساعة 24/7",
    ],
  },
];
export const DEMO_SUBSCRIBERS: StoreSubscriber[] = [
  {
    id: "STORE-001",
    storeCode: "RTG-2025",
    username: "almadina",
    password: "123",
    storeName: "متجر المدينة للإلكترونيات",
    phone: "0912345678",
    cloudUrl: "",
    startDate: "2026-08-01",
    endDate: "2026-12-31",
    plan: "سنوي",
    status: "نشط",
    notes: "مشترك سنوي تجريبي",
    createdAt: "2026-08-01",
  }
];

export const INITIAL_SUBSCRIBERS: StoreSubscriber[] = [
  {
    id: "STORE-2",
    storeCode: "RTG-8631",
    username: "MAHMED",
    password: "20052005",
    storeName: "RTG-SESTEM",
    phone: "934590635",
    cloudUrl: "https://script.google.com/macros/s/AKfycbzU7Hz1tVMeNrmaO9fUVQBFuPGv2-UlaHBiDzX6cFr3RT5P8eSbFEEz7I6-8fXg_zJZ/exec",
    startDate: "2026-09-03",
    endDate: "2026-10-03",
    plan: "شهري",
    status: "نشط",
    notes: "المتجر الأساسي للمنظومة",
    createdAt: "2026-09-03",
  },
  {
    id: "STORE-1",
    storeCode: "RTG-1001",
    username: "store1",
    password: "123456",
    storeName: "متجر النخبة للتجارة",
    phone: "912345678",
    cloudUrl: "https://script.google.com/macros/s/AKfycbw0bEMjT9cPyeq7iemJB_tMX9LlFIOtBlF3jEee3hoOJVt0pDaBAbnwSrgVxmDgFEOYmw/exec",
    startDate: "2025-01-01",
    endDate: "2026-10-02",
    plan: "سنوي",
    status: "نشط",
    notes: "متجر رئيسي",
    createdAt: "2025-01-01",
  }
];

// Helper functions for storage
export function getSavedSubscribers(): StoreSubscriber[] {
  try {
    const raw = localStorage.getItem(SUBSCRIBERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading subscribers:", e);
  }
  return INITIAL_SUBSCRIBERS;
}

export function saveSubscribers(subscribers: StoreSubscriber[]): void {
  try {
    localStorage.setItem(SUBSCRIBERS_STORAGE_KEY, JSON.stringify(subscribers));
  } catch (e) {
    console.error("Error saving subscribers:", e);
  }
}

export function getAdminPassword(): string {
  return localStorage.getItem(ADMIN_PASSWORD_STORAGE_KEY) || DEFAULT_ADMIN_PASSWORD;
}

export function setAdminPassword(newPass: string): void {
  localStorage.setItem(ADMIN_PASSWORD_STORAGE_KEY, newPass);
}

export function getMasterScriptUrl(): string {
  const saved = localStorage.getItem(MASTER_SCRIPT_STORAGE_KEY);
  if (saved && saved.trim()) return saved.trim();
  return DEFAULT_MASTER_SCRIPT_URL;
}

export function setMasterScriptUrl(url: string): void {
  localStorage.setItem(MASTER_SCRIPT_STORAGE_KEY, url.trim() || DEFAULT_MASTER_SCRIPT_URL);
}

export function getSubscriptionPlans(): SubscriptionPlan[] {
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_PLANS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading subscription plans:", e);
  }
  return DEFAULT_SUBSCRIPTION_PLANS;
}

export function saveSubscriptionPlans(plans: SubscriptionPlan[]): void {
  try {
    localStorage.setItem(SUBSCRIPTION_PLANS_STORAGE_KEY, JSON.stringify(plans));
  } catch (e) {
    console.error("Error saving subscription plans:", e);
  }
}

export const SYSTEM_CODE_STORAGE_KEY = "rtg_system_code";
export const DEFAULT_SYSTEM_CODE = "RTG-SYSTEM-2025";
export const MASTER_SETTINGS_STORAGE_KEY = "rtg_master_settings";

export function getSystemCode(): string {
  return localStorage.getItem(SYSTEM_CODE_STORAGE_KEY) || DEFAULT_SYSTEM_CODE;
}

export function setSystemCode(code: string): void {
  localStorage.setItem(SYSTEM_CODE_STORAGE_KEY, code.trim());
}

export function loadMasterSettings(): {
  masterScriptUrl: string;
  adminPassword: string;
  systemCode: string;
  systemName: string;
  supportPhone: string;
  updatedAt?: string;
} {
  try {
    const raw = localStorage.getItem(MASTER_SETTINGS_STORAGE_KEY);
    if (raw) {
      return {
        masterScriptUrl: getMasterScriptUrl(),
        adminPassword: getAdminPassword(),
        systemCode: getSystemCode(),
        systemName: "RTG-SYSTEM",
        supportPhone: "0912345678",
        ...JSON.parse(raw),
      };
    }
  } catch {}
  return {
    masterScriptUrl: getMasterScriptUrl(),
    adminPassword: getAdminPassword(),
    systemCode: getSystemCode(),
    systemName: "RTG-SYSTEM",
    supportPhone: "0912345678",
  };
}

export function saveMasterSettings(settings: Record<string, any>): void {
  try {
    if (settings.masterScriptUrl !== undefined) setMasterScriptUrl(settings.masterScriptUrl);
    if (settings.adminPassword !== undefined) setAdminPassword(settings.adminPassword);
    if (settings.systemCode !== undefined) setSystemCode(settings.systemCode);
    localStorage.setItem(MASTER_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Error saving master settings:", e);
  }
}

// Aliases for convenience
export const loadSubscribers = getSavedSubscribers;
export const loadAdminPassword = getAdminPassword;
export const saveAdminPassword = setAdminPassword;
export const loadMasterScriptUrl = getMasterScriptUrl;
export const saveMasterScriptUrl = setMasterScriptUrl;
export const loadSubscriptionPlans = getSubscriptionPlans;
export const loadSystemCode = getSystemCode;
export const saveSystemCode = setSystemCode;



