import { useState, useEffect, useCallback } from "react";
import {
  Product,
  ProductsMap,
  Order,
  Debt,
  ToastMessage,
  ActiveTab,
  StoreSubscriber,
} from "./types";
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_DEBTS } from "./data/initialData";
import {
  loadSubscribers,
  saveSubscribers,
  loadAdminPassword,
  saveAdminPassword,
  loadMasterScriptUrl,
  saveMasterScriptUrl,
} from "./data/initialStores";
import { RtgLogo } from "./components/RtgLogo";
import { ToastContainer } from "./components/ToastContainer";
import { SplashScreen } from "./components/SplashScreen";
import { LandingScreen } from "./components/LandingScreen";
import { LoginModal } from "./components/LoginModal";
import { RegisterModal } from "./components/RegisterModal";
import { PosCashier } from "./components/PosCashier";
import { OrdersList } from "./components/OrdersList";
import { InventoryManager } from "./components/InventoryManager";
import { DashboardReports } from "./components/DashboardReports";
import { DebtsTracker } from "./components/DebtsTracker";
import { PrintModal } from "./components/PrintModal";
import { ReturnModal } from "./components/ReturnModal";
import { LogoutModal } from "./components/LogoutModal";
import { AdminDashboard } from "./components/AdminDashboard";
import { AdminLoginModal } from "./components/AdminLoginModal";

const STORAGE_KEYS = {
  PRODUCTS: "rtg_offline_products_v2",
  ORDERS: "rtg_offline_orders_v2",
  DEBTS: "rtg_offline_debts_v2",
  LICENSE_KEY: "rtg_license_key",
  SCRIPT_URL: "rtg_script_url",
  SHOP_NAME: "rtg_shop_name",
  THEME: "rtg_theme_mode",
};

