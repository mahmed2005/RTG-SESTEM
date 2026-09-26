import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { soundFx } from "../services/soundEffects";
import { Order } from "../types";
import {
  htmlStringToImageBlob,
  htmlStringToPdfBlob,
  htmlElementToImageBlob,
  htmlElementToPdfBlob,
  shareFileOrDownload,
  shareViaWhatsApp,
  shareViaTelegram,
  generateOrderShareText,
  copyTextToClipboard,
} from "../services/shareHelper";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  shareText?: string;
  recipientPhone?: string;
  subtitle?: string;
  htmlContent?: string;
  targetElementId?: string;
  order?: Order | null;
  fileName?: string;
  shopName?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title,
  shareText,
  recipientPhone,
  subtitle,
  htmlContent,
  targetElementId,
  order,
  fileName,
  shopName = "RTG-SYSTEM",
}) => {
  const [customPhone, setCustomPhone] = useState(recipientPhone || "");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Resolve HTML representation if order is provided
  const resolveHtmlContent = (): string => {
    if (htmlContent) return htmlContent;

    if (order) {
      const itemsList =
        order.cartItems && order.cartItems.length > 0
          ? order.cartItems
              .map(
                (item, idx) => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px 10px; font-weight: bold; color: #1e293b;">${idx + 1}. ${item.name}</td>
                  <td style="padding: 8px 10px; text-align: center; font-family: monospace;">${item.qty}</td>
                  <td style="padding: 8px 10px; text-align: left; font-family: monospace;">${item.price.toFixed(2)} د.ل</td>
                  <td style="padding: 8px 10px; text-align: left; font-family: monospace; font-weight: bold; color: #c5834e;">${(item.qty * item.price).toFixed(2)} د.ل</td>
                </tr>
              `
              )
              .join("")
          : `
              <tr>
                <td colspan="4" style="padding: 10px; color: #475569;">${order.desc}</td>
              </tr>
            `;

      return `
        <div style="font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; direction: rtl; text-align: right; background: #ffffff; color: #0f172a; padding: 24px; border-radius: 16px; border: 2px solid #e2e8f0; width: 600px; box-sizing: border-box;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #c5834e; padding-bottom: 14px; margin-bottom: 16px;">
            <div>
              <h2 style="margin: 0; font-size: 22px; font-weight: 900; color: #0f172a;">${shopName}</h2>
              <p style="margin: 3px 0 0 0; color: #c5834e; font-weight: bold; font-size: 13px;">فاتورة مبيعات معتمدة</p>
            </div>
            <div style="text-align: left; font-family: monospace;">
              <span style="display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 8px; font-weight: 900; font-size: 14px;">#${order.id}</span>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">${order.date}</div>
            </div>
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; font-size: 12px; line-height: 1.8;">
            <div style="display: flex; justify-content: space-between;">
              <span><strong>العميل:</strong> ${order.cName || "زبون نقدي"}</span>
              <span><strong>الهاتف:</strong> ${order.cPhone || "-"}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 4px;">
              <span><strong>طريقة الدفع:</strong> ${order.method || "كاش"}</span>
              <span><strong>البائع / الكاشير:</strong> ${order.cashierName || "محمد (المالك)"}</span>
            </div>
            ${order.cArea ? `<div style="margin-top: 4px;"><strong>العنوان / المنطقة:</strong> ${order.cArea}</div>` : ""}
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px;">
            <thead>
              <tr style="background: #1e293b; color: #ffffff;">
                <th style="padding: 8px 10px; text-align: right; border-radius: 0 8px 0 0;">المنتج</th>
                <th style="padding: 8px 10px; text-align: center;">الكمية</th>
                <th style="padding: 8px 10px; text-align: left;">السعر</th>
                <th style="padding: 8px 10px; text-align: left; border-radius: 8px 0 0 0;">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
          </table>

          <div style="background: #fafaf9; border-top: 2px solid #e7e5e4; padding: 12px 16px; border-radius: 0 0 12px 12px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #57534e;">
              <span>المجموع الفرعي:</span>
              <span style="font-family: monospace; font-weight: bold;">${(order.total - (order.delivery || 0) + (order.discount || 0)).toFixed(2)} د.ل</span>
            </div>
            ${Number(order.delivery || 0) > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #57534e;">
                <span>رسوم التوصيل:</span>
                <span style="font-family: monospace; font-weight: bold;">+${Number(order.delivery).toFixed(2)} د.ل</span>
              </div>
            ` : ""}
            ${Number(order.discount || 0) > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #dc2626;">
                <span>قيمة الخصم:</span>
                <span style="font-family: monospace; font-weight: bold;">-${Number(order.discount).toFixed(2)} د.ل</span>
              </div>
            ` : ""}
            <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px dashed #d6d3d1; font-size: 16px; font-weight: 900; color: #0f172a;">
              <span>المبلغ الإجمالي المستحق:</span>
              <span style="color: #c5834e; font-family: monospace;">${order.total.toFixed(2)} د.ل</span>
            </div>
          </div>

          <div style="text-align: center; margin-top: 16px; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px;">
            منظومة RTG-SYSTEM لإدارة المبيعات والمخازن • شكراً لتعاملكم معنا
          </div>
        </div>
      `;
    }

    return "";
  };

  // Helper to obtain a Blob (as Image or PDF)
  const getBlob = async (type: "image" | "pdf"): Promise<{ blob: Blob; filename: string }> => {
    const baseName =
      fileName || (order ? `فاتورة-${order.id}` : "تقرير-مبيعات-RTG");

    // 1. Try DOM element directly if element ID specified
    if (targetElementId) {
      const el = document.getElementById(targetElementId);
      if (el) {
        if (type === "image") {
          const blob = await htmlElementToImageBlob(el);
          return { blob, filename: `${baseName}.png` };
        } else {
          const blob = await htmlElementToPdfBlob(el, title);
          return { blob, filename: `${baseName}.pdf` };
        }
      }
    }

    // 2. Otherwise generate from HTML string
    const html = resolveHtmlContent();
    if (html) {
      if (type === "image") {
        const blob = await htmlStringToImageBlob(html, 640);
        return { blob, filename: `${baseName}.png` };
      } else {
        const blob = await htmlStringToPdfBlob(html, title);
        return { blob, filename: `${baseName}.pdf` };
      }
    }

    throw new Error("لا يوجد محتوى متاح للتحويل");
  };

  // 1. Share as high-res Image (PNG)
  const handleShareAsImage = async () => {
    try {
      soundFx.playClick();
      setIsGeneratingImage(true);
      setStatusMessage("جاري تجهيز الصورة عالية الدقة...");

      const { blob, filename } = await getBlob("image");
      const res = await shareFileOrDownload(
        blob,
        filename,
        "image/png",
        title,
        `صورة ${title} - ${shopName}`
      );

      soundFx.playSuccess();
      if (res.sharedViaNative) {
        setStatusMessage("✓ تم فتح نافذة المشاركة بنجاح");
        setTimeout(() => onClose(), 1200);
      } else if (res.downloaded) {
        setStatusMessage("✓ تم حفظ الصورة بجهازك! يمكنك إرسالها الآن عبر واتساب أو إنستجرام");
      }
    } catch (err) {
      console.error("Image share error:", err);
      setStatusMessage("تعذر تحويل الفاتورة لصورة، يرجى المحاولة مرة أخرى");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // 2. Share as PDF document
  const handleShareAsPdf = async () => {
    try {
      soundFx.playClick();
      setIsGeneratingPdf(true);
      setStatusMessage("جاري إنشاء وتصدير ملف الـ PDF...");

      const { blob, filename } = await getBlob("pdf");
      const res = await shareFileOrDownload(
        blob,
        filename,
        "application/pdf",
        title,
        `ملف PDF: ${title} - ${shopName}`
      );

      soundFx.playSuccess();
      if (res.sharedViaNative) {
        setStatusMessage("✓ تم فتح قائمة المشاركة كملف PDF بنجاح");
        setTimeout(() => onClose(), 1200);
      } else if (res.downloaded) {
        setStatusMessage("✓ تم تنزيل ملف الـ PDF بنجاح! يمكنك إرساله للمستلم مباشرة");
      }
    } catch (err) {
      console.error("PDF share error:", err);
      setStatusMessage("تعذر إنشاء ملف الـ PDF، يرجى المحاولة مرة أخرى");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Direct WhatsApp with Phone
  const handleDirectWhatsApp = () => {
    soundFx.playSuccess();
    const text =
      shareText ||
      (order ? generateOrderShareText(order, shopName) : `📊 ${title} - ${shopName}`);
    shareViaWhatsApp(text, customPhone);
  };

  const handleCopyText = async () => {
    soundFx.playClick();
    const text =
      shareText ||
      (order ? generateOrderShareText(order, shopName) : `📊 ${title} - ${shopName}`);
    const ok = await copyTextToClipboard(text);
    if (ok) {
      soundFx.playSuccess();
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[95] flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#2c323f] rounded-3xl p-4 sm:p-6 w-full max-w-lg shadow-2xl text-right space-y-4"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#c5834e] to-[#a6632f] text-white flex items-center justify-center text-lg shadow-md shadow-[#c5834e]/20">
                <i className="fa-solid fa-share-nodes"></i>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {subtitle || "مشاركة كصورة (PNG) أو كملف PDF رسمي عبر واتساب وإنستجرام"}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>

          {/* Status Message / Notification */}
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2.5 rounded-xl bg-[#c5834e]/10 border border-[#c5834e]/20 text-xs font-bold text-[#c5834e] flex items-center gap-2"
            >
              <i className="fa-solid fa-circle-info"></i>
              <span>{statusMessage}</span>
            </motion.div>
          )}

          {/* PRIMARY FILE SHARING OPTIONS (IMAGE & PDF) */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <i className="fa-solid fa-file-export text-[#c5834e]"></i>
              <span>خيارات المشاركة كملف (صورة / PDF):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Share as Image */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleShareAsImage}
                disabled={isGeneratingImage || isGeneratingPdf}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/25 cursor-pointer transition-all border border-emerald-400/30 disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-lg">
                  <i
                    className={`fa-solid ${
                      isGeneratingImage ? "fa-spinner fa-spin" : "fa-image"
                    }`}
                  ></i>
                </div>
                <span className="text-sm font-black">مشاركة كصورة (PNG)</span>
                <span className="text-[10px] text-emerald-100 opacity-90">
                  لواتساب وإنستجرام وتطبيقات الهاتف
                </span>
              </motion.button>

              {/* Option 2: Share as PDF */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleShareAsPdf}
                disabled={isGeneratingImage || isGeneratingPdf}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-[#c5834e] to-[#a6632f] hover:from-[#b5733e] hover:to-[#96531f] text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-[#c5834e]/25 cursor-pointer transition-all border border-amber-300/30 disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-lg">
                  <i
                    className={`fa-solid ${
                      isGeneratingPdf ? "fa-spinner fa-spin" : "fa-file-pdf"
                    }`}
                  ></i>
                </div>
                <span className="text-sm font-black">مشاركة كملف PDF</span>
                <span className="text-[10px] text-amber-100 opacity-90">
                  مستند كامل جاهز للحفظ والإرسال
                </span>
              </motion.button>
            </div>
          </div>

          {/* Quick Direct WhatsApp Section */}
          <div className="bg-slate-50 dark:bg-[#181c22] border border-slate-200 dark:border-[#2c323f] rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <i className="fa-brands fa-whatsapp text-emerald-500 text-sm"></i>
                <span>مراسلة واتساب سريعة بالرقم:</span>
              </label>
              <span className="text-[10px] text-slate-400">اختياري</span>
            </div>

            <div className="flex gap-2">
              <input
                type="tel"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="مثال: 0912345678"
                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-[#121418] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white font-mono text-left"
                dir="ltr"
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleDirectWhatsApp}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer shrink-0"
              >
                <i className="fa-brands fa-whatsapp text-sm"></i>
                <span>فتح واتساب</span>
              </motion.button>
            </div>
          </div>

          {/* Additional text copy / telegram quick links */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400">
            <button
              onClick={() => {
                soundFx.playClick();
                shareViaTelegram(
                  shareText || (order ? generateOrderShareText(order, shopName) : title)
                );
              }}
              className="hover:text-[#229ED9] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <i className="fa-brands fa-telegram text-[#229ED9]"></i>
              <span>مشاركة بتيليجرام</span>
            </button>

            <button
              onClick={handleCopyText}
              className="hover:text-emerald-500 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <i className={`fa-solid ${copied ? "fa-check text-emerald-500" : "fa-copy"}`}></i>
              <span>{copied ? "تم نسخ النص!" : "نسخ ملخص النص"}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
