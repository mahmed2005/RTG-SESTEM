import { Order } from "../types";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/**
 * Clean plain text from any HTML tags
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

/**
 * Standardize Arabic digits (٠-٩) and Eastern digits to standard ASCII (0-9)
 */
export function toStandardDigits(str: string): string {
  if (!str) return "";
  return str
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[\u200e\u200f]/g, "")
    .trim();
}

/**
 * Download any Blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Convert a DOM element to a high-resolution Image Blob (PNG)
 */
export async function htmlElementToImageBlob(element: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to convert canvas to blob"));
      },
      "image/png",
      1.0
    );
  });
}

/**
 * Convert a DOM element into a crisp, vector-scaled PDF Blob
 */
export async function htmlElementToPdfBlob(
  element: HTMLElement,
  title = "document"
): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const isLandscape = canvas.width > canvas.height * 1.2;
  const orientation = isLandscape ? "landscape" : "portrait";
  const pdf = new jsPDF(orientation, "mm", "a4");

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const ratio = canvasHeight / canvasWidth;

  let imgWidth = pdfWidth - 10;
  let imgHeight = imgWidth * ratio;

  if (imgHeight > pdfHeight - 10) {
    imgHeight = pdfHeight - 10;
    imgWidth = imgHeight / ratio;
  }

  const x = (pdfWidth - imgWidth) / 2;
  const y = 5;

  pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
  pdf.setProperties({ title: title });

  return pdf.output("blob");
}

/**
 * Convert an HTML string (like a report or printable document) to an Image Blob
 */
