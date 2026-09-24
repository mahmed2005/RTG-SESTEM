import { Order } from "../types";

/**
 * Clean plain text from any HTML tags for sharing
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

/**
 * Generate beautifully formatted Arabic text for an Order to share via WhatsApp, Telegram, or SMS
 */
export function generateOrderShareText(order: Order, shopName?: string): string {
  const store = shopName || "RTG-SYSTEM";
  const isRet =
    order.status === "مرتجع" ||
    order.status === "راجع" ||
    (order.status || "").includes("رجع");

  const lines: string[] = [
    `🧾 *فاتورة مبيعات معتمدة*`,
    `🏪 *المتجر:* ${store}`,
    `🔢 *رقم الفاتورة:* #${order.id}`,
    `📅 *التاريخ:* ${order.date}`,
    `👤 *العميل:* ${order.cName || "زبون نقدي"}`,
  ];

  if (order.cPhone && order.cPhone !== "غير محدد") {
    lines.push(`📞 *الهاتف:* ${order.cPhone}`);
  }
  if (order.cArea && order.cArea !== "المتجر / استلام") {
    lines.push(`📍 *المنطقة:* ${order.cArea}`);
  }

  lines.push(`💳 *طريقة الدفع:* ${order.method || "كاش"}`);

  if (order.cashierName) {
    lines.push(`👨‍💼 *البائع / الكاشير:* ${order.cashierName}`);
  }

  lines.push(`📊 *الحالة:* ${isRet ? "⚠️ مرتجع / ملغية" : order.status || "تم التوصيل"}`);
  lines.push(`--------------------------------`);
  lines.push(`🛒 *المنتجات والتفاصيل:*`);

  if (order.cartItems && order.cartItems.length > 0) {
    order.cartItems.forEach((item, idx) => {
      lines.push(`${idx + 1}. ${item.name} (${item.qty} × ${item.price.toFixed(2)} د.ل) = ${(item.qty * item.price).toFixed(2)} د.ل`);
    });
  } else if (order.desc) {
    lines.push(order.desc);
  }

  lines.push(`--------------------------------`);
  if (Number(order.delivery || 0) > 0) {
    lines.push(`🚚 *رسوم التوصيل:* ${Number(order.delivery).toFixed(2)} د.ل`);
  }
  if (Number(order.discount || 0) > 0) {
    lines.push(`🏷️ *قيمة الخصم:* -${Number(order.discount).toFixed(2)} د.ل`);
  }
  lines.push(`💰 *المبلغ الإجمالي:* ${order.total.toFixed(2)} د.ل`);
  lines.push(`--------------------------------`);
  lines.push(`✨ *شكراً لاختياركم متجرنا! نتمنى لكم يوماً سعيداً.*`);
  lines.push(`🚀 _تم الإصدار عبر منظومة RTG-SYSTEM_`);

  return lines.join("\n");
}

/**
 * Generate formatted text for documents/reports (e.g. Sales report, financial summary)
 */
export function generateDocumentShareText(title: string, contentHtml?: string, shopName?: string): string {
  const store = shopName || "RTG-SYSTEM";
  const plain = contentHtml ? stripHtml(contentHtml).slice(0, 800) : "";

  const lines: string[] = [
    `📊 *${title}*`,
    `🏪 *المتجر:* ${store}`,
    `📅 *التاريخ:* ${new Date().toLocaleDateString("ar-LY")}`,
    `--------------------------------`,
  ];

  if (plain) {
    lines.push(plain.trim());
    lines.push(`--------------------------------`);
  }

  lines.push(`🚀 _منظومة RTG-SYSTEM لإدارة المتاجر والمخزون_`);
  return lines.join("\n");
}

/**
 * Open WhatsApp with prefilled message
 */
export function shareViaWhatsApp(text: string, phone?: string): void {
  const cleanPhone = phone ? phone.replace(/[^\d]/g, "") : "";
  const encodedText = encodeURIComponent(text);
  let url = "";

  if (cleanPhone) {
    // If phone provided, direct chat
    url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  } else {
    // General share to contacts
    url = `https://api.whatsapp.com/send?text=${encodedText}`;
  }

  window.open(url, "_blank");
}

/**
 * Open Telegram share
 */
export function shareViaTelegram(text: string): void {
  const url = `https://t.me/share/url?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

/**
 * Native Web Share API (WhatsApp, Instagram, AirDrop, Messages, etc.)
 */
export async function shareViaNative(title: string, text: string, url?: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url: url || window.location.href,
      });
      return true;
    } catch (e: unknown) {
      if ((e as Error)?.name !== "AbortError") {
        console.warn("Native share error:", e);
      }
      return false;
    }
  }
  return false;
}

/**
 * Checks whether an order was created on today's calendar date
 */
export function isTodayOrder(dateStr: string): boolean {
  if (!dateStr) return false;
  const clean = dateStr.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632)).trim();
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  const nowDay = now.getDate();

  // Match YYYY/MM/DD or YYYY-MM-DD
  const mYMD = clean.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (mYMD) {
    const y = parseInt(mYMD[1], 10);
    const m = parseInt(mYMD[2], 10);
    const d = parseInt(mYMD[3], 10);
    return y === nowYear && m === nowMonth && d === nowDay;
  }

  // Match DD/MM/YYYY or DD-MM-YYYY
  const mDMY = clean.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (mDMY) {
    const d = parseInt(mDMY[1], 10);
    const m = parseInt(mDMY[2], 10);
    const y = parseInt(mDMY[3], 10);
    return y === nowYear && m === nowMonth && d === nowDay;
  }

  const dObj = new Date(clean);
  if (!isNaN(dObj.getTime())) {
    return (
      dObj.getFullYear() === nowYear &&
      dObj.getMonth() + 1 === nowMonth &&
      dObj.getDate() === nowDay
    );
  }

  return false;
}

/**
 * Checks whether an order was created by the specified user
 */
export function isOrderBelongsToUser(order: Order, userTitle?: string, username?: string): boolean {
  const cashier = (order.cashierName || "").toLowerCase().trim();
  const title = (userTitle || "").toLowerCase().trim();
  const uname = (username || "").toLowerCase().trim();

  if (!cashier) return false;
  if (title && (cashier === title || cashier.includes(title))) return true;
  if (uname && cashier.includes(uname)) return true;
  return false;
}

/**
 * Copy text to clipboard safely
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    }
  } catch {
    return false;
  }
}


