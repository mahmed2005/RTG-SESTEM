import React, { useEffect, useState } from "react";
import { printService, PrintableDocument } from "../services/printHelper";
import { soundFx } from "../services/soundEffects";
import { motion, AnimatePresence } from "motion/react";

export const DocumentViewerModal: React.FC = () => {
  const [doc, setDoc] = useState<PrintableDocument | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    return printService.subscribe((currentDoc) => {
      setDoc(currentDoc);
    });
  }, []);

  if (!doc) return null;

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

  const handleDownload = () => {
    soundFx.playClick();
    printService.downloadHtmlFile();
  };

  const handleClose = () => {
    soundFx.playClick();
    printService.closeDocument();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[80] flex flex-col items-center justify-center p-2 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#2c323f] rounded-2xl sm:rounded-3xl w-full max-w-4xl h-[94vh] flex flex-col shadow-2xl overflow-hidden"
          dir="rtl"
        >
          {/* Header Bar */}
          <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-[#2c323f] flex items-center justify-between gap-2 bg-slate-50 dark:bg-[#181c22]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#c5834e]/15 border border-[#c5834e]/30 text-[#c5834e] flex items-center justify-center shrink-0">
                <i className="fa-solid fa-file-invoice text-sm"></i>
              </div>
              <div className="truncate">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                  {doc.title}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  جاهز للطباعة والحفظ كملف PDF على الهاتف والكمبيوتر
                </p>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-1.5 shrink-0">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handlePrint}
                disabled={isPrinting}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-[#c5834e] to-[#a6632f] hover:from-[#b5733e] hover:to-[#96531f] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#c5834e]/20 cursor-pointer"
                title="طباعة أو حفظ كملف PDF"
              >
                <i className={`fa-solid ${isPrinting ? "fa-spinner fa-spin" : "fa-print"}`}></i>
                <span className="hidden sm:inline">طباعة / حفظ PDF</span>
                <span className="sm:hidden">طباعة PDF</span>
              </motion.button>

              <button
                type="button"
                onClick={handleOpenNewTab}
                className="px-2.5 py-1.5 sm:py-2 bg-slate-200 dark:bg-[#222731] hover:bg-slate-300 dark:hover:bg-[#2b323f] text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                title="فتح في صفحة مستقلة"
              >
                <i className="fa-solid fa-up-right-from-square"></i>
                <span className="hidden md:inline">نافذة جديدة</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="hidden sm:flex px-2.5 py-1.5 sm:py-2 bg-slate-200 dark:bg-[#222731] hover:bg-slate-300 dark:hover:bg-[#2b323f] text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer items-center gap-1"
                title="تنزيل كملف HTML"
              >
                <i className="fa-solid fa-download"></i>
                <span>تنزيل</span>
              </button>

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

          {/* Document Content View */}
          <div className="flex-1 overflow-auto bg-slate-100 dark:bg-[#0d1015] p-2 sm:p-4 flex justify-center items-start">
            <div className="w-full max-w-3xl bg-white text-slate-900 rounded-xl shadow-lg border border-slate-200 p-2 sm:p-6 overflow-x-auto">
              <div
                className="printable-document"
                dangerouslySetInnerHTML={{ __html: doc.html }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