export async function htmlStringToImageBlob(
  htmlContent: string,
  width = 800
): Promise<Blob> {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "-9999px";
  container.style.left = "-9999px";
  container.style.width = `${width}px`;
  container.style.backgroundColor = "#ffffff";
  container.style.zIndex = "-9999";
  container.dir = "rtl";
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    const blob = await htmlElementToImageBlob(container);
    return blob;
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Convert an HTML string to a PDF Blob
 */
export async function htmlStringToPdfBlob(
  htmlContent: string,
  title = "تقرير"
): Promise<Blob> {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "-9999px";
  container.style.left = "-9999px";
  container.style.width = "820px";
  container.style.backgroundColor = "#ffffff";
  container.style.zIndex = "-9999";
  container.dir = "rtl";
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    const blob = await htmlElementToPdfBlob(container, title);
    return blob;
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Share a File (Image or PDF) via Native Web Share API (WhatsApp, Instagram, etc.)
 * If file sharing is not supported by the client browser (e.g. desktop), it triggers an instant download!
 */
export async function shareFileOrDownload(
  fileBlob: Blob,
  fileName: string,
  mimeType: string,
  title: string,
  text?: string
): Promise<{ sharedViaNative: boolean; downloaded: boolean }> {
  try {
    const file = new File([fileBlob], fileName, { type: mimeType });

    // Check if browser supports sharing files (Available on Chrome/Safari Mobile and supported desktop)
    if (
      typeof navigator !== "undefined" &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title,
        text: text || title,
      });
      return { sharedViaNative: true, downloaded: false };
    }
  } catch (err: unknown) {
    if ((err as Error)?.name === "AbortError") {
      // User cancelled share sheet
      return { sharedViaNative: false, downloaded: false };
    }
    console.warn("Native file share fallback:", err);
  }

  // Fallback: Automatically download file to user's device
  downloadBlob(fileBlob, fileName);
  return { sharedViaNative: false, downloaded: true };
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

  const seller = order.cashierName || "محمد (المالك)";
  lines.push(`👨‍💼 *البائع / الكاشير:* ${seller}`);

  lines.push(`📊 *الحالة:* ${isRet ? "⚠️ مرتجع / ملغية" : order.status || "تم التوصيل"}`);
  lines.push(`--------------------------------`);
  lines.push(`🛒 *المنتجات والتفاصيل:*`);

  if (order.cartItems && order.cartItems.length > 0) {
    order.cartItems.forEach((item, idx) => {
      lines.push(
        `${idx + 1}. ${item.name} (${item.qty} × ${item.price.toFixed(2)} د.ل) = ${(item.qty * item.price).toFixed(2)} د.ل`
      );
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
export function generateDocumentShareText(
  title: string,
  contentHtml?: string,
  shopName?: string
): string {
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
    url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  } else {
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
 * Native Web Share API for text or url
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
 * Handles all date formats, locales (Arabic/Western), timestamps and ISO strings
 */
export function isTodayOrder(dateStr: string): boolean {
  if (!dateStr) return false;
  const clean = toStandardDigits(dateStr);
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  const nowDay = now.getDate();

  // Pattern 1: YYYY/MM/DD or YYYY-MM-DD
  const mYMD = clean.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (mYMD) {
    const y = parseInt(mYMD[1], 10);
    const m = parseInt(mYMD[2], 10);
    const d = parseInt(mYMD[3], 10);
    return y === nowYear && m === nowMonth && d === nowDay;
  }

  // Pattern 2: DD/MM/YYYY or DD-MM-YYYY
  const mDMY = clean.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (mDMY) {
    const d = parseInt(mDMY[1], 10);
    const m = parseInt(mDMY[2], 10);
    const y = parseInt(mDMY[3], 10);
    return y === nowYear && m === nowMonth && d === nowDay;
  }

  // Pattern 3: Standard Date object parsing
  const dObj = new Date(clean);
  if (!isNaN(dObj.getTime())) {
    return (
      dObj.getFullYear() === nowYear &&
      dObj.getMonth() + 1 === nowMonth &&
      dObj.getDate() === nowDay
    );
  }

  // Pattern 4: Substring match for today's components
  const yStr = String(nowYear);
  const mStr = String(nowMonth).padStart(2, "0");
  const dStr = String(nowDay).padStart(2, "0");
  if (
    clean.includes(`${yStr}/${mStr}/${dStr}`) ||
    clean.includes(`${yStr}-${mStr}-${dStr}`) ||
    clean.includes(`${dStr}/${mStr}/${yStr}`) ||
    clean.includes(`${dStr}-${mStr}-${yStr}`)
  ) {
    return true;
  }

  return false;
}

/**
 * Checks whether an order was created by the specified user
 * Strict role separation: An employee (cashier) NEVER owns owner/admin orders ("محمد (المالك)")
 */
export function isOrderBelongsToUser(
  order: Order,
  userTitle?: string,
  username?: string,
  role?: "admin" | "employee"
): boolean {
  // If role is admin / owner, can access and view all orders
  if (role === "admin") {
    return true;
  }

  const cashier = (order.cashierName || "").trim();

  // If cashier explicitly marked as owner / general manager, employee can NEVER see it
  const isOwnerInvoice =
    cashier.includes("المالك") ||
    cashier.includes("المدير العام") ||
    cashier.includes("مدير المتجر");
  if (isOwnerInvoice) return false;

  // Role: Employee (cashier)
  const title = (userTitle || "").trim().toLowerCase();
  const uname = (username || "").trim().toLowerCase();
  const clean = cashier.toLowerCase();

  // If cashierName is present
  if (clean) {
    if (
      (title && (clean === title || clean.includes(title) || title.includes(clean))) ||
      (uname && (clean === uname || clean.includes(uname) || uname.includes(clean))) ||
      clean === "كاشير" ||
      clean.includes("كاشير") ||
      clean.includes("موظف")
    ) {
      return true;
    }

    // If order was explicitly created by another employee (different title), exclude it
    return false;
  }

  // If cashierName is blank (e.g. from existing Google Sheet without column 14),
  // allow the cashier to view today's invoices as long as it's not an owner invoice
  return true;
}

/**
 * Robust matcher for Date Picker (YYYY-MM-DD) against invoice date
 */
export function matchesDateFilter(orderDateRaw: string, filterStr: string): boolean {
  if (!filterStr) return true;
  if (!orderDateRaw) return false;

  const normalized = toStandardDigits(orderDateRaw).trim();
  const [fYear, fMonth, fDay] = filterStr.split("-").map((n) => parseInt(n, 10));

  // Match YYYY/MM/DD or YYYY-MM-DD
  const matchYMD = normalized.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (matchYMD) {
    const oYear = parseInt(matchYMD[1], 10);
    const oMonth = parseInt(matchYMD[2], 10);
    const oDay = parseInt(matchYMD[3], 10);
    if (oMonth === fMonth && oDay === fDay) {
      if (!fYear || oYear === fYear) return true;
    }
    return false;
  }

  // Match DD/MM/YYYY or DD-MM-YYYY
  const matchDMY = normalized.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (matchDMY) {
    const oDay = parseInt(matchDMY[1], 10);
    const oMonth = parseInt(matchDMY[2], 10);
    const oYear = parseInt(matchDMY[3], 10);
    if (oMonth === fMonth && oDay === fDay) {
      if (!fYear || oYear === fYear) return true;
    }
    return false;
  }

  // Try Date constructor
  const d = new Date(normalized);
  if (!isNaN(d.getTime())) {
    return d.getFullYear() === fYear && d.getMonth() + 1 === fMonth && d.getDate() === fDay;
  }

  // Substring fallback
  const dPart = `${fMonth}/${fDay}`;
  const dPartPadded = `${String(fMonth).padStart(2, "0")}/${String(fDay).padStart(2, "0")}`;
  return (
    normalized.includes(filterStr) ||
    normalized.includes(dPart) ||
    normalized.includes(dPartPadded)
  );
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
