import { StoreSubscriber } from "../types";

export const DEFAULT_ADMIN_PASSWORD = "rtg@admin2025";
export const MASTER_SCRIPT_STORAGE_KEY = "rtg_master_cloud_script_url";
export const ADMIN_PASSWORD_STORAGE_KEY = "rtg_admin_master_password";
export const SUBSCRIBERS_STORAGE_KEY = "rtg_subscribers_master_list";

// Demo Subscribers only loaded on explicit demo request
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

export const INITIAL_SUBSCRIBERS: StoreSubscriber[] = [];

// Helper functions for storage
export function getSavedSubscribers(): StoreSubscriber[] {
  try {
    const raw = localStorage.getItem(SUBSCRIBERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading subscribers:", e);
  }
  return [];
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
  return localStorage.getItem(MASTER_SCRIPT_STORAGE_KEY) || "";
}

export function setMasterScriptUrl(url: string): void {
  localStorage.setItem(MASTER_SCRIPT_STORAGE_KEY, url.trim());
}

// Aliases for convenience
export const loadSubscribers = getSavedSubscribers;
export const loadAdminPassword = getAdminPassword;
export const saveAdminPassword = setAdminPassword;
export const loadMasterScriptUrl = getMasterScriptUrl;
export const saveMasterScriptUrl = setMasterScriptUrl;

