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
 * and strip all invisible Unicode directional and zero-width marks (\u200e, \u200f, \u061c, \ufeff, etc.)
 */
export function toStandardDigits(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[\u200E\u200F\u061C\uFEFF\u200B-\u200D]/g, "")
    .trim();
}

/**
 * Normalizes any date string from Google Sheets or browser locales
 */
export function normalizeDateStr(raw: string): string {
  return toStandardDigits(raw);
}

/**
 * Copy Image Blob directly to clipboard (supported on iOS Safari 13.4+, Android Chrome, Desktop)
 */
export async function copyImageBlobToClipboard(blob: Blob): Promise<boolean> {
  try {
    if (
      typeof window !== "undefined" &&
      navigator.clipboard &&
      typeof ClipboardItem !== "undefined"
    ) {
      const item = new ClipboardItem({ "image/png": blob });
      await navigator.clipboard.write([item]);
      return true;
    }
  } catch (err) {
    console.warn("ClipboardItem write failed:", err);
  }
  return false;
}

/**
 * Download any Blob as a file safely
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
 * Ultra-fast pure HTML5 Canvas Invoice Generator (Runs in <5ms)
 * 100% reliable across all mobile operating systems (iOS / Android) and desktop.
 * Keeps user activation tokens active for immediate navigator.share invocation!
 */
