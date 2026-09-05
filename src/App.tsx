import { useState, useEffect, useCallback, useRef } from "react";
import {
  Product,
  ProductsMap,
  Order,
  Debt,
  ToastMessage,
  ActiveTab,
  StoreSubscriber,
  SubscriptionPlan,
} from "./types";
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_DEBTS } from "./data/initialData";
import {
  loadSubscribers,
  saveSubscribers,
  loadAdminPassword,
  saveAdminPassword,
  loadMasterScriptUrl,
  saveMasterScriptUrl,
  loadSubscriptionPlans,
  saveSubscriptionPlans,
  getSystemCode,
  setSystemCode,
} from "./data/initialStores";
import {
  syncStoreFromCloud,
  cloudAddOrder,
  cloudUpdateOrderStatus,
  cloudRefundOrder,
  cloudSaveProduct,
  cloudDeleteProduct,
  cloudRestockProduct,
  cloudUpdateProductPrice,
  cloudSaveDebt,
  cloudDeleteDebt,
  cloudSaveSubscriber,
  cloudDeleteSubscriber,
  normalizeScriptUrl,
  cloudGetSubscribers,
  cloudGetMasterConfig,
} from "./services/cloudService";
import { soundFx } from "./services/soundEffects";
import { motion, AnimatePresence } from "motion/react";
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
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>(() => loadSubscriptionPlans());
  const [systemCode, setSystemCodeState] = useState<string>(() => getSystemCode());

  useEffect(() => {
    saveSubscribers(subscribers);
  }, [subscribers]);

  // Synchronize with Master Central Cloud on startup for all devices & new phones
  useEffect(() => {
    const url = masterScriptUrl ? masterScriptUrl.trim() : "";
    if (url) {
      cloudGetSubscribers(url)
        .then((cloudStores) => {
          if (cloudStores && Array.isArray(cloudStores) && cloudStores.length > 0) {
            setSubscribers(cloudStores);
            saveSubscribers(cloudStores);
          }
        })
        .catch(() => {});

      cloudGetMasterConfig(url)
        .then((config) => {
          if (config?.plans && Array.isArray(config.plans) && config.plans.length > 0) {
            setSubscriptionPlans(config.plans);
            saveSubscriptionPlans(config.plans);
          }
          if (config?.settings?.systemCode) {
            setSystemCodeState(config.settings.systemCode);
            setSystemCode(config.settings.systemCode);
          }
        })
        .catch(() => {});
    }
  }, [masterScriptUrl]);

  const handleAddSubscriber = (sub: StoreSubscriber) => {
    setSubscribers((prev) => [sub, ...prev]);
    if (masterScriptUrl) {
      cloudSaveSubscriber(masterScriptUrl, sub).catch(() => {});
    }
  };

  const handleUpdateSubscriber = (id: string, updated: StoreSubscriber) => {
    setSubscribers((prev) => prev.map((s) => (s.id === id ? updated : s)));
    if (masterScriptUrl) {
      cloudSaveSubscriber(masterScriptUrl, updated).catch(() => {});
    }
  };

  const handleDeleteSubscriber = (id: string, storeCode?: string, username?: string) => {
    const subToDelete = subscribers.find(
      (s) => s.id === id || (storeCode && s.storeCode === storeCode)
    );
    const finalCode = storeCode || subToDelete?.storeCode || id;
    const finalUser = username || subToDelete?.username || "";

    setSubscribers((prev) =>
      prev.filter((s) => s.id !== id && (!finalCode || s.storeCode !== finalCode))
    );

    if (masterScriptUrl) {
      cloudDeleteSubscriber(masterScriptUrl, finalCode, id, finalUser).catch(() => {});
    }

    // If currently logged into this store, logout cleanly
    const currentStoreCode = localStorage.getItem(STORAGE_KEYS.LICENSE_KEY);
    if (currentStoreCode && (currentStoreCode === finalCode || currentStoreCode === id)) {
      handleConfirmLogout();
    }
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
  const handleLoginAsStore = async (sub: StoreSubscriber) => {
    const rawUrl = sub.cloudUrl || masterScriptUrl;
    const finalUrl = rawUrl ? normalizeScriptUrl(rawUrl).url : "";
    localStorage.setItem(STORAGE_KEYS.LICENSE_KEY, sub.storeCode);
    localStorage.setItem(STORAGE_KEYS.SCRIPT_URL, finalUrl);
    localStorage.setItem(STORAGE_KEYS.SHOP_NAME, sub.storeName);

    setApiUrl(finalUrl);
    setShopName(sub.storeName);
    setIsDemoMode(false);
    setScreen("app");
    showToast(`✓ تم الانتقال المباشر لمتجر "${sub.storeName}"`, "success");

    // Auto sync store data if cloud URL available
    if (finalUrl) {
      setIsSyncing(true);
      try {
        const cloudData = await syncStoreFromCloud(finalUrl);
        if (cloudData && cloudData.success) {
          if (cloudData.products) setProducts(cloudData.products);
          if (cloudData.orders) setOrders(cloudData.orders);
          if (cloudData.debts) setDebts(cloudData.debts);
          const pCount = cloudData.products ? Object.keys(cloudData.products).length : 0;
          showToast(`✓ تم جلب بيانات المتجر بنجاح (${pCount} منتج)`, "success");
        }
      } catch {
        // handled
      } finally {
        setIsSyncing(false);
      }
    }
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

  // Main Entities - Clean initial state: no fake data loaded unless explicit demo mode!
  const [products, setProducts] = useState<ProductsMap>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") return parsed;
      } catch {
        // fallback
      }
    }
    return {};
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
    return [];
  });

  const [debts, setDebts] = useState<Debt[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEBTS);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // fallback
      }
    }
    return [];
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
  const handleLoginSuccess = async (
    licenseKey: string,
    scriptUrl: string,
    verifiedShopName: string,
    _email: string,
    subscriber?: StoreSubscriber
  ) => {
    const rawUrl = subscriber?.cloudUrl || scriptUrl;
    const finalApiUrl = rawUrl ? normalizeScriptUrl(rawUrl).url : "";
    const finalShopName = subscriber?.storeName || verifiedShopName;

    localStorage.setItem(STORAGE_KEYS.LICENSE_KEY, licenseKey);
    localStorage.setItem(STORAGE_KEYS.SCRIPT_URL, finalApiUrl);
    localStorage.setItem(STORAGE_KEYS.SHOP_NAME, finalShopName);

    setApiUrl(finalApiUrl);
    setShopName(finalShopName);
    setIsDemoMode(false);
    setIsLoginOpen(false);
    setScreen("app");
    showToast(`✓ مرحباً بك في متجر "${finalShopName}"`, "success");

    // Automatically sync live data from the store's Google Sheet
    if (finalApiUrl) {
      setIsSyncing(true);
      showToast("جاري جلب بيانات المتجر من الخادم السحابي...", "info", 3500);
      try {
        const cloudData = await syncStoreFromCloud(finalApiUrl);
        if (cloudData && cloudData.success) {
          if (cloudData.products) setProducts(cloudData.products);
          if (cloudData.orders) setOrders(cloudData.orders);
          if (cloudData.debts) setDebts(cloudData.debts);
          const pCount = cloudData.products ? Object.keys(cloudData.products).length : 0;
          const oCount = cloudData.orders ? cloudData.orders.length : 0;
          showToast(`✓ تم استلام بيانات متجرك بنجاح (${pCount} منتج، ${oCount} فاتورة)`, "success", 4000);
        } else {
          showToast("تم تسجيل الدخول. لم يتم العثور على منتجات سابقة في الشيت أو جاري تجهيزه", "info", 4000);
        }
      } catch (err) {
        console.error("Auto sync on login error:", err);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // Remote Sync
  const handleSyncData = async () => {
    if (isDemoMode) {
      showToast("أنت في الوضع التجريبي — البيانات محفوظة محلياً للتجربة", "info");
      return;
    }

    if (!apiUrl) {
      showToast("يرجى ربط رابط خادم المتجر لتفعيل المزامنة مع جوجل شيت", "info");
      return;
    }

    setIsSyncing(true);
    showToast("جاري المزامنة مع جدول جوجل شيت...", "info", 5000);

    try {
      const cloudData = await syncStoreFromCloud(apiUrl);
      if (cloudData && cloudData.success) {
        const pCount = cloudData.products ? Object.keys(cloudData.products).length : 0;
        const oCount = cloudData.orders ? cloudData.orders.length : 0;
        const dCount = cloudData.debts ? cloudData.debts.length : 0;

        if (cloudData.products) setProducts(cloudData.products);
        if (cloudData.orders) setOrders(cloudData.orders);
        if (cloudData.debts) setDebts(cloudData.debts);

        showToast(
          `✓ اكتملت المزامنة بنجاح! (${pCount} منتج، ${oCount} فاتورة، ${dCount} دين)`,
          "success",
          4000
        );
      } else {
        showToast("تعذر جلب البيانات، تأكد من صحة الرابط ونشره بصلاحية Anyone", "error", 5000);
      }
    } catch (e) {
      console.error("Manual sync error:", e);
      showToast("فشل الاتصال بالخادم السحابي", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  // Logout
  const handleConfirmLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.LICENSE_KEY);
    localStorage.removeItem(STORAGE_KEYS.SCRIPT_URL);
    localStorage.removeItem(STORAGE_KEYS.SHOP_NAME);
    setIsLogoutOpen(false);
    setIsDemoMode(false);
    setApiUrl("");
    setShopName("RTG-SYSTEM");
    setProducts({});
    setOrders([]);
    setDebts([]);
    setScreen("landing");
    showToast("تم تسجيل الخروج بنجاح", "info");
  };

  // Helper to extract items to restore from an order
  const extractOrderItems = (
    order: Order,
    currentProducts: ProductsMap
  ): { code: string; qty: number; name: string }[] => {
    if (order.cartItems && order.cartItems.length > 0) {
      return order.cartItems.map((item) => ({
        code: item.code,
        qty: Number(item.qty) || 1,
        name: item.name,
      }));
    }

    const items: { code: string; qty: number; name: string }[] = [];
    const parts = (order.desc || "").split(/[،,\n]/);

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      const match = trimmed.match(
        /^(\d+(?:\.\d+)?)\s*[xX×*]\s*(?:\[([^\]]+)\])?\s*(.*)$/
      );
      if (match) {
        const qty = parseFloat(match[1]) || 1;
        let code = match[2] ? match[2].trim() : "";
        const rawName = match[3] ? match[3].trim() : trimmed;

        if (!code) {
          const foundKey = Object.keys(currentProducts).find(
            (k) =>
              currentProducts[k].name.trim().toLowerCase() ===
              rawName.toLowerCase()
          );
          code = foundKey || rawName;
        }

        items.push({ code, qty, name: rawName });
      } else {
        const codeMatch = trimmed.match(/\[([^\]]+)\]/);
        let code = codeMatch ? codeMatch[1].trim() : "";
        const cleanName = trimmed.replace(/\[[^\]]+\]/, "").trim();

        if (!code) {
          const foundKey = Object.keys(currentProducts).find(
            (k) =>
              currentProducts[k].name.trim().toLowerCase() ===
              cleanName.toLowerCase()
          );
          code = foundKey || cleanName;
        }

        items.push({ code, qty: 1, name: cleanName });
      }
    }

    return items;
  };

  // High-frequency Real-time Synchronization Loop
  const isSyncingRef = useRef(false);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  const performInstantSync = useCallback(
    async (isSilent = true) => {
      if (!apiUrl || isDemoMode || screen !== "app" || isSyncingRef.current) return;
      isSyncingRef.current = true;
      if (!isSilent) setIsSyncing(true);

      try {
        const cloudData = await syncStoreFromCloud(apiUrl);
        if (cloudData && cloudData.success) {
          if (cloudData.products && Object.keys(cloudData.products).length > 0) {
            setProducts((prev) => {
              const prevStr = JSON.stringify(prev);
              const nextStr = JSON.stringify(cloudData.products);
              return prevStr !== nextStr ? cloudData.products! : prev;
            });
          }
          if (cloudData.orders && cloudData.orders.length > 0) {
            setOrders((prev) => {
              const prevStr = JSON.stringify(prev);
              const nextStr = JSON.stringify(cloudData.orders);
              return prevStr !== nextStr ? cloudData.orders! : prev;
            });
          }
          if (cloudData.debts) {
            setDebts((prev) => {
              const prevStr = JSON.stringify(prev);
              const nextStr = JSON.stringify(cloudData.debts);
              return prevStr !== nextStr ? cloudData.debts! : prev;
            });
          }
        }
      } catch {
        // Silent catch for continuous synchronization
      } finally {
        isSyncingRef.current = false;
        if (!isSilent) setIsSyncing(false);
      }
    },
    [apiUrl, isDemoMode, screen]
  );

  const triggerInstantCloudSync = useCallback(
    (delayMs = 300) => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        performInstantSync(true);
      }, delayMs);
    },
    [performInstantSync]
  );

  // Auto poll continuously every 3 seconds, plus on focus/visibility
  useEffect(() => {
    if (!apiUrl || isDemoMode || screen !== "app") return;

    const interval = setInterval(() => {
      performInstantSync(true);
    }, 3000);

    const handleFocus = () => {
      performInstantSync(true);
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [apiUrl, isDemoMode, screen, performInstantSync]);

  // Fast sync on tab change
  useEffect(() => {
    triggerInstantCloudSync(100);
  }, [activeTab, triggerInstantCloudSync]);

  // Order Handlers
  const handleOrderCreated = (newOrder: Order, updatedProducts: ProductsMap) => {
    setProducts(updatedProducts);
    setOrders((prev) => [newOrder, ...prev]);

    // Send real-time addition to Google Sheet
    if (apiUrl && !isDemoMode) {
      cloudAddOrder(apiUrl, newOrder).catch(() => {});
      triggerInstantCloudSync(500);
    }
  };

  const handleUpdateOrderStatus = (orderId: string, nextStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );
    showToast(`✓ تم تحديث حالة الفاتورة #${orderId} إلى (${nextStatus})`, "success");

    if (apiUrl && !isDemoMode) {
      cloudUpdateOrderStatus(apiUrl, orderId, nextStatus).catch(() => {});
      triggerInstantCloudSync(400);
    }
  };

  const handleConfirmReturn = (invoiceId: string, returnNote: string) => {
    const targetOrder = orders.find((o) => o.id === invoiceId);
    if (!targetOrder) return;

    if (targetOrder.status === "مرتجع" || targetOrder.status === "راجع") {
      showToast("هذه الفاتورة تم إرجاعها بالفعل سابقاً", "info");
      setReturnInvoiceId(null);
      return;
    }

    // 1. Extract items to restore from this order and aggregate quantities
    const rawItems = extractOrderItems(targetOrder, products);
    const aggregatedMap: Record<string, { code: string; qty: number; name: string }> = {};
    rawItems.forEach((item) => {
      if (aggregatedMap[item.code]) {
        aggregatedMap[item.code].qty += item.qty;
      } else {
        aggregatedMap[item.code] = { ...item };
      }
    });
    const itemsToRestore = Object.values(aggregatedMap);

    // 2. Replenish inventory stock immediately (EXACTLY ONCE)
    setProducts((prev) => {
      const next: ProductsMap = { ...prev };
      itemsToRestore.forEach((item) => {
        if (next[item.code]) {
          next[item.code] = {
            ...next[item.code],
            qty: Math.max(0, next[item.code].qty + item.qty),
          };
        } else {
          // If not found by barcode key, match by name
          const keyByName = Object.keys(next).find(
            (k) => next[k].name.trim().toLowerCase() === item.name.trim().toLowerCase()
          );
          if (keyByName) {
            next[keyByName] = {
              ...next[keyByName],
              qty: Math.max(0, next[keyByName].qty + item.qty),
            };
          }
        }
      });
      return next;
    });

    // 3. Mark order as returned with zero profit
    setOrders((prev) =>
      prev.map((o) =>
        o.id === invoiceId
          ? {
              ...o,
              status: "مرتجع",
              profit: 0,
              returnNote: returnNote,
            }
          : o
      )
    );

    // 4. Send cloud updates: ONLY call cloudRefundOrder
    // NOTE: cloudRefundOrder in Google Apps Script already restocks items.
    // Calling cloudRestockProduct here caused items to be restocked twice!
    if (apiUrl && !isDemoMode) {
      cloudRefundOrder(apiUrl, invoiceId, itemsToRestore, returnNote).catch(() => {});
      triggerInstantCloudSync(400);
    }

    setReturnInvoiceId(null);
    soundFx.playReturn();
    showToast(`✓ تم إرجاع الفاتورة #${invoiceId} واستعادة السلع للمخزن بنجاح`, "success");
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
      cloudSaveProduct(apiUrl, codeOrBarcode, finalProduct).catch(() => {});
      triggerInstantCloudSync(400);
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
        // Save/update product with both old and new barcode
        cloudSaveProduct(apiUrl, newCode, product, oldCode).catch(() => {});
        // If barcode changed, delete old barcode row as a safety measure for backwards compatibility
        if (oldCode && oldCode !== newCode) {
          cloudDeleteProduct(apiUrl, oldCode).catch(() => {});
        }
      } catch {
        // silently handled
      }
      triggerInstantCloudSync(500);
    }
  };

  const handleDeleteProduct = (code: string) => {
    setProducts((prev) => {
      const next = { ...prev };
      delete next[code];
      return next;
    });

    if (apiUrl && !isDemoMode) {
      cloudDeleteProduct(apiUrl, code).catch(() => {});
      triggerInstantCloudSync(400);
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
      cloudRestockProduct(apiUrl, barcode, addedQty).catch(() => {});
      triggerInstantCloudSync(400);
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
      cloudUpdateProductPrice(apiUrl, barcode, newPrice).catch(() => {});
      triggerInstantCloudSync(400);
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
      cloudSaveDebt(apiUrl, newDebt).catch(() => {});
      triggerInstantCloudSync(400);
    }
  };

  const handleRecordDebtPayment = (debtId: string, amount: number) => {
    let updatedDebt: Debt | null = null;
    setDebts((prev) =>
      prev.map((d) => {
        if (d.id !== debtId) return d;
        const newPaid = Number(d.paid) + amount;
        const newRemaining = Math.max(0, Number(d.original) - newPaid);
        const newStatus =
          newRemaining === 0 ? "مغلق" : newPaid > 0 ? "مدفوع جزئياً" : "مفتوح";

        const updated: Debt = {
          ...d,
          paid: newPaid,
          remaining: newRemaining,
          status: newStatus,
          updatedAt: new Date().toLocaleString("ar-LY", { hour12: false }),
        };
        updatedDebt = updated;
        return updated;
      })
    );

    if (apiUrl && !isDemoMode && updatedDebt) {
      cloudSaveDebt(apiUrl, updatedDebt).catch(() => {});
      triggerInstantCloudSync(400);
    }
  };

  const handleCloseDebt = (debtId: string) => {
    let updatedDebt: Debt | null = null;
    setDebts((prev) =>
      prev.map((d) => {
        if (d.id !== debtId) return d;
        const updated: Debt = {
          ...d,
          paid: d.original,
          remaining: 0,
          status: "مغلق",
          updatedAt: new Date().toLocaleString("ar-LY", { hour12: false }),
        };
        updatedDebt = updated;
        return updated;
      })
    );

    if (apiUrl && !isDemoMode && updatedDebt) {
      cloudSaveDebt(apiUrl, updatedDebt).catch(() => {});
      triggerInstantCloudSync(400);
    }
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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#121418] text-slate-900 dark:text-slate-100 font-['Tajawal',sans-serif] selection:bg-[#c5834e] selection:text-white" dir="rtl">
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
          subscriptionPlans={subscriptionPlans}
        />
      )}

      {/* Screen: Admin Dashboard */}
      {screen === "admin" && (
        <AdminDashboard
          subscribers={subscribers}
          onAddSubscriber={handleAddSubscriber}
          onUpdateSubscriber={handleUpdateSubscriber}
          onDeleteSubscriber={handleDeleteSubscriber}
          onSyncSubscribers={(newSubs) => setSubscribers(newSubs)}
          onLoginAsStore={handleLoginAsStore}
          onClose={() => setScreen("landing")}
          adminPassword={adminPassword}
          onChangeAdminPassword={handleChangeAdminPassword}
          masterScriptUrl={masterScriptUrl}
          onSaveMasterScriptUrl={handleSaveMasterScriptUrl}
          subscriptionPlans={subscriptionPlans}
          onSaveSubscriptionPlans={(newPlans) => {
            setSubscriptionPlans(newPlans);
            saveSubscriptionPlans(newPlans);
          }}
          systemCode={systemCode}
          onChangeSystemCode={(code) => {
            setSystemCodeState(code);
            setSystemCode(code);
          }}
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
                  <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">RTG-SYSTEM</h1>
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

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab("pos");
                }}
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
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab("orders");
                }}
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
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab("inventory");
                }}
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
              </motion.button>

              <div className="pt-4 pb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                التقارير والديون
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab("dashboard");
                }}
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
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab("debts");
                }}
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
              </motion.button>
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
                  <span className="text-xs font-black text-slate-900 dark:text-white">RTG-SYSTEM</span>
                </div>
                <h1 className="hidden sm:block text-sm sm:text-base font-bold text-slate-800 dark:text-white">
                  منظومة RTG-SYSTEM المتكاملة
                </h1>
                {isDemoMode ? (
                  <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-full border border-amber-200 dark:border-amber-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    وضع تجريبي
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      نظام نشط
                    </span>
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-full text-[10px] font-bold text-blue-700 dark:text-blue-400">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                      <span>مزامنة لحظية مستمرة</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden md:flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
                  <i className="fa-regular fa-calendar text-slate-400"></i>
                  <span>{currentTime || "المنظومة جاهزة"}</span>
                </div>

                <div className="flex items-center gap-1.5 border-r border-slate-200 dark:border-slate-800 pr-2 sm:pr-4">
                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                      soundFx.playClick();
                      toggleTheme();
                    }}
                    className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title={theme === "dark" ? "التبديل إلى الوضع النهاري (Light Mode)" : "التبديل إلى الوضع الليلي (Dark Mode)"}
                  >
                    <i className={`fa-solid ${theme === "dark" ? "fa-sun text-amber-400" : "fa-moon text-indigo-500"} text-xs`}></i>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      soundFx.playClick();
                      handleSyncData();
                    }}
                    disabled={isSyncing}
                    className="h-9 px-2.5 sm:px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer text-xs font-bold"
                    title="تحديث ومزامنة فورية مع جوجل شيت"
                  >
                    <i className={`fa-solid fa-rotate ${isSyncing ? "fa-spin text-[#c5834e]" : "text-slate-400"} text-xs`}></i>
                    <span className="hidden md:inline">{isSyncing ? "جاري التحديث..." : "تحديث فوري"}</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                      soundFx.playClick();
                      setIsLogoutOpen(true);
                    }}
                    className="w-9 h-9 rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors cursor-pointer"
                    title="تسجيل الخروج"
                  >
                    <i className="fa-solid fa-power-off text-xs"></i>
                  </motion.button>
                </div>
              </div>
            </header>

            {/* Mobile / Tablet Horizontal Navigation Bar */}
            <nav
              id="mainNav"
              className="lg:hidden bg-white/95 dark:bg-[#0d121f]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 py-2 sticky top-16 z-20 transition-colors duration-200 shadow-xs"
            >
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x py-0.5">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    soundFx.playClick();
                    setActiveTab("pos");
                  }}
                  className={`shrink-0 whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === "pos"
                      ? "bg-gradient-to-r from-[#c5834e] to-[#a6632f] text-white shadow-md shadow-[#c5834e]/25 scale-[1.02]"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <i className="fa-solid fa-cash-register text-xs"></i>
                  <span>كاشير البيع</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    soundFx.playClick();
                    setActiveTab("orders");
                  }}
                  className={`shrink-0 whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === "orders"
                      ? "bg-gradient-to-r from-[#c5834e] to-[#a6632f] text-white shadow-md shadow-[#c5834e]/25 scale-[1.02]"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <i className="fa-solid fa-receipt text-xs"></i>
                  <span>الفواتير</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      activeTab === "orders"
                        ? "bg-white/20 text-white"
                        : "bg-[#c5834e]/15 text-[#c5834e]"
                    }`}
                  >
                    {orders.length}
                  </span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    soundFx.playClick();
                    setActiveTab("inventory");
                  }}
                  className={`shrink-0 whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === "inventory"
                      ? "bg-gradient-to-r from-[#c5834e] to-[#a6632f] text-white shadow-md shadow-[#c5834e]/25 scale-[1.02]"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <i className="fa-solid fa-boxes-stacked text-xs"></i>
                  <span>المخزن</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      activeTab === "inventory"
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {Object.keys(products).length}
                  </span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    soundFx.playClick();
                    setActiveTab("dashboard");
                  }}
                  className={`shrink-0 whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === "dashboard"
                      ? "bg-gradient-to-r from-[#c5834e] to-[#a6632f] text-white shadow-md shadow-[#c5834e]/25 scale-[1.02]"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <i className="fa-solid fa-chart-pie text-xs"></i>
                  <span>التقارير</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    soundFx.playClick();
                    setActiveTab("debts");
                  }}
                  className={`shrink-0 whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === "debts"
                      ? "bg-gradient-to-r from-[#c5834e] to-[#a6632f] text-white shadow-md shadow-[#c5834e]/25 scale-[1.02]"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <i className="fa-solid fa-hand-holding-dollar text-xs"></i>
                  <span>الديون</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      activeTab === "debts"
                        ? "bg-white/20 text-white"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {debts.length}
                  </span>
                </motion.button>
              </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 p-3 sm:p-5 lg:p-6 w-full max-w-7xl mx-auto overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
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
                      shopName={shopName || "RTG-SESTEM"}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
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
        onSubscribersRefreshed={(newSubs) => setSubscribers(newSubs)}
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
