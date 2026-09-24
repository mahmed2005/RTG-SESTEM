/**
 * RTG-SESTEM — Cloud Synchronization Service
 * Handles two-way real-time communication between RTG-SESTEM and Google Apps Script Web Apps
 */

import { Debt, Order, Product, ProductsMap, StoreSubscriber, SubscriptionPlan, MasterSettings, StoreUser, StorePermission } from "../types";

/**
 * Sanitize and normalize Google Apps Script Web App URLs
 * Converts /edit or /dev to /exec, strips trailing spaces/quotes, and validates format.
 */
export function normalizeScriptUrl(rawUrl: string): { url: string; warning?: string } {
  if (!rawUrl) return { url: "" };
  let url = rawUrl.trim().replace(/^["']|["']$/g, "").trim();

  // Check if user accidentally pasted a Google Sheets spreadsheet URL
  if (url.includes("docs.google.com/spreadsheets")) {
    return {
      url,
      warning:
        "تنبيه: لقد قمت بلصق رابط ملف جوجل شيت وليس رابط تطبيق الويب (Web App URL). يرجى نسخ الرابط من: نشر (Deploy) -> تطبيق ويب (Web app).",
    };
  }

  // If it's a script.google.com macros link, ensure it points to /exec
  if (url.includes("script.google.com/macros/s/")) {
    url = url.replace(/\/edit(#.*)?$/, "/exec").replace(/\/dev(#.*)?$/, "/exec");
    if (!url.includes("/exec")) {
      url = url.replace(/\/?$/, "/exec");
    }
  }

  return { url };
}

/**
 * Send an action payload to Apps Script (via POST with fallback)
 */
export async function sendCloudAction(url: string, payload: Record<string, any>): Promise<boolean> {
  const { url: cleanUrl } = normalizeScriptUrl(url);
  if (!cleanUrl || !cleanUrl.startsWith("http")) return false;

  try {
    // 1. Primary: POST request with text/plain to avoid CORS preflight rejection
    await fetch(cleanUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (err) {
    // 2. Secondary fallback: GET request with parameters (for simple payloads)
    try {
      const u = new URL(cleanUrl);
      u.searchParams.set("action", payload.action || "");
      if (payload.barcode) u.searchParams.set("barcode", payload.barcode);
      if (payload.storeCode) u.searchParams.set("storeCode", payload.storeCode);
      if (payload.id) u.searchParams.set("id", payload.id);
      if (payload.invoiceId) u.searchParams.set("invoiceId", payload.invoiceId);
      u.searchParams.set("_t", Date.now().toString());

      await fetch(u.toString(), { mode: "no-cors" });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Read data from Apps Script via safe fetch
 * Handles standard JSON, JSONP wrappers, and timeouts without DOM script injection or cross-origin errors
 */
export async function fetchCloudData<T>(
  url: string,
  action: string,
  params: Record<string, string> = {}
): Promise<T | null> {
  const { url: cleanUrl } = normalizeScriptUrl(url);
  if (!cleanUrl || !cleanUrl.startsWith("http")) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const urlObj = new URL(cleanUrl);
    urlObj.searchParams.set("action", action);
    Object.entries(params).forEach(([k, v]) => urlObj.searchParams.set(k, v));
    urlObj.searchParams.set("_t", Date.now().toString());

    const res = await fetch(urlObj.toString(), {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json, text/plain, */*",
      },
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const text = await res.text();
      const trimmed = text.trim();

      // Standard JSON response
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          return JSON.parse(trimmed) as T;
        } catch {}
      }

      // JSONP callback wrapper: callback_name({...})
      const jsonpMatch = trimmed.match(/^[a-zA-Z0-9_$]+\s*\(([\s\S]*)\)\s*;?$/);
      if (jsonpMatch && jsonpMatch[1]) {
        try {
          return JSON.parse(jsonpMatch[1]) as T;
        } catch {}
      }
    }
  } catch {
    // Network errors, timeouts, or CORS restrictions handled gracefully without throwing unhandled exceptions
  } finally {
    clearTimeout(timeoutId);
  }

  return null;
}

// ==========================================
// STORE ACTIONS (قالب المتجر - الملف 2)
// ==========================================

export interface StoreSyncResult {
  success: boolean;
  products?: ProductsMap;
  orders?: Order[];
  debts?: Debt[];
  users?: StoreUser[];
  message?: string;
}

/**
 * Fetch full store database (Products, Orders, Debts, Users) from Google Sheet
 */
export async function syncStoreFromCloud(scriptUrl: string): Promise<StoreSyncResult | null> {
  return fetchCloudData<StoreSyncResult>(scriptUrl, "getStoreData");
}

/**
 * Add Order to Google Sheet & automatically decrement inventory
 */
export async function cloudAddOrder(scriptUrl: string, order: Order): Promise<void> {
  await sendCloudAction(scriptUrl, {
    action: "addOrder",
    invoiceId: order.id,
    date: order.date,
    productsList: order.desc,
    totalSales: order.total,
    netProfit: order.profit,
    method: order.method,
    deliveryFee: order.delivery,
    discount: order.discount || 0,
    orderStatus: order.status,
    customerName: order.cName,
    customerPhone: order.cPhone,
    customerBackupPhone: order.cBackup,
    customerArea: order.cArea,
    cartItems: order.cartItems,
    cashierName: order.cashierName || "",
  });
}

/**
 * Update Order status in Google Sheet
 */
export async function cloudUpdateOrderStatus(
  scriptUrl: string,
  invoiceId: string,
  status: string
): Promise<void> {
  await sendCloudAction(scriptUrl, {
    action: "updateStatus",
    invoiceId,
    status,
  });
}

/**
 * Refund Order: marks order as "راجع" and restores stock in Google Sheet
 */
export async function cloudRefundOrder(
  scriptUrl: string,
  invoiceId: string,
  itemsToRestore?: { code: string; qty: number }[] | string,
  returnNote?: string
): Promise<void> {
  const items = Array.isArray(itemsToRestore) ? itemsToRestore : undefined;
  const note = typeof itemsToRestore === "string" ? itemsToRestore : returnNote;
  await sendCloudAction(scriptUrl, {
    action: "refundOrder",
    invoiceId,
    items,
    note,
  });
}

/**
 * Add or Update Product in Google Sheet
 */
export async function cloudSaveProduct(
  scriptUrl: string,
  barcode: string,
  product: Product,
  oldBarcode?: string
): Promise<void> {
  await sendCloudAction(scriptUrl, {
    action: oldBarcode && oldBarcode !== barcode ? "updateProduct" : "addProduct",
    oldBarcode,
    barcode,
    name: product.name,
    qty: product.qty,
    cost: product.cost,
    price: product.price,
  });
}

/**
 * Delete Product row from Google Sheet
 */
export async function cloudDeleteProduct(scriptUrl: string, barcode: string): Promise<void> {
  await sendCloudAction(scriptUrl, {
    action: "deleteProduct",
    barcode,
  });
}

/**
 * Restock Product quantity in Google Sheet
 */
export async function cloudRestockProduct(
  scriptUrl: string,
  barcode: string,
  addedQty: number
): Promise<void> {
  await sendCloudAction(scriptUrl, {
    action: "restockProduct",
    barcode,
    addedQty,
  });
}

/**
 * Update Product selling price in Google Sheet
 */
export async function cloudUpdateProductPrice(
  scriptUrl: string,
  barcode: string,
  newPrice: number
): Promise<void> {
  await sendCloudAction(scriptUrl, {
    action: "updatePrice",
    barcode,
    newPrice,
  });
}

/**
 * Add or Update Debt in Google Sheet
 */
export async function cloudSaveDebt(scriptUrl: string, debt: Debt): Promise<void> {
  await sendCloudAction(scriptUrl, {
    action: "addOrUpdateDebt",
    ...debt,
  });
}

/**
 * Delete Debt row from Google Sheet
 */
export async function cloudDeleteDebt(scriptUrl: string, debtId: string): Promise<void> {
  await sendCloudAction(scriptUrl, {
    action: "deleteDebt",
    id: debtId,
  });
}

// ==========================================
// MASTER SERVER ACTIONS (المشتركون - الملف 1)
// ==========================================

export interface MasterSubscribersResult {
  success: boolean;
  stores?: StoreSubscriber[];
  message?: string;
}

/**
 * Fetch all subscribers from Master Google Sheet
 */
export async function cloudGetSubscribers(
  masterScriptUrl: string
): Promise<StoreSubscriber[] | null> {
  const res = await fetchCloudData<MasterSubscribersResult>(masterScriptUrl, "getAllStores");
  if (res && res.success && Array.isArray(res.stores)) {
    return res.stores;
  }
  return null;
}

/**
 * Add or Update Subscriber in Master Google Sheet
 */
export async function cloudSaveSubscriber(
  masterScriptUrl: string,
  subscriber: StoreSubscriber
): Promise<void> {
  await sendCloudAction(masterScriptUrl, {
    action: "addOrUpdateStore",
    ...subscriber,
  });
}

/**
 * Delete Subscriber row from Master Google Sheet
 */
export async function cloudDeleteSubscriber(
  masterScriptUrl: string,
  storeCode: string,
  id?: string,
  username?: string
): Promise<void> {
  await sendCloudAction(masterScriptUrl, {
    action: "deleteStore",
    storeCode,
    id,
    username,
  });
}

export interface MasterConfigResult {
  success: boolean;
  status?: string;
  settings?: MasterSettings;
  plans?: SubscriptionPlan[];
  system?: string;
  message?: string;
}

/**
 * Fetch Settings & Subscription Plans from Master Central Cloud
 */
export async function cloudGetMasterConfig(
  masterScriptUrl: string
): Promise<MasterConfigResult | null> {
  const res = await fetchCloudData<MasterConfigResult>(masterScriptUrl, "getMasterConfig");
  if (res && res.success) {
    return res;
  }
  return null;
}

/**
 * Save Master Settings (Script URL, admin password, system code) to Master Central Cloud
 */
export async function cloudSaveMasterSettings(
  masterScriptUrl: string,
  settings: Record<string, any>
): Promise<boolean> {
  // 1. Try POST
  const ok = await sendCloudAction(masterScriptUrl, {
    action: "saveSettings",
    settings,
    ...settings,
  });

  // 2. Also try GET fallback to guarantee saving even across restricted networks
  try {
    const { url: cleanUrl } = normalizeScriptUrl(masterScriptUrl);
    if (cleanUrl) {
      const u = new URL(cleanUrl);
      u.searchParams.set("action", "updateSettings");
      Object.entries(settings).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          u.searchParams.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
        }
      });
      u.searchParams.set("_t", Date.now().toString());
      fetch(u.toString(), { mode: "no-cors" }).catch(() => {});
    }
  } catch {}

  return ok;
}

/**
 * Save Subscription Plans array to Master Central Cloud
 */
export async function cloudSaveSubscriptionPlans(
  masterScriptUrl: string,
  plans: SubscriptionPlan[]
): Promise<boolean> {
  return await sendCloudAction(masterScriptUrl, {
    action: "savePlans",
    plans,
  });
}

/**
 * Save Social Media Links to Central Cloud Google Sheet
 */
export async function cloudSaveSocialLinks(
  masterScriptUrl: string,
  socialLinks: { whatsapp: string; instagram: string; tiktok: string; facebook: string }
): Promise<boolean> {
  return await sendCloudAction(masterScriptUrl, {
    action: "saveSocialLinks",
    socialLinks,
  });
}

/**
 * Get Social Media Links from Central Cloud Google Sheet
 */
export async function cloudGetSocialLinks(
  masterScriptUrl: string
): Promise<{ whatsapp: string; instagram: string; tiktok: string; facebook: string } | null> {
  const res = await fetchCloudData<{
    success?: boolean;
    socialLinks?: { whatsapp: string; instagram: string; tiktok: string; facebook: string };
  }>(masterScriptUrl, "getSocialLinks");

  if (res && res.socialLinks) {
    return res.socialLinks;
  }
  return null;
}

/**
 * Test Master Server connection and fetch current setup
 */
export async function cloudTestMasterConnection(
  url: string
): Promise<{
  success: boolean;
  message: string;
  config?: MasterConfigResult | null;
  stores?: StoreSubscriber[] | null;
}> {
  const { url: cleanUrl, warning } = normalizeScriptUrl(url);
  if (!cleanUrl) {
    return { success: false, message: "يرجى إدخال رابط الخادم السحابي أولاً" };
  }
  if (warning) {
    return { success: false, message: warning };
  }

  try {
    // Check config first
    const config = await cloudGetMasterConfig(cleanUrl);
    const stores = await cloudGetSubscribers(cleanUrl);

    if (config || stores) {
      const storesCount = stores ? stores.length : 0;
      return {
        success: true,
        message: `تم الاتصال بنجاح بالخادم المركزي ✓ (المشتركون: ${storesCount})`,
        config,
        stores,
      };
    }

    // Ping check fallback
    const ping = await fetchCloudData<{ status?: string; system?: string }>(cleanUrl, "ping");
    if (ping && (ping.status === "online" || ping.system)) {
      return {
        success: true,
        message: "تم الاتصال بنجاح بالخادم السحابي ✓",
        config: null,
        stores: null,
      };
    }

    return {
      success: false,
      message: "لم يتمكن النظام من استلام استجابة من الخادم السحابي. يرجى التحقق من نشر السكربت (Execute as Me, Who has access: Anyone).",
    };
  } catch (e: any) {
    return {
      success: false,
      message: `خطأ في الاتصال: ${e?.message || "تعذر الوصول إلى الخادم"}`,
    };
  }
}

/**
 * Directly fetch or verify admin password from central master sheet
 */
export async function cloudFetchMasterAdminPassword(
  masterScriptUrl: string
): Promise<string | null> {
  const { url: cleanUrl } = normalizeScriptUrl(masterScriptUrl);
  if (!cleanUrl) return null;

  try {
    // 1. Try verifyAdminPassword lightweight action
    const verifyRes = await fetchCloudData<{
      success?: boolean;
      adminPassword?: string;
    }>(cleanUrl, "verifyAdminPassword");

    if (verifyRes && verifyRes.adminPassword) {
      return String(verifyRes.adminPassword).trim();
    }

    // 2. Fallback to getMasterConfig
    const config = await cloudGetMasterConfig(cleanUrl);
    if (config?.settings?.adminPassword) {
      return String(config.settings.adminPassword).trim();
    }
  } catch {}

  return null;
}

// ==========================================
// STORE USERS & RBAC PERMISSIONS ACTIONS
// ==========================================

export interface EmployeeLoginResult {
  success: boolean;
  user?: StoreUser;
  message?: string;
}

/**
 * Verify employee credentials against Client Sheet (Users sheet)
 */
export async function cloudLoginEmployee(
  storeScriptUrl: string,
  username: string,
  password: string
): Promise<EmployeeLoginResult> {
  const { url: cleanUrl } = normalizeScriptUrl(storeScriptUrl);
  if (!cleanUrl) {
    return { success: false, message: "رابط خادم المتجر غير متوفر" };
  }

  const cleanUser = username.trim();
  const cleanPass = password.trim();

  // Try action: "login" first, then "login_user"
  const actions = ["login", "login_user"];
  for (const act of actions) {
    try {
      const res = await fetchCloudData<EmployeeLoginResult & { valid?: boolean; role?: string }>(cleanUrl, act, {
        username: cleanUser,
        userTitle: cleanUser,
        password: cleanPass,
      });

      if (res && (res.success || res.valid) && res.user) {
        // Ensure permissions is an array
        let rawPerms = res.user.permissions as unknown;
        let perms: StorePermission[] = [];
        if (typeof rawPerms === "string") {
          try {
            perms = JSON.parse(rawPerms);
          } catch {
            perms = (rawPerms as string).split(",").map((p) => p.trim()) as StorePermission[];
          }
        } else if (Array.isArray(rawPerms)) {
          perms = rawPerms as StorePermission[];
        }
        return {
          success: true,
          user: {
            ...res.user,
            permissions: Array.isArray(perms) && perms.length > 0 ? perms : ["pos"],
          },
        };
      }

      if (res && res.message && (res.message.includes("معلق") || res.message.includes("غير صحيحة"))) {
        return { success: false, message: res.message };
      }
    } catch (err) {
      console.warn(`Employee cloud login (${act}) error:`, err);
    }
  }

  return { success: false, message: "بيانات الدخول غير صحيحة" };
}

/**
 * Fetch all users for a store from Client Sheet (getUsers / get_users)
 */
export async function cloudGetStoreUsers(
  storeScriptUrl: string,
  username?: string
): Promise<StoreUser[]> {
  const { url: cleanUrl } = normalizeScriptUrl(storeScriptUrl);
  if (!cleanUrl) return [];

  const actions = ["getUsers", "get_users"];
  for (const act of actions) {
    try {
      const res = await fetchCloudData<{ success: boolean; users?: StoreUser[] }>(
        cleanUrl,
        act,
        username ? { username } : {}
      );
      if (res && res.success && Array.isArray(res.users) && res.users.length > 0) {
        return res.users.map((u) => {
          let rawPerms = u.permissions as unknown;
          let perms: StorePermission[] = [];
          if (typeof rawPerms === "string") {
            try {
              perms = JSON.parse(rawPerms);
            } catch {
              perms = (rawPerms as string).split(",").map((p) => p.trim()) as StorePermission[];
            }
          } else if (Array.isArray(rawPerms)) {
            perms = rawPerms as StorePermission[];
          }
          return {
            ...u,
            permissions: Array.isArray(perms) && perms.length > 0 ? perms : ["pos"],
          };
        });
      }
    } catch {}
  }

  return [];
}

/**
 * Save or update employee and permissions in Client Sheet Users table (addUser, updateUser, save_user_permissions)
 */
export async function cloudSaveStoreUser(
  storeScriptUrl: string,
  user: StoreUser
): Promise<boolean> {
  const { url: cleanUrl } = normalizeScriptUrl(storeScriptUrl);
  if (!cleanUrl) return false;

  const permsStr = JSON.stringify(user.permissions || ["pos"]);

  // 1. Try POST with action "addUser" (which updates if user exists or appends if new)
  let ok = await sendCloudAction(cleanUrl, {
    action: "addUser",
    id: user.id,
    username: user.username,
    userTitle: user.userTitle,
    password: user.password,
    permissions: permsStr,
    status: user.status || "نشط",
    createdAt: user.createdAt,
  });

  // Fallback to "save_user_permissions"
  if (!ok) {
    ok = await sendCloudAction(cleanUrl, {
      action: "save_user_permissions",
      id: user.id,
      username: user.username,
      userTitle: user.userTitle,
      password: user.password,
      permissions: permsStr,
      status: user.status || "نشط",
      createdAt: user.createdAt,
    });
  }

  // 2. Resilient GET fallback
  if (!ok) {
    try {
      const u = new URL(cleanUrl);
      u.searchParams.set("action", "addUser");
      u.searchParams.set("id", user.id);
      u.searchParams.set("username", user.username);
      u.searchParams.set("userTitle", user.userTitle);
      u.searchParams.set("password", user.password);
      u.searchParams.set("permissions", permsStr);
      u.searchParams.set("status", user.status || "نشط");
      u.searchParams.set("_t", Date.now().toString());
      fetch(u.toString(), { mode: "no-cors" }).catch(() => {});
    } catch {}
  }

  return true;
}

/**
 * Delete employee from Client Sheet Users table (deleteUser, delete_user)
 */
export async function cloudDeleteStoreUser(
  storeScriptUrl: string,
  username: string,
  userTitle: string,
  id?: string
): Promise<boolean> {
  const { url: cleanUrl } = normalizeScriptUrl(storeScriptUrl);
  if (!cleanUrl) return false;

  // Try POST action "deleteUser"
  let ok = await sendCloudAction(cleanUrl, {
    action: "deleteUser",
    username,
    userTitle,
    id,
  });

  // Fallback to "delete_user"
  if (!ok) {
    ok = await sendCloudAction(cleanUrl, {
      action: "delete_user",
      username,
      userTitle,
      id,
    });
  }

  // Resilient GET fallback
  if (!ok) {
    try {
      const u = new URL(cleanUrl);
      u.searchParams.set("action", "deleteUser");
      u.searchParams.set("username", username);
      u.searchParams.set("userTitle", userTitle);
      if (id) u.searchParams.set("id", id);
      u.searchParams.set("_t", Date.now().toString());
      fetch(u.toString(), { mode: "no-cors" }).catch(() => {});
    } catch {}
  }

  return true;
}


