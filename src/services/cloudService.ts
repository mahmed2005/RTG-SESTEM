/**
 * RTG-SESTEM — Cloud Synchronization Service
 * Handles two-way real-time communication between RTG-SESTEM and Google Apps Script Web Apps
 */

import { Debt, Order, Product, ProductsMap, StoreSubscriber } from "../types";

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
 * Read data from Apps Script (with automatic JSONP fallback for 100% reliability)
 */
export async function fetchCloudData<T>(
  url: string,
  action: string,
  params: Record<string, string> = {}
): Promise<T | null> {
  const { url: cleanUrl } = normalizeScriptUrl(url);
  if (!cleanUrl || !cleanUrl.startsWith("http")) return null;

  const urlObj = new URL(cleanUrl);
  urlObj.searchParams.set("action", action);
  Object.entries(params).forEach(([k, v]) => urlObj.searchParams.set(k, v));
  urlObj.searchParams.set("_t", Date.now().toString());

  // 1. Try direct fetch
  try {
    const res = await fetch(urlObj.toString(), {
      method: "GET",
      redirect: "follow",
    });
    const contentType = res.headers.get("content-type") || "";
    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      return data as T;
    }
  } catch {
    // Direct fetch prevented or returned redirect/CORS, proceed smoothly to JSONP fallback
  }

  // 2. Guaranteed JSONP fallback
  return new Promise((resolve) => {
    const cbName = "rtg_cloud_cb_" + Math.random().toString(36).substring(2, 9);
    urlObj.searchParams.set("callback", cbName);

    const script = document.createElement("script");
    script.src = urlObj.toString();
    script.async = true;

    let finished = false;
    const timer = setTimeout(() => {
      if (!finished) {
        finished = true;
        clean();
        resolve(null);
      }
    }, 12000);

    const clean = () => {
      clearTimeout(timer);
      try {
        delete (window as any)[cbName];
      } catch {}
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };

    (window as any)[cbName] = (data: any) => {
      if (!finished) {
        finished = true;
        clean();
        resolve(data as T);
      }
    };

    script.onerror = () => {
      if (!finished) {
        finished = true;
        clean();
        resolve(null);
      }
    };

    document.head.appendChild(script);
  });
}

// ==========================================
// STORE ACTIONS (قالب المتجر - الملف 2)
// ==========================================

export interface StoreSyncResult {
  success: boolean;
  products?: ProductsMap;
  orders?: Order[];
  debts?: Debt[];
  message?: string;
}

/**
 * Fetch full store database (Products, Orders, Debts) from Google Sheet
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