export function drawInvoiceToCanvas(order: Order, shopName?: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D canvas context");

  const width = 720;
  const items =
    order.cartItems && order.cartItems.length > 0
      ? order.cartItems
      : (order.desc || "").split(" ، ").map((part, i) => {
          const match = part.match(/(\d+)\s*[xX×]\s*(?:\[([^\]]+)\])?\s*(.*)/);
          if (match) {
            return {
              code: match[2] || `ITEM-${i + 1}`,
              name: match[3] || part,
              price: order.total / (parseInt(match[1]) || 1),
              qty: parseInt(match[1]) || 1,
              cost: 0,
            };
          }
          return {
            code: `ITEM-${i + 1}`,
            name: part,
            price: order.total,
            qty: 1,
            cost: 0,
          };
        });

  const baseHeight = 540;
  const itemRowHeight = 44;
  const totalHeight = baseHeight + Math.max(1, items.length) * itemRowHeight;

  canvas.width = width;
  canvas.height = totalHeight;

  // 1. Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, totalHeight);

  // 2. Outer Card Border
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 2;
  ctx.strokeRect(8, 8, width - 16, totalHeight - 16);

  // 3. RTG Bronze Header Accent
  const grad = ctx.createLinearGradient(8, 8, width - 8, 8);
  grad.addColorStop(0, "#c5834e");
  grad.addColorStop(1, "#a6632f");
  ctx.fillStyle = grad;
  ctx.fillRect(8, 8, width - 16, 12);

  // 4. Shop Name & Subtitle
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 28px 'Cairo', 'Segoe UI', Tahoma, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(shopName || "RTG-SYSTEM", width - 35, 62);

  ctx.fillStyle = "#c5834e";
  ctx.font = "bold 15px 'Cairo', 'Segoe UI', Tahoma, sans-serif";
  ctx.fillText("فاتورة مبيعات رسمية معتمدة", width - 35, 90);

  // 5. Invoice Badge (Left side)
  ctx.fillStyle = "#fef3c7";
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(35, 40, 180, 40, 8);
  } else {
    ctx.rect(35, 40, 180, 40);
  }
  ctx.fill();

  ctx.fillStyle = "#92400e";
  ctx.font = "bold 18px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`#${order.id}`, 125, 66);

  ctx.fillStyle = "#64748b";
  ctx.font = "12px 'Cairo', sans-serif";
  ctx.fillText(order.date || "", 125, 100);

  // 6. Gold Separator Line
  ctx.strokeStyle = "#c5834e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(35, 120);
  ctx.lineTo(width - 35, 120);
  ctx.stroke();

  // 7. Customer & Cashier Info Card
  ctx.fillStyle = "#f8fafc";
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(35, 135, width - 70, 95, 10);
  } else {
    ctx.rect(35, 135, width - 70, 95);
  }
  ctx.fill();
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#1e293b";
  ctx.font = "13px 'Cairo', sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`العميل: ${order.cName || "زبون نقدي"}`, width - 55, 165);
  ctx.fillText(`طريقة الدفع: ${order.method || "كاش"}`, width - 55, 202);

  ctx.textAlign = "left";
  ctx.fillText(`الهاتف: ${order.cPhone || "-"}`, 55, 165);
  ctx.fillText(`البائع / الكاشير: ${order.cashierName || "محمد (المالك)"}`, 55, 202);

  // 8. Items Table Header
  const tableTop = 250;
  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(35, tableTop, width - 70, 36, 6);
  } else {
    ctx.rect(35, tableTop, width - 70, 36);
  }
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 13px 'Cairo', sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("المنتج / السلعة", width - 55, tableTop + 23);
  ctx.textAlign = "center";
  ctx.fillText("الكمية", 320, tableTop + 23);
  ctx.fillText("السعر", 200, tableTop + 23);
  ctx.textAlign = "left";
  ctx.fillText("الإجمالي", 55, tableTop + 23);

  // 9. Items Rows
  let curY = tableTop + 36;
  items.forEach((item, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
    ctx.fillRect(35, curY, width - 70, itemRowHeight);

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(35, curY + itemRowHeight);
    ctx.lineTo(width - 35, curY + itemRowHeight);
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 13px 'Cairo', sans-serif";
    ctx.textAlign = "right";
    const displayName = `${idx + 1}. ${item.name}`.slice(0, 34);
    ctx.fillText(displayName, width - 55, curY + 27);

    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.fillText(String(item.qty), 320, curY + 27);
    ctx.fillText(`${Number(item.price).toFixed(2)}`, 200, curY + 27);

    ctx.textAlign = "left";
    ctx.fillStyle = "#c5834e";
    ctx.fillText(`${(item.qty * item.price).toFixed(2)} د.ل`, 55, curY + 27);

    curY += itemRowHeight;
  });

  // 10. Summary Totals Card
  curY += 15;
  ctx.fillStyle = "#fafaf9";
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(35, curY, width - 70, 115, 10);
  } else {
    ctx.rect(35, curY, width - 70, 115);
  }
  ctx.fill();
  ctx.strokeStyle = "#e7e5e4";
  ctx.lineWidth = 1;
  ctx.stroke();

  const subtotal = order.total - (order.delivery || 0) + (order.discount || 0);
  ctx.font = "13px 'Cairo', sans-serif";
  ctx.fillStyle = "#57534e";
  ctx.textAlign = "right";
  ctx.fillText("المجموع الفرعي:", width - 55, curY + 28);
  ctx.textAlign = "left";
  ctx.font = "bold 13px monospace";
  ctx.fillText(`${subtotal.toFixed(2)} د.ل`, 55, curY + 28);

  if (Number(order.discount || 0) > 0) {
    ctx.fillStyle = "#dc2626";
    ctx.textAlign = "right";
    ctx.font = "13px 'Cairo', sans-serif";
    ctx.fillText("قيمة الخصم:", width - 55, curY + 52);
    ctx.textAlign = "left";
    ctx.font = "bold 13px monospace";
    ctx.fillText(`-${Number(order.discount).toFixed(2)} د.ل`, 55, curY + 52);
  }

  // Divider
  ctx.strokeStyle = "#d6d3d1";
  ctx.beginPath();
  ctx.moveTo(45, curY + 68);
  ctx.lineTo(width - 45, curY + 68);
  ctx.stroke();

  // Grand Total Highlight
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 17px 'Cairo', sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("المبلغ الإجمالي المستحق:", width - 55, curY + 98);

  ctx.fillStyle = "#c5834e";
  ctx.font = "900 22px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`${order.total.toFixed(2)} د.ل`, 55, curY + 98);

  // 11. Barcode Graphic
  curY += 135;
  ctx.fillStyle = "#0f172a";
  let barX = (width - 240) / 2;
  const chars = (order.id || "INV-00000").split("");
  chars.forEach((c) => {
    const val = c.charCodeAt(0);
    const w1 = (val % 3) + 1.5;
    ctx.fillRect(barX, curY, w1, 26);
    barX += w1 + 3;
    const w2 = ((val >> 1) % 3) + 1.5;
    ctx.fillRect(barX, curY, w2, 26);
    barX += w2 + 2.5;
  });

  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`* ${order.id} *`, width / 2, curY + 44);

  // 12. Footer note
  ctx.fillStyle = "#94a3b8";
  ctx.font = "11px 'Cairo', sans-serif";
  ctx.fillText("منظومة RTG-SYSTEM لإدارة المبيعات والمخازن • شكراً لتعاملكم معنا", width / 2, curY + 64);

  return canvas;
}

/**
 * Generate invoice Image Blob and Data URL synchronously and fast
 */
export async function generateInvoiceImage(
  order: Order,
  shopName?: string
): Promise<{ blob: Blob; dataUrl: string }> {
  const canvas = drawInvoiceToCanvas(order, shopName);
  const dataUrl = canvas.toDataURL("image/png");

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve({ blob, dataUrl });
        else reject(new Error("Failed to export invoice canvas"));
      },
      "image/png",
      1.0
    );
  });
}

