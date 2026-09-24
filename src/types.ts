export interface Product {
  name: string;
  qty: number;
  cost: number;
  price: number;
}

export type ProductsMap = Record<string, Product>;

export interface CartItem {
  code: string;
  name: string;
  price: number;
  cost: number;
  qty: number;
}

export interface Order {
  id: string;
  date: string;
  desc: string;
  total: number;
  profit: number;
  method: string;
  delivery: number;
  discount?: number;
  status: "في الانتظار" | "في الطريق" | "تم التوصيل" | "راجع" | string;
  cName: string;
  cPhone: string;
  cBackup?: string;
  cArea?: string;
  deliveryType?: "فوري" | "توصيل" | "مؤجل";
  returnNote?: string;
  cartItems?: CartItem[];
  cashierName?: string;
}

export type StorePermission = "pos" | "orders" | "inventory" | "dashboard" | "debts";

export interface StoreUser {
  id: string;
  username: string; // Store unified username (e.g. from Master Sheet)
  userTitle: string; // Employee Name or Role (e.g. "كاشير 1", "أمين المخزن أحمد", "المحاسب")
  password: string; // Employee specific password
  permissions: StorePermission[]; // Granted permissions
  status?: "نشط" | "معلق";
  createdAt?: string;
  lastLogin?: string;
}

export interface UserSession {
  role: "admin" | "employee";
  userTitle: string;
  username: string;
  permissions: StorePermission[];
  loginAt?: string;
}

export interface Debt {
  id: string;
  date: string;
  type: "لي" | "علي";
  name: string;
  phone: string;
  original: number;
  paid: number;
  remaining: number;
  dueDate: string;
  status: "مفتوح" | "مدفوع جزئياً" | "مغلق";
  note: string;
  updatedAt: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export type ActiveTab =
  | "pos"
  | "orders"
  | "inventory"
  | "dashboard"
  | "debts"
  | "users_management";

export interface StoreSubscriber {
  id: string;
  storeCode: string;
  username: string;
  password: string;
  storeName: string;
  phone: string;
  cloudUrl: string;
  startDate: string;
  endDate: string;
  plan: "تجريبي" | "شهري" | "سنوي" | "دائم VIP" | string;
  status: "نشط" | "منتهي الصلاحية" | "معلق";
  notes?: string;
  createdAt?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  months: number;
  price: number;
  originalPrice?: number;
  badge?: string;
  popular?: boolean;
  features: string[];
  description?: string;
  isActive?: boolean;
}

export interface MasterSettings {
  masterCloudUrl: string;
  adminPassword: string;
  systemName: string;
  supportPhone: string;
  updatedAt?: string;
  subscriptionPlans?: SubscriptionPlan[];
  systemCode?: string;
  masterScriptUrl?: string;
}