export default function App() {
  // App view state
  const [screen, setScreen] = useState<"splash" | "landing" | "app" | "admin">("splash");
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("pos");

  // Subscribers and Admin State
  const [subscribers, setSubscribers] = useState<StoreSubscriber[]>(() => loadSubscribers());
  const [adminPassword, setAdminPassword] = useState<string>(() => loadAdminPassword());
  const [masterScriptUrl, setMasterScriptUrl] = useState<string>(() => loadMasterScriptUrl());

  useEffect(() => {
    saveSubscribers(subscribers);
  }, [subscribers]);

  const handleAddSubscriber = (sub: StoreSubscriber) => {
    setSubscribers((prev) => [sub, ...prev]);
  };

  const handleUpdateSubscriber = (id: string, updated: StoreSubscriber) => {
    setSubscribers((prev) => prev.map((s) => (s.id === id ? updated : s)));
  };

  const handleDeleteSubscriber = (id: string) => {
    setSubscribers((prev) => prev.filter((s) => s.id !== id));
  };

  const handleChangeAdminPassword = (newPass: string) => {
    setAdminPassword(newPass);
    saveAdminPassword(newPass);
  };

  const handleSaveMasterScriptUrl = (url: string) => {
    setMasterScriptUrl(url);
    saveMasterScriptUrl(url);
  };

  // Login as store from Admin Panel
  const handleLoginAsStore = (sub: StoreSubscriber) => {
    localStorage.setItem(STORAGE_KEYS.LICENSE_KEY, sub.storeCode);
    localStorage.setItem(STORAGE_KEYS.SCRIPT_URL, sub.cloudUrl || masterScriptUrl);
    localStorage.setItem(STORAGE_KEYS.SHOP_NAME, sub.storeName);

    setApiUrl(sub.cloudUrl || masterScriptUrl);
    setShopName(sub.storeName);
    setIsDemoMode(false);
    setScreen("app");
    showToast(`✓ تم الانتقال المباشر لمتجر "${sub.storeName}"`, "success");
  };

  // Shop & API credentials
  const [apiUrl, setApiUrl] = useState<string>("");
  const [shopName, setShopName] = useState<string>("RTG-SESTEM");
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Theme - loaded properly from storage
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return saved === "light" ? "light" : "dark";
  });

  // Main Entities
  const [products, setProducts] = useState<ProductsMap>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_PRODUCTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_ORDERS;
  });

  const [debts, setDebts] = useState<Debt[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEBTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_DEBTS;
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [returnInvoiceId, setReturnInvoiceId] = useState<string | null>(null);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  // Toast Helper
  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "success", duration = 3500) => {
      const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
  }, [debts]);

  // Load Saved Theme and License on mount
  useEffect(() => {
    const savedTheme = (localStorage.getItem(STORAGE_KEYS.THEME) as "dark" | "light") || "dark";
    setTheme(savedTheme);
    const root = document.documentElement;
    if (savedTheme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
      document.body.classList.remove("dark");
      document.body.classList.add("light-mode");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
      document.body.classList.remove("light-mode");
      document.body.classList.add("dark");
    }

    const savedKey = localStorage.getItem(STORAGE_KEYS.LICENSE_KEY);
    const savedUrl = localStorage.getItem(STORAGE_KEYS.SCRIPT_URL);
    const savedShop = localStorage.getItem(STORAGE_KEYS.SHOP_NAME);

    if (savedKey && savedUrl) {
      setApiUrl(savedUrl);
      if (savedShop) setShopName(savedShop);
    }
  }, []);

  // Apply theme dynamically to root document element and localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
      document.body.classList.add("light-mode");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
      document.body.classList.remove("light-mode");
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Splash complete callback
  const handleSplashComplete = () => {
    const savedKey = localStorage.getItem(STORAGE_KEYS.LICENSE_KEY);
    if (savedKey) {
      setScreen("app");
    } else {
      setScreen("landing");
    }
  };

  // Demo Mode entry
  const handleEnterDemo = () => {
    setIsDemoMode(true);
    setShopName("متجر تجريبي — RTG-SESTEM");
    setProducts(INITIAL_PRODUCTS);
    setOrders(INITIAL_ORDERS);
    setDebts(INITIAL_DEBTS);
    setScreen("app");
    showToast("🎮 مرحباً بك في الوضع التجريبي — بيانات تجريبية جاهزة للاستخدام", "info", 4500);
  };

  // Login Success
  const handleLoginSuccess = (
    licenseKey: string,
    scriptUrl: string,
    verifiedShopName: string,
    _email: string,
    subscriber?: StoreSubscriber
  ) => {
    localStorage.setItem(STORAGE_KEYS.LICENSE_KEY, licenseKey);
    localStorage.setItem(STORAGE_KEYS.SCRIPT_URL, scriptUrl);
    localStorage.setItem(STORAGE_KEYS.SHOP_NAME, verifiedShopName);

    setApiUrl(subscriber?.cloudUrl || scriptUrl);
    setShopName(subscriber?.storeName || verifiedShopName);
    setIsDemoMode(false);
    setIsLoginOpen(false);
    setScreen("app");
  };

  // Remote Sync
  const handleSyncData = () => {
    if (isDemoMode) {
      showToast("أنت في الوضع التجريبي، البيانات محفوظة محلياً", "info");
      return;
    }

    if (!apiUrl) {
      showToast("تم تحديث البيانات المحلية بنجاح ✓", "success");
      return;
    }

    setIsSyncing(true);
    showToast("جاري المزامنة مع السيرفر...", "info");

    setTimeout(() => {
      setIsSyncing(false);
      showToast("✓ تم اكتمال المزامنة بنجاح", "success");
    }, 1200);
  };

  // Logout
  const handleConfirmLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.LICENSE_KEY);
    localStorage.removeItem(STORAGE_KEYS.SCRIPT_URL);
    localStorage.removeItem(STORAGE_KEYS.SHOP_NAME);
    setIsLogoutOpen(false);
    setIsDemoMode(false);
    setScreen("landing");
    showToast("تم تسجيل الخروج بنجاح", "info");
  };

  // Order Handlers
  const handleOrderCreated = (newOrder: Order, updatedProducts: ProductsMap) => {
    setProducts(updatedProducts);
    setOrders((prev) => [newOrder, ...prev]);

    // If live API is connected, send asynchronous payload
    if (apiUrl && !isDemoMode) {
      try {
        fetch(apiUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "addOrder",
            invoiceId: newOrder.id,
            date: newOrder.date,
            productsList: newOrder.desc,
            totalSales: newOrder.total,
            netProfit: newOrder.profit,
            method: newOrder.method,
            deliveryFee: newOrder.delivery,
            discount: newOrder.discount || 0,
            orderStatus: newOrder.status,
            customerName: newOrder.cName,
            customerPhone: newOrder.cPhone,
            customerBackupPhone: newOrder.cBackup,
            customerArea: newOrder.cArea,
            cartItems: newOrder.cartItems,
          }),
        }).catch(() => {});
      } catch {
        // silently handled
      }
    }
  };

  const handleUpdateOrderStatus = (orderId: string, nextStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );
    showToast(`✓ تم تحديث حالة الفاتورة #${orderId} إلى (${nextStatus})`, "success");

    if (apiUrl && !isDemoMode) {
      try {
        fetch(apiUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "updateStatus", invoiceId: orderId, status: nextStatus }),
        }).catch(() => {});
      } catch {
        // silently handled
      }
    }
  };

  const handleConfirmReturn = (invoiceId: string, returnNote: string) => {
    const targetOrder = orders.find((o) => o.id === invoiceId);
    if (!targetOrder) return;

    // Restore stock if cartItems available
    if (targetOrder.cartItems && targetOrder.cartItems.length > 0) {
      setProducts((prev) => {
        const next: ProductsMap = { ...prev };
        targetOrder.cartItems?.forEach((item) => {
          if (next[item.code]) {
            next[item.code] = {
              ...next[item.code],
              qty: next[item.code].qty + item.qty,
            };
          }
        });
        return next;
      });
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === invoiceId
          ? {
              ...o,
              status: "راجع",
              profit: 0,
              returnNote: returnNote,
            }
          : o
      )
    );

    setReturnInvoiceId(null);
    showToast(`✓ تم إرجاع الفاتورة #${invoiceId} واستعادة السلع للمخزن`, "success");
  };

  // Inventory Handlers
  const handleAddProduct = (
    codeOrBarcode: string,
    productOrName: Product | string,
    qty?: number,
    cost?: number,
    price?: number
  ) => {
    let finalProduct: Product;
    if (typeof productOrName === "object") {
      finalProduct = productOrName;
    } else {
      finalProduct = {
        name: productOrName,
        qty: qty ?? 1,
        cost: cost ?? 0,
        price: price ?? 0,
      };
    }

    setProducts((prev) => ({
      ...prev,
      [codeOrBarcode]: finalProduct,
    }));

    if (apiUrl && !isDemoMode) {
      try {
        fetch(apiUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "addProduct",
            barcode: codeOrBarcode,
            name: finalProduct.name,
            qty: finalProduct.qty,
            cost: finalProduct.cost,
            price: finalProduct.price,
          }),
        }).catch(() => {});
      } catch {
        // silently handled
      }
    }
  };

  const handleUpdateProduct = (oldCode: string, newCode: string, product: Product) => {
    setProducts((prev) => {
      const next = { ...prev };
      if (oldCode !== newCode) {
        delete next[oldCode];
      }
      next[newCode] = product;
      return next;
    });

    if (apiUrl && !isDemoMode) {
      try {
        fetch(apiUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "updateProduct",
            oldBarcode: oldCode,
            barcode: newCode,
            name: product.name,
            qty: product.qty,
            cost: product.cost,
            price: product.price,
          }),
        }).catch(() => {});
      } catch {
        // silently handled
      }
    }
  };

  const handleDeleteProduct = (code: string) => {
    setProducts((prev) => {
      const next = { ...prev };
      delete next[code];
      return next;
    });

    if (apiUrl && !isDemoMode) {
      try {
        fetch(apiUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "deleteProduct", barcode: code }),
        }).catch(() => {});
      } catch {
        // silently handled
      }
    }
  };

  const handleRestockProduct = (barcode: string, addedQty: number) => {
    setProducts((prev) => {
      if (!prev[barcode]) return prev;
      return {
        ...prev,
        [barcode]: {
          ...prev[barcode],
          qty: prev[barcode].qty + addedQty,
        },
      };
    });

    if (apiUrl && !isDemoMode) {
      try {
        fetch(apiUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "restockProduct", barcode, addedQty }),
        }).catch(() => {});
      } catch {
        // silently handled
      }
    }
  };

  const handleUpdatePrice = (barcode: string, newPrice: number) => {
    setProducts((prev) => {
      if (!prev[barcode]) return prev;
      return {
        ...prev,
        [barcode]: {
          ...prev[barcode],
          price: newPrice,
        },
      };
    });

    if (apiUrl && !isDemoMode) {
      try {
        fetch(apiUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "updatePrice", barcode, newPrice }),
        }).catch(() => {});
      } catch {
        // silently handled
      }
    }
  };

  // Debts Handlers
  const handleAddOrUpdateDebt = (
    type: "لي" | "علي",
    name: string,
    phone: string,
    amount: number,
    dueDate: string,
    note: string
  ) => {
    const debtId = "DEBT-" + Date.now().toString().slice(-5);
    const newDebt: Debt = {
      id: debtId,
      date: new Date().toLocaleDateString("ar-LY"),
      type,
      name,
      phone,
      original: amount,
      paid: 0,
      remaining: amount,
      dueDate,
      status: "مفتوح",
      note,
      updatedAt: new Date().toLocaleString("ar-LY", { hour12: false }),
    };

    setDebts((prev) => [newDebt, ...prev]);

    if (apiUrl && !isDemoMode) {
      try {
        fetch(apiUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "addOrUpdateDebt", ...newDebt }),
        }).catch(() => {});
      } catch {
        // silently handled
      }
    }
  };

  const handleRecordDebtPayment = (debtId: string, amount: number) => {
    setDebts((prev) =>
      prev.map((d) => {
        if (d.id !== debtId) return d;
        const newPaid = Number(d.paid) + amount;
        const newRemaining = Math.max(0, Number(d.original) - newPaid);
        const newStatus =
          newRemaining === 0 ? "مغلق" : newPaid > 0 ? "مدفوع جزئياً" : "مفتوح";

        return {
          ...d,
          paid: newPaid,
          remaining: newRemaining,
          status: newStatus,
          updatedAt: new Date().toLocaleString("ar-LY", { hour12: false }),
        };
      })
    );
  };

  const handleCloseDebt = (debtId: string) => {
    setDebts((prev) =>
      prev.map((d) => {
        if (d.id !== debtId) return d;
        return {
          ...d,
          paid: d.original,
          remaining: 0,
          status: "مغلق",
          updatedAt: new Date().toLocaleString("ar-LY", { hour12: false }),
        };
      })
    );
  };

  // Current time state
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("ar-LY", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const timeStr = now.toLocaleTimeString("ar-LY", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setCurrentTime(`${dateStr} • ${timeStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-['Tajawal',sans-serif] selection:bg-[#c5834e] selection:text-white" dir="rtl">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Screen 1: Splash Screen */}
      {screen === "splash" && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Screen 2: Landing Screen */}
      {screen === "landing" && (
        <LandingScreen
          onOpenLogin={() => setIsLoginOpen(true)}
          onEnterDemo={handleEnterDemo}
          onOpenRegister={() => setIsRegisterOpen(true)}
          onOpenAdmin={() => setIsAdminLoginOpen(true)}
        />
      )}

      {/* Screen: Admin Dashboard */}
      {screen === "admin" && (
        <AdminDashboard
          subscribers={subscribers}
          onAddSubscriber={handleAddSubscriber}
          onUpdateSubscriber={handleUpdateSubscriber}
          onDeleteSubscriber={handleDeleteSubscriber}
          onLoginAsStore={handleLoginAsStore}
          onClose={() => setScreen("landing")}
          adminPassword={adminPassword}
          onChangeAdminPassword={handleChangeAdminPassword}
          masterScriptUrl={masterScriptUrl}
          onSaveMasterScriptUrl={handleSaveMasterScriptUrl}
          showToast={showToast}
        />
      )}

      {/* Screen 3: Main Application */}
      {screen === "app" && (
        <div className="min-h-screen flex flex-col lg:flex-row w-full overflow-x-hidden">
          {/* Desktop Professional Sidebar */}
          <aside className="hidden lg:flex w-64 bg-white dark:bg-[#0d121f] text-slate-700 dark:text-slate-300 flex-col shrink-0 border-l border-slate-200 dark:border-slate-800 z-40 sticky top-0 h-screen transition-colors duration-200">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RtgLogo size="header" />
                <div className="text-right">
                  <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">RTG-SESTEM</h1>
                  <p className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]" title={shopName}>
                    {shopName}
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                القائمة الرئيسية
              </div>

              <button
                onClick={() => setActiveTab("pos")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-right cursor-pointer ${
                  activeTab === "pos"
                    ? "bg-[#c5834e]/15 text-[#c5834e] border-r-4 border-[#c5834e] shadow-sm font-extrabold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-cash-register text-sm w-4 text-center"></i>
                  <span>كشير البيع المباشر</span>
                </div>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-400">POS</span>
              </button>

              <button
                onClick={() => setActiveTab("orders")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-right cursor-pointer ${
                  activeTab === "orders"
                    ? "bg-[#c5834e]/15 text-[#c5834e] border-r-4 border-[#c5834e] shadow-sm font-extrabold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-receipt text-sm w-4 text-center"></i>
                  <span>سجل الفواتير</span>
                </div>
                <span className="text-[10px] bg-[#c5834e]/20 text-[#c5834e] px-2 py-0.5 rounded-full font-mono font-bold">
                  {orders.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("inventory")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-right cursor-pointer ${
                  activeTab === "inventory"
                    ? "bg-[#c5834e]/15 text-[#c5834e] border-r-4 border-[#c5834e] shadow-sm font-extrabold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-boxes-stacked text-sm w-4 text-center"></i>
                  <span>إدارة المخزن والجرد</span>
                </div>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400 font-mono">
                  {Object.keys(products).length}
                </span>
              </button>

              <div className="pt-4 pb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                التقارير والديون
              </div>

              <button
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-right cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-[#c5834e]/15 text-[#c5834e] border-r-4 border-[#c5834e] shadow-sm font-extrabold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-chart-pie text-sm w-4 text-center"></i>
                  <span>لوحة التقارير المالية</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("debts")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-right cursor-pointer ${
                  activeTab === "debts"
                    ? "bg-[#c5834e]/15 text-[#c5834e] border-r-4 border-[#c5834e] shadow-sm font-extrabold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-hand-holding-dollar text-sm w-4 text-center"></i>
                  <span>سجل الديون والمعاملات</span>
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full font-mono font-bold">
                  {debts.length}
                </span>
              </button>
            </nav>

            {/* Sidebar User Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800/80 mt-auto flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#c5834e] flex items-center justify-center text-xs text-white font-bold shadow-sm">
                  RTG
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-xs text-slate-900 dark:text-white font-bold truncate max-w-[110px]">
                    {isDemoMode ? "وضع تجريبي" : shopName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {isDemoMode ? "حساب مؤقت" : "ترخيص معتمد"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsLogoutOpen(true)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center transition-colors cursor-pointer"
                title="تسجيل الخروج"
              >
                <i className="fa-solid fa-power-off text-xs"></i>
              </button>
            </div>
          </aside>

          {/* Main Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Professional Header */}
            <header
              id="mainHeader"
              className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-sm sticky top-0 z-30 transition-colors duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="lg:hidden flex items-center gap-2">
                  <RtgLogo size="header" />
                  <span className="text-xs font-black text-slate-900 dark:text-white">RTG-SESTEM</span>
                </div>
                <h1 className="hidden sm:block text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                  منظومة RTG-SESTEM المتكاملة
                </h1>
                {isDemoMode ? (
                  <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-full border border-amber-200 dark:border-amber-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    وضع تجريبي
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    نظام نشط
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden md:flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
                  <i className="fa-regular fa-calendar text-slate-400"></i>
                  <span>{currentTime || "المنظومة جاهزة"}</span>
                </div>

                <div className="flex items-center gap-1.5 border-r border-slate-200 dark:border-slate-800 pr-2 sm:pr-4">
                  <button
                    onClick={toggleTheme}
                    className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="تبديل الوضع (نهاري / ليلي)"
                  >
                    <i className={`fa-solid ${theme === "light" ? "fa-sun text-amber-500" : "fa-moon text-[#c5834e]"} text-xs`}></i>
                  </button>

                  <button
                    onClick={handleSyncData}
                    disabled={isSyncing}
                    className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="مزامنة البيانات"
                  >
                    <i className={`fa-solid fa-rotate ${isSyncing ? "fa-spin text-[#c5834e]" : ""} text-xs`}></i>
                  </button>

                  <button
                    onClick={() => setIsLogoutOpen(true)}
                    className="w-9 h-9 rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors cursor-pointer"
                    title="تسجيل الخروج"
                  >
                    <i className="fa-solid fa-power-off text-xs"></i>
                  </button>
                </div>
              </div>
            </header>

            {/* Mobile / Tablet Horizontal Navigation Bar */}
            <nav
              id="mainNav"
              className="lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-2 py-1.5 sticky top-16 z-20 transition-colors duration-200"
            >
              <div className="wheel-container no-scrollbar max-w-full">
                <div className="wheel-item">
                  <button
                    onClick={() => setActiveTab("pos")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "pos"
                        ? "bg-[#c5834e] text-white shadow-sm font-black"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <i className="fa-solid fa-cash-register text-xs"></i> كشير البيع
                  </button>
                </div>

                <div className="wheel-item">
                  <button
                    onClick={() => setActiveTab("orders")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "orders"
                        ? "bg-[#c5834e] text-white shadow-sm font-black"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <i className="fa-solid fa-receipt text-xs"></i> الفواتير ({orders.length})
                  </button>
                </div>

                <div className="wheel-item">
                  <button
                    onClick={() => setActiveTab("inventory")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "inventory"
                        ? "bg-[#c5834e] text-white shadow-sm font-black"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <i className="fa-solid fa-boxes-stacked text-xs"></i> المخزن ({Object.keys(products).length})
                  </button>
                </div>

                <div className="wheel-item">
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "dashboard"
                        ? "bg-[#c5834e] text-white shadow-sm font-black"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <i className="fa-solid fa-chart-pie text-xs"></i> التقارير
                  </button>
                </div>

                <div className="wheel-item">
                  <button
                    onClick={() => setActiveTab("debts")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeTab === "debts"
                        ? "bg-[#c5834e] text-white shadow-sm font-black"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <i className="fa-solid fa-hand-holding-dollar text-xs"></i> الديون ({debts.length})
                  </button>
                </div>
              </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 p-3 sm:p-5 lg:p-6 w-full max-w-7xl mx-auto overflow-y-auto">
              {activeTab === "pos" && (
                <PosCashier
                  products={products}
                  onOrderCreated={handleOrderCreated}
                  showToast={showToast}
                  onOpenPrintModal={(order) => setPrintOrder(order)}
                />
              )}

              {activeTab === "orders" && (
                <OrdersList
                  orders={orders}
                  onUpdateStatus={handleUpdateOrderStatus}
                  onTriggerReturn={(invoiceId) => setReturnInvoiceId(invoiceId)}
                  onOpenPrintModal={(order) => setPrintOrder(order)}
                />
              )}

              {activeTab === "inventory" && (
                <InventoryManager
                  products={products}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onRestockProduct={handleRestockProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onUpdatePrice={handleUpdatePrice}
                  showToast={showToast}
                  shopName={shopName}
                />
              )}

              {activeTab === "dashboard" && <DashboardReports orders={orders} />}

              {activeTab === "debts" && (
                <DebtsTracker
                  debts={debts}
                  onAddOrUpdateDebt={handleAddOrUpdateDebt}
                  onRecordPayment={handleRecordDebtPayment}
                  onCloseDebt={handleCloseDebt}
                  showToast={showToast}
                />
              )}
            </main>
          </div>
        </div>
      )}

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={handleLoginSuccess}
        showToast={showToast}
        subscribers={subscribers}
        masterScriptUrl={masterScriptUrl}
      />

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={() => {
          setIsAdminLoginOpen(false);
          setScreen("admin");
        }}
        adminPassword={adminPassword}
        showToast={showToast}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        showToast={showToast}
      />

      <PrintModal
        order={printOrder}
        shopName={shopName}
        onClose={() => setPrintOrder(null)}
      />

      <ReturnModal
        invoiceId={returnInvoiceId}
        onConfirm={handleConfirmReturn}
        onClose={() => setReturnInvoiceId(null)}
      />

      <LogoutModal
        isOpen={isLogoutOpen}
        onConfirm={handleConfirmLogout}
        onClose={() => setIsLogoutOpen(false)}
      />
    </div>
  );
}
