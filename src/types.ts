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
  returnNote?: string;
  cartItems?: CartItem[];
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

export type ActiveTab = "pos" | "orders" | "inventory" | "dashboard" | "debts";

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
  plan: "تجريبي" | "شهري" | "سنوي" | "دائم VIP";
  status: "نشط" | "منتهي الصلاحية" | "معلق";
  notes?: string;
  createdAt?: string;
}
