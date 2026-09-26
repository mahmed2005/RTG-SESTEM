import React, { useEffect, useState, useRef } from "react";
import { printService, PrintableDocument } from "../services/printHelper";
import { soundFx } from "../services/soundEffects";
import { motion, AnimatePresence } from "motion/react";
import { ShareModal } from "./ShareModal";
import {
  htmlElementToImageBlob,
  htmlElementToPdfBlob,
  shareFileOrDownload,
} from "../services/shareHelper";

export const DocumentViewerModal: React.FC = () => {
  const [doc, setDoc] = useState<PrintableDocument | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSharingImage, setIsSharingImage] = useState(false);
  const [isSharingPdf, setIsSharingPdf] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareModalTab, setShareModalTab] = useState<"image" | "pdf">("image");
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const documentContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return printService.subscribe((currentDoc) => {
      setDoc(currentDoc);
    });
  }, []);

  if (!doc) return null;

  const showNotification = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  const handlePrint = () => {
    soundFx.playSuccess();
    setIsPrinting(true);
    printService.triggerNativePrint();
    setTimeout(() => setIsPrinting(false), 800);
  };

  const handleOpenNewTab = () => {
    soundFx.playClick();
    printService.openInNewTab();
  };

  const handleDownloadHtml = () => {
    soundFx.playClick();
    printService.downloadHtmlFile();
  };

  const handleClose = () => {
    soundFx.playClick();
    printService.closeDocument();
  };

  // Direct 1-Click Share as Image (PNG) -> Opens Social Apps Share Dialog
  const handleDirectShareImage = () => {
    soundFx.playClick();
    setShareModalTab("image");
    setIsShareModalOpen(true);
  };

  // Direct 1-Click Share as PDF -> Opens PDF Share Dialog
  const handleDirectSharePdf = () => {
    soundFx.playClick();
    setShareModalTab("pdf");
    setIsShareModalOpen(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[80] flex flex-col items-center justify-center p-2 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#2c323f] rounded-2xl sm:rounded-3xl w-full max-w-5xl h-[94vh] flex flex-col shadow-2xl overflow-hidden"
          dir="rtl"
        >
          {/* Header Bar */}
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-[#2c323f] flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-[#181c22]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#c5834e]/15 border border-[#c5834e]/30 text-[#c5834e] flex items-center justify-center shrink-0">
                <i className="fa-solid fa-file-invoice text-sm"></i>
              </div>
              <div className="truncate">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                  {doc.title}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  جاهز للطباعة والمشاركة الفورية كصورة أو ملف PDF
                </p>
              </div>
            </div>

            {/* Actions Bar: Print, Share as Image, Share as PDF, Share Modal, New Tab, Download, Close */}
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              {/* 1. Native Print / Save PDF */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handlePrint}
                disabled={isPrinting}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-[#c5834e] to-[#a6632f] hover:from-[#b5733e] hover:to-[#96531f] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#c5834e]/20 cursor-pointer"
                title="طباعة أو حفظ عبر الطابعة"
              >
                <i className={`fa-solid ${isPrinting ? "fa-spinner fa-spin" : "fa-print"}`}></i>
                <span className="hidden sm:inline">طباعة</span>
              </motion.button>

              {/* 2. Share as Image (PNG) */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleDirectShareImage}
                disabled={isSharingImage || isSharingPdf}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                title="مشاركة التقرير كصورة (PNG) عبر واتساب والإنستغرام"
              >
                <i className={`fa-solid ${isSharingImage ? "fa-spinner fa-spin" : "fa-image"} text-xs`}></i>
                <span>مشاركة كصورة</span>
              </motion.button>

              {/* 3. Share as PDF */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleDirectSharePdf}
                disabled={isSharingImage || isSharingPdf}
                className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-600/20 disabled:opacity-50"
                title="مشاركة كملف PDF رسمي جاهز"
              >
                <i className={`fa-solid ${isSharingPdf ? "fa-spinner fa-spin" : "fa-file-pdf"} text-xs`}></i>
                <span>مشاركة PDF</span>
              </motion.button>

              {/* 4. More Share Options Dialog */}
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="px-2.5 py-1.5 sm:py-2 bg-slate-200 dark:bg-[#222731] hover:bg-slate-300 dark:hover:bg-[#2b323f] text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                title="خيارات مشاركة إضافية ورقم واتساب"
              >
                <i className="fa-solid fa-share-nodes text-xs"></i>
                <span className="hidden md:inline">خيارات</span>
              </button>

              {/* 5. Open in new tab */}
              <button
                type="button"
                onClick={handleOpenNewTab}
                className="hidden sm:flex px-2.5 py-1.5 sm:py-2 bg-slate-200 dark:bg-[#222731] hover:bg-slate-300 dark:hover:bg-[#2b323f] text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer items-center gap-1"
                title="فتح في صفحة مستقلة"
              >
                <i className="fa-solid fa-up-right-from-square"></i>
              </button>

              {/* 6. Download HTML */}
              <button
                type="button"
                onClick={handleDownloadHtml}
                className="hidden md:flex px-2.5 py-1.5 sm:py-2 bg-slate-200 dark:bg-[#222731] hover:bg-slate-300 dark:hover:bg-[#2b323f] text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer items-center gap-1"
                title="تنزيل كملف HTML"
              >
                <i className="fa-solid fa-download"></i>
              </button>

              {/* 7. Close */}
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-200 dark:bg-[#222731] hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center text-xs transition-colors cursor-pointer"
                title="إغلاق"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
          </div>

          {/* Feedback Toast */}
          {feedbackToast && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#c5834e] text-white text-xs font-bold py-2 px-4 text-center shadow-md flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-circle-check"></i>
              <span>{feedbackToast}</span>
            </motion.div>
          )}

          {/* Document Content View */}
          <div className="flex-1 overflow-auto bg-slate-100 dark:bg-[#0d1015] p-2 sm:p-6 flex justify-center items-start">
            <div
              ref={documentContentRef}
              id="active-document-content"
              className="w-full max-w-3xl bg-white text-slate-900 rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-8 overflow-x-auto"
            >
              <div
                className="printable-document"
                dangerouslySetInnerHTML={{ __html: doc.html }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Share Modal Dialog with Full PDF/Image capability */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={`مشاركة: ${doc.title}`}
        targetElementId="active-document-content"
        htmlContent={doc.html}
        fileName={doc.title}
        initialTab={shareModalTab}
        subtitle="شارك كصورة واضحة أو كملف PDF رسمي عبر واتساب وإنستجرام"
      />
    </AnimatePresence>
  );
};
