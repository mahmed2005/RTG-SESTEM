import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { soundFx } from "../services/soundEffects";
import { Order } from "../types";
import {
  generateInvoiceImage,
  generateInvoicePdf,
  htmlStringToImageBlob,
  htmlStringToPdfBlob,
  htmlElementToImageBlob,
  htmlElementToPdfBlob,
  shareFileOrDownload,
  shareViaWhatsApp,
  shareViaTelegram,
  shareViaFacebook,
  generateOrderShareText,
  downloadBlob,
  copyTextToClipboard,
  copyImageBlobToClipboard,
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
  initialTab?: "image" | "pdf" | "whatsapp";
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
  initialTab = "image",
}) => {
  const [customPhone, setCustomPhone] = useState(recipientPhone || "");
  const [activeTab, setActiveTab] = useState<"image" | "pdf" | "whatsapp">(initialTab);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [cachedImageBlob, setCachedImageBlob] = useState<Blob | null>(null);
  const [cachedPdfBlob, setCachedPdfBlob] = useState<Blob | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate Image and PDF previews in parallel when modal opens
  useEffect(() => {
    if (!isOpen) {
      setPreviewDataUrl(null);
      setCachedImageBlob(null);
      setCachedPdfBlob(null);
      setStatusMessage(null);
      return;
    }

    if (initialTab) {
      setActiveTab(initialTab);
    }

    let isMounted = true;

    const preparePreview = async () => {
      try {
        if (order) {
          // Instant pure-canvas invoice generation (<5ms)
          const { blob, dataUrl } = await generateInvoiceImage(order, shopName);
          if (isMounted) {
            setCachedImageBlob(blob);
            setPreviewDataUrl(dataUrl);
          }

          // Pre-generate PDF in background
          generateInvoicePdf(order, shopName)
            .then((pdfRes) => {
              if (isMounted) setCachedPdfBlob(pdfRes.blob);
            })
            .catch(() => {});
        } else if (targetElementId) {
          const el = document.getElementById(targetElementId);
          if (el) {
            const blob = await htmlElementToImageBlob(el);
            const dataUrl = URL.createObjectURL(blob);
            if (isMounted) {
              setCachedImageBlob(blob);
              setPreviewDataUrl(dataUrl);
            }

            htmlElementToPdfBlob(el, title)
              .then((pdfBlob) => {
                if (isMounted) setCachedPdfBlob(pdfBlob);
              })
              .catch(() => {});
          }
        } else if (htmlContent) {
          const { blob, dataUrl } = await htmlStringToImageBlob(htmlContent, 720);
          if (isMounted) {
            setCachedImageBlob(blob);
            setPreviewDataUrl(dataUrl);
          }

          htmlStringToPdfBlob(htmlContent, title)
            .then((pdfRes) => {
              if (isMounted) setCachedPdfBlob(pdfRes.blob);
            })
            .catch(() => {});
        }
      } catch (err) {
        console.warn("Preview prep error:", err);
      }
    };

    preparePreview();

    return () => {
      isMounted = false;
    };
  }, [isOpen, order, targetElementId, htmlContent, shopName, initialTab, title]);

  if (!isOpen) return null;

  const baseFileName =
    fileName || (order ? `فاتورة-${order.id}` : "تقرير-مبيعات-RTG");

  const effectiveShareText =
    shareText ||
    (order ? generateOrderShareText(order, shopName) : `📊 ${title} - ${shopName}`);

  // Helper to get or generate Image Blob
  const getImageBlob = async (): Promise<Blob> => {
    if (cachedImageBlob) return cachedImageBlob;

    if (order) {
      const { blob, dataUrl } = await generateInvoiceImage(order, shopName);
      setCachedImageBlob(blob);
      setPreviewDataUrl(dataUrl);
      return blob;
    }

    if (targetElementId) {
      const el = document.getElementById(targetElementId);
      if (el) {
        const blob = await htmlElementToImageBlob(el);
        setCachedImageBlob(blob);
        return blob;
      }
    }

    if (htmlContent) {
      const { blob, dataUrl } = await htmlStringToImageBlob(htmlContent, 720);
      setCachedImageBlob(blob);
      setPreviewDataUrl(dataUrl);
      return blob;
    }

    throw new Error("لا يوجد محتوى متاح لإنشاء الصورة");
  };

  // Helper to get or generate PDF Blob
  const getPdfBlob = async (): Promise<Blob> => {
    if (cachedPdfBlob) return cachedPdfBlob;

    if (order) {
      const { blob } = await generateInvoicePdf(order, shopName);
      setCachedPdfBlob(blob);
      return blob;
    }

    if (targetElementId) {
      const el = document.getElementById(targetElementId);
      if (el) {
        const blob = await htmlElementToPdfBlob(el, title);
        setCachedPdfBlob(blob);
        return blob;
      }
    }

    if (htmlContent) {
      const { blob } = await htmlStringToPdfBlob(htmlContent, title);
      setCachedPdfBlob(blob);
      return blob;
    }

    throw new Error("لا يوجد محتوى متاح لإنشاء الـ PDF");
  };

  // 1. Mobile Native Share Sheet (Triggers phone's system share menu)
  const handleNativeShare = async (type: "image" | "pdf") => {
    try {
      soundFx.playClick();
      setIsProcessing(true);
      setStatusMessage("جاري فتح قائمة المشاركة بالهاتف...");

      let blob: Blob;
      let filename: string;
      let mimeType: string;

      if (type === "image") {
        blob = cachedImageBlob || (await getImageBlob());
        filename = `${baseFileName}.png`;
        mimeType = "image/png";
      } else {
        blob = cachedPdfBlob || (await getPdfBlob());
        filename = `${baseFileName}.pdf`;
        mimeType = "application/pdf";
      }

      const res = await shareFileOrDownload(
        blob,
        filename,
        mimeType,
        title,
        effectiveShareText
      );

      soundFx.playSuccess();
      if (res.sharedViaNative) {
        setStatusMessage("✓ تم فتح قائمة المشاركة بالهاتف بنجاح");
      } else {
        if (type === "image") {
          copyImageBlobToClipboard(blob).then((copiedOk) => {
            if (copiedOk) {
              setStatusMessage("✓ تم نسخ صورة الفاتورة وحفظها! يمكنك لصقها الآن في واتساب أو أي تطبيق.");
            } else {
              setStatusMessage("✓ تم تنزيل الصورة! يمكنك مشاركتها عبر الأزرار أدناه 👇");
            }
          });
        } else {
          setStatusMessage("✓ تم تنزيل ملف الـ PDF بجهازك! يمكنك إرساله للمستلم عبر التطبيقات أدناه 👇");
        }
      }
    } catch (err) {
      console.error("Native share error:", err);
      setStatusMessage("اختر التطبيق المطلوب للمشاركة من الأزرار المباشرة أدناه 👇");
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Save Image to Gallery / Device
  const handleSaveToGallery = async () => {
    try {
      soundFx.playSuccess();
      setIsProcessing(true);
      const blob = cachedImageBlob || (await getImageBlob());
      downloadBlob(blob, `${baseFileName}.png`);
      setStatusMessage("✓ تم حفظ الصورة في المعرض والتنزيلات بنجاح!");
    } catch {
      setStatusMessage("فشل حفظ الصورة");
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Copy Image Blob to Clipboard for 1-tap pasting into chat
  const handleCopyImage = async () => {
    try {
      soundFx.playClick();
      setIsProcessing(true);
      const blob = cachedImageBlob || (await getImageBlob());
      const success = await copyImageBlobToClipboard(blob);
      if (success) {
        soundFx.playSuccess();
        setStatusMessage("✓ تم نسخ صورة الفاتورة للحافظة! يمكنك الآن لصقها (Paste) في محادثة واتساب أو أي تطبيق.");
      } else {
        downloadBlob(blob, `${baseFileName}.png`);
        setStatusMessage("✓ تم حفظ الصورة في التنزيلات والمعرض!");
      }
    } catch {
      setStatusMessage("تعذر نسخ الصورة تلقائياً");
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Save PDF to Device
  const handleSavePdf = async () => {
    try {
      soundFx.playSuccess();
      setIsProcessing(true);
      const blob = cachedPdfBlob || (await getPdfBlob());
      downloadBlob(blob, `${baseFileName}.pdf`);
      setStatusMessage("✓ تم تنزيل ملف الـ PDF بنجاح!");
    } catch {
      setStatusMessage("فشل تنزيل ملف الـ PDF");
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. WhatsApp share (with text and image preparation)
  const handleWhatsAppShare = async () => {
    soundFx.playSuccess();
    try {
      if (cachedImageBlob) {
        downloadBlob(cachedImageBlob, `${baseFileName}.png`);
        await copyImageBlobToClipboard(cachedImageBlob).catch(() => {});
      }
    } catch {}
    shareViaWhatsApp(effectiveShareText, customPhone);
    setStatusMessage("✓ تم فتح واتساب وتجهيز الصورة للمحادثة!");
  };

  // 6. Facebook share
  const handleFacebookShare = () => {
    soundFx.playClick();
    if (cachedImageBlob) {
      downloadBlob(cachedImageBlob, `${baseFileName}.png`);
    }
    shareViaFacebook(effectiveShareText);
  };

  // 7. Telegram share
  const handleTelegramShare = () => {
    soundFx.playClick();
    if (cachedImageBlob) {
      downloadBlob(cachedImageBlob, `${baseFileName}.png`);
    }
    shareViaTelegram(effectiveShareText);
  };

  // 8. Copy Text Summary
  const handleCopyText = async () => {
    soundFx.playClick();
    const ok = await copyTextToClipboard(effectiveShareText);
    if (ok) {
      soundFx.playSuccess();
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      setStatusMessage("✓ تم نسخ نص الفاتورة للحافظة");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[95] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#2c323f] rounded-3xl p-4 sm:p-6 w-full max-w-lg shadow-2xl text-right space-y-4 max-h-[95vh] flex flex-col"
          dir="rtl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#c5834e] to-[#a6632f] text-white flex items-center justify-center text-lg shadow-md shadow-[#c5834e]/20">
                <i className="fa-solid fa-share-nodes"></i>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                  {title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {subtitle || "مشاركة كصورة (PNG) أو ملف (PDF) عبر واتساب وتطبيقات الهاتف"}
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

          {/* Tab Selector: Image PNG / PDF File / WhatsApp Direct */}
          <div className="flex p-1 bg-slate-100 dark:bg-[#181c22] rounded-2xl gap-1 shrink-0">
            <button
              onClick={() => setActiveTab("image")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "image"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              <i className="fa-solid fa-image"></i>
              <span>مشاركة كصورة (PNG)</span>
            </button>

            <button
              onClick={() => setActiveTab("pdf")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "pdf"
                  ? "bg-[#c5834e] text-white shadow-md shadow-[#c5834e]/20"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              <i className="fa-solid fa-file-pdf"></i>
              <span>مشاركة كـ PDF</span>
            </button>

            <button
              onClick={() => setActiveTab("whatsapp")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "whatsapp"
                  ? "bg-[#25D366] text-white shadow-md shadow-emerald-500/20"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
              }`}
            >
              <i className="fa-brands fa-whatsapp"></i>
              <span>واتساب برقم</span>
            </button>
          </div>

          {/* Status Message Notification */}
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-2.5 rounded-xl bg-[#c5834e]/10 border border-[#c5834e]/20 text-xs font-bold text-[#c5834e] flex items-center gap-2 shrink-0"
            >
              <i className="fa-solid fa-circle-check text-emerald-500"></i>
              <span>{statusMessage}</span>
            </motion.div>
          )}

          {/* Scrollable Main Content */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-0.5">
            {/* ==================================================== */}
            {/* TAB 1: SHARE AS IMAGE (PNG)                          */}
            {/* ==================================================== */}
            {activeTab === "image" && (
              <div className="space-y-3.5">
                {/* 1. Primary Big Button: Native Phone Share Sheet */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNativeShare("image")}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/30 cursor-pointer transition-all border border-emerald-400/30 disabled:opacity-50"
                >
                  <i
                    className={`fa-solid ${
                      isProcessing ? "fa-spinner fa-spin" : "fa-arrow-up-from-bracket"
                    } text-base`}
                  ></i>
                  <span>📲 فتح قائمة المشاركة بالهاتف (واتساب، فيس، إنستجرام)</span>
                </motion.button>

                {/* 2. Direct Social Channels Grid */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <i className="fa-solid fa-bolt text-amber-500"></i>
                    <span>مشاركة سريعة ومباشرة عبر التطبيقات:</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* WhatsApp */}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleWhatsAppShare}
                      className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex flex-col items-center justify-center gap-1 shadow-md shadow-emerald-500/20 cursor-pointer transition-all"
                    >
                      <i className="fa-brands fa-whatsapp text-lg"></i>
                      <span>واتساب</span>
                    </motion.button>

                    {/* Instagram */}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleCopyImage}
                      className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-600 to-purple-600 text-white text-xs font-bold flex flex-col items-center justify-center gap-1 shadow-md shadow-pink-500/20 cursor-pointer transition-all"
                      title="نسخ الصورة وحفظها للصقها في إنستجرام"
                    >
                      <i className="fa-brands fa-instagram text-lg"></i>
                      <span>إنستجرام</span>
                    </motion.button>

                    {/* Facebook */}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleFacebookShare}
                      className="p-2.5 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold flex flex-col items-center justify-center gap-1 shadow-md shadow-blue-500/20 cursor-pointer transition-all"
                    >
                      <i className="fa-brands fa-facebook text-lg"></i>
                      <span>فيسبوك</span>
                    </motion.button>

                    {/* Telegram */}
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleTelegramShare}
                      className="p-2.5 rounded-xl bg-[#229ED9] hover:bg-[#1d8bc0] text-white text-xs font-bold flex flex-col items-center justify-center gap-1 shadow-md shadow-sky-500/20 cursor-pointer transition-all"
                    >
                      <i className="fa-brands fa-telegram text-lg"></i>
                      <span>تيليجرام</span>
                    </motion.button>
                  </div>
                </div>

                {/* 3. Action Buttons: Copy Image & Save to Gallery */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCopyImage}
                    disabled={isProcessing}
                    className="py-2.5 px-3 rounded-xl bg-[#c5834e]/15 hover:bg-[#c5834e]/25 text-[#c5834e] dark:text-[#e0a36e] border border-[#c5834e]/30 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                    title="نسخ صورة الفاتورة بالكامل للصقها مباشرة في أي محادثة"
                  >
                    <i className="fa-solid fa-copy"></i>
                    <span>نسخ صورة الفاتورة للحافظة</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveToGallery}
                    disabled={isProcessing}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-[#1e242c] hover:bg-slate-200 dark:hover:bg-[#252c36] text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all border border-slate-200 dark:border-slate-700"
                  >
                    <i className="fa-solid fa-download text-emerald-500"></i>
                    <span>حفظ بالمعرض والتنزيلات</span>
                  </motion.button>
                </div>

                {/* 4. Live Image Preview & Long-Press Helper */}
                {previewDataUrl && (
                  <div className="bg-slate-50 dark:bg-[#181c22] border border-slate-200 dark:border-[#2c323f] rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-bold">
                      <span className="flex items-center gap-1">
                        <i className="fa-solid fa-eye text-[#c5834e]"></i>
                        <span>معاينة الصورة الجاهزة:</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        💡 اضغط مطولاً على الصورة للحفظ أو المشاركة
                      </span>
                    </div>

                    <div className="flex justify-center bg-white dark:bg-black/40 rounded-xl p-2 border border-slate-200 dark:border-slate-800 max-h-56 overflow-y-auto">
                      <img
                        src={previewDataUrl}
                        alt="معاينة الفاتورة"
                        className="w-full max-w-sm rounded-lg shadow-sm object-contain select-all"
                        loading="eager"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==================================================== */}
            {/* TAB 2: SHARE AS PDF                                  */}
            {/* ==================================================== */}
            {activeTab === "pdf" && (
              <div className="space-y-3.5">
                {/* 1. Primary Big Button: Native PDF Share */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNativeShare("pdf")}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#c5834e] to-[#a6632f] hover:from-[#b5733e] hover:to-[#96531f] text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-[#c5834e]/30 cursor-pointer transition-all border border-amber-400/30 disabled:opacity-50"
                >
                  <i
                    className={`fa-solid ${
                      isProcessing ? "fa-spinner fa-spin" : "fa-file-pdf"
                    } text-base`}
                  ></i>
                  <span>📲 إرسال ومشاركة ملف الـ PDF عبر الهاتف</span>
                </motion.button>

                {/* 2. Download PDF */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSavePdf}
                  disabled={isProcessing}
                  className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-[#1e242c] hover:bg-slate-200 dark:hover:bg-[#252c36] text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all border border-slate-200 dark:border-slate-700"
                >
                  <i className="fa-solid fa-download text-[#c5834e]"></i>
                  <span>تنزيل ملف الـ PDF مباشرة على الجهاز</span>
                </motion.button>

                {/* 3. Direct Social Actions for PDF */}
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleWhatsAppShare}
                    className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <i className="fa-brands fa-whatsapp text-base"></i>
                    <span>إرسال عبر واتساب</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleTelegramShare}
                    className="p-2.5 rounded-xl bg-[#229ED9] hover:bg-[#1d8bc0] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <i className="fa-brands fa-telegram text-base"></i>
                    <span>تيليجرام</span>
                  </motion.button>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <i className="fa-solid fa-circle-info"></i>
                    <span>ملاحظة لمشاركة ملفات الـ PDF:</span>
                  </div>
                  <p className="leading-relaxed">
                    عند الضغط على زر المشاركة من الهاتف، تفتح نافذة النظام لتختار واتساب أو أي تطبيق لإرسال ملف الـ PDF كملف رسمي جاهز للطباعة والقراءة.
                  </p>
                </div>
              </div>
            )}

            {/* ==================================================== */}
            {/* TAB 3: WHATSAPP DIRECT                               */}
            {/* ==================================================== */}
            {activeTab === "whatsapp" && (
              <div className="space-y-3.5">
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-3.5 space-y-2.5">
                  <label className="text-xs font-bold text-emerald-900 dark:text-emerald-300 block flex items-center justify-between">
                    <span>رقم هاتف المستلم (واتساب):</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      مع كود الدولة (مثلاً: 218...)
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      placeholder="0912345678 أو 218912345678"
                      className="flex-1 px-3 py-2 text-xs bg-white dark:bg-[#181c22] border border-emerald-300 dark:border-emerald-500/30 rounded-xl outline-none focus:border-emerald-500 text-slate-900 dark:text-white font-mono text-left"
                      dir="ltr"
                    />
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleWhatsAppShare}
                      className="px-4 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer shrink-0"
                    >
                      <i className="fa-brands fa-whatsapp text-sm"></i>
                      <span>إرسال</span>
                    </motion.button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>أو نسخ نص الفاتورة:</span>
                  <button
                    onClick={handleCopyText}
                    className="hover:text-emerald-600 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <i
                      className={`fa-solid ${
                        copied ? "fa-check text-emerald-500" : "fa-copy"
                      }`}
                    ></i>
                    <span>{copied ? "تم النسخ!" : "نسخ النص"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