/**
 * Generate invoice PDF Blob and Data URL fast
 */
export async function generateInvoicePdf(
  order: Order,
  shopName?: string
): Promise<{ blob: Blob; dataUrl: string }> {
  const canvas = drawInvoiceToCanvas(order, shopName);
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("portrait", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const ratio = canvas.height / canvas.width;
  let imgWidth = pdfWidth - 20;
  let imgHeight = imgWidth * ratio;

  if (imgHeight > pdfHeight - 20) {
    imgHeight = pdfHeight - 20;
    imgWidth = imgHeight / ratio;
  }

  const x = (pdfWidth - imgWidth) / 2;
  const y = 10;

  pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
  pdf.setProperties({ title: `فاتورة #${order.id} - ${shopName || "RTG"}` });

  const blob = pdf.output("blob");
  const dataUrl = pdf.output("dataurlstring");

  return { blob, dataUrl };
}

/**
 * Convert a visible DOM element to Image Blob (PNG)
 */
export async function htmlElementToImageBlob(element: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    logging: false,
    scrollX: 0,
    scrollY: 0,
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
 * Convert a visible DOM element into PDF Blob
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
    scrollX: 0,
    scrollY: 0,
  });

  const imgData = canvas.toDataURL("image/png");
  const isLandscape = canvas.width > canvas.height * 1.2;
  const orientation = isLandscape ? "landscape" : "portrait";
  const pdf = new jsPDF(orientation, "mm", "a4");

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const ratio = canvas.height / canvas.width;
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
 * Convert an HTML string to Image Blob
 */
export async function htmlStringToImageBlob(
  htmlContent: string,
  width = 720
): Promise<{ blob: Blob; dataUrl: string }> {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = `${width}px`;
  container.style.backgroundColor = "#ffffff";
  container.style.zIndex = "-9999";
  container.style.pointerEvents = "none";
  container.dir = "rtl";
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      scrollX: 0,
      scrollY: 0,
    });

    const dataUrl = canvas.toDataURL("image/png");
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error("Failed to export canvas blob"));
        },
        "image/png",
        1.0
      );
    });

    return { blob, dataUrl };
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Convert an HTML string to PDF Blob
 */
export async function htmlStringToPdfBlob(
  htmlContent: string,
  title = "تقرير"
): Promise<{ blob: Blob; dataUrl: string }> {
  const { blob, dataUrl: imgData } = await htmlStringToImageBlob(htmlContent, 720);

  const pdf = new jsPDF("portrait", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  pdf.addImage(imgData, "PNG", 5, 5, pdfWidth - 10, 0);
  pdf.setProperties({ title });

  const pdfBlob = pdf.output("blob");
  const pdfDataUrl = pdf.output("dataurlstring");

  return { blob: pdfBlob, dataUrl: pdfDataUrl };
}

/**
 * Share a File (Image or PDF) via Native Web Share API
 */
export async function shareFileOrDownload(
  fileBlob: Blob,
  fileName: string,
  mimeType: string,
  title: string,
  text?: string
): Promise<{ sharedViaNative: boolean; downloaded: boolean; error?: string }> {
  try {
    const file = new File([fileBlob], fileName, { type: mimeType });

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
      return { sharedViaNative: false, downloaded: false };
    }
    console.warn("Native file share fallback:", err);
    // Fallback: Download file to device
    downloadBlob(fileBlob, fileName);
    return { sharedViaNative: false, downloaded: true, error: (err as Error)?.message };
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
 * Open Facebook share
 */
export function shareViaFacebook(text: string): void {
  const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`;
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
 */
export function isTodayOrder(dateStr: string): boolean {
  if (!dateStr) return true; // If no date recorded, don't hide from active shift
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
  const dObj = new Date(clean.replace(/[،,]/g, " "));
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
  const mShort = String(nowMonth);
  const dShort = String(nowDay);
  if (
    clean.includes(`${yStr}/${mStr}/${dStr}`) ||
    clean.includes(`${yStr}-${mStr}-${dStr}`) ||
    clean.includes(`${dStr}/${mStr}/${yStr}`) ||
    clean.includes(`${dStr}-${mStr}-${yStr}`) ||
    clean.includes(`${dShort}/${mShort}/${yStr}`) ||
    clean.includes(`${yStr}/${mShort}/${dShort}`)
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
    return false;
  }

  // If cashierName is blank (synced from Google Sheet without column 14),
  // allow the cashier to view today's invoices as long as it's not marked as owner invoice
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

  const d = new Date(normalized.replace(/[،,]/g, " "));
  if (!isNaN(d.getTime())) {
    return d.getFullYear() === fYear && d.getMonth() + 1 === fMonth && d.getDate() === fDay;
  }

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
