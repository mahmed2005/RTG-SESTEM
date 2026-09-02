import { ProductsMap, Order, Debt } from "../types";

export const INITIAL_PRODUCTS: ProductsMap = {
  "GM-001": { name: "سماعة جيمنج RGB احترافية", qty: 25, cost: 15, price: 35 },
  "GM-002": { name: "ماوس جيمنج لاسلكي سريع الاستجابة", qty: 18, cost: 25, price: 55 },
  "GM-003": { name: "كيبورد ميكانيكي سويتش أحمر RGB", qty: 8, cost: 45, price: 85 },
  "GM-004": { name: "شاحن سريع 65W USB-C ثلاثي المنافذ", qty: 30, cost: 12, price: 28 },
  "GM-005": { name: "حامل هاتف مغناطيسي للسيارة والمكتب", qty: 40, cost: 5, price: 15 },
  "GM-006": { name: "يد تحكم PS5 أصلية Wireless", qty: 5, cost: 80, price: 145 },
  "GM-007": { name: "كابل HDMI 2.1 4K/120Hz بطول 2م", qty: 50, cost: 8, price: 20 },
  "GM-008": { name: "مروحة تبريد هاتف RGB مع شاشة حرارة", qty: 15, cost: 10, price: 25 },
  "GM-009": { name: "ماوس باد XXL مقاوم للماء مع إضاءة RGB", qty: 12, cost: 18, price: 38 },
  "GM-010": { name: "سبيكر بلوتوث خارجي مقاوم للماء", qty: 7, cost: 30, price: 60 },
  "GM-011": { name: "ستاند سماعات مع 2x USB Hub وRGB", qty: 14, cost: 16, price: 34 },
  "GM-012": { name: "وصلة تحويل Type-C إلى HDMI/USB/PD", qty: 22, cost: 14, price: 30 }
};

export const INITIAL_ORDERS: Order[] = [
  {
    id: "INV-DEMO01",
    date: "2025/01/15 14:30",
    desc: "2x [GM-001] سماعة جيمنج RGB ، 1x [GM-004] شاحن سريع 65W",
    total: 98,
    profit: 43,
    method: "كاش",
    delivery: 10,
    status: "تم التوصيل",
    cName: "أحمد محمد المصراتي",
    cPhone: "0912345678",
    cBackup: "0921112233",
    cArea: "طرابلس - النوفليين",
    cartItems: [
      { code: "GM-001", name: "سماعة جيمنج RGB احترافية", price: 35, cost: 15, qty: 2 },
      { code: "GM-004", name: "شاحن سريع 65W USB-C ثلاثي المنافذ", price: 28, cost: 12, qty: 1 }
    ]
  },
  {
    id: "INV-DEMO02",
    date: "2025/01/16 10:15",
    desc: "1x [GM-002] ماوس جيمنج لاسلكي",
    total: 55,
    profit: 25,
    method: "سداد",
    delivery: 0,
    status: "في الطريق",
    cName: "سارة الفرجاني",
    cPhone: "0923456789",
    cArea: "مصراتة - شارع طرابلس",
    cartItems: [
      { code: "GM-002", name: "ماوس جيمنج لاسلكي سريع الاستجابة", price: 55, cost: 25, qty: 1 }
    ]
  },
  {
    id: "INV-DEMO03",
    date: "2025/01/17 09:00",
    desc: "1x [GM-006] يد تحكم PS5 أصلية ، 1x [GM-007] كابل HDMI 4K",
    total: 180,
    profit: 57,
    method: "مصراتي",
    delivery: 15,
    status: "في الانتظار",
    cName: "عمر التاجوري",
    cPhone: "0934567890",
    cArea: "بنغازي - الكيش",
    cartItems: [
      { code: "GM-006", name: "يد تحكم PS5 أصلية Wireless", price: 145, cost: 80, qty: 1 },
      { code: "GM-007", name: "كابل HDMI 2.1 4K/120Hz بطول 2م", price: 20, cost: 8, qty: 1 }
    ]
  },
  {
    id: "INV-DEMO04",
    date: "2025/01/18 16:45",
    desc: "3x [GM-005] حامل هاتف مغناطيسي",
    total: 50,
    profit: 20,
    method: "كاش",
    delivery: 5,
    status: "تم التوصيل",
    cName: "فاطمة الورفلي",
    cPhone: "0945678901",
    cArea: "زليتن - الوسط",
    cartItems: [
      { code: "GM-005", name: "حامل هاتف مغناطيسي للسيارة والمكتب", price: 15, cost: 5, qty: 3 }
    ]
  }
];

export const INITIAL_DEBTS: Debt[] = [
  {
    id: "DEBT-D01",
    date: "2025/01/10",
    type: "لي",
    name: "علي حسن المزوغي",
    phone: "0911223344",
    original: 150,
    paid: 50,
    remaining: 100,
    dueDate: "2025-02-01",
    status: "مدفوع جزئياً",
    note: "دفع 50 د.ل كدفعة أولى عند الشراء",
    updatedAt: "2025/01/15"
  },
  {
    id: "DEBT-D02",
    date: "2025/01/12",
    type: "علي",
    name: "مورد إكسسوارات الألعاب (محمد سالم)",
    phone: "0933445566",
    original: 80,
    paid: 80,
    remaining: 0,
    dueDate: "2025-01-20",
    status: "مغلق",
    note: "تم تسديد الحساب بالكامل نقداً",
    updatedAt: "2025/01/20"
  },
  {
    id: "DEBT-D03",
    date: "2025/01/14",
    type: "لي",
    name: "خالد الزنتاني",
    phone: "0922334455",
    original: 200,
    paid: 0,
    remaining: 200,
    dueDate: "2025-02-15",
    status: "مفتوح",
    note: "طلبية كيبورد وسماعات بالآجل",
    updatedAt: "2025/01/14"
  }
];
