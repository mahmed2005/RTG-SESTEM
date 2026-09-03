import React, { useState } from "react";
import { soundFx } from "../services/soundEffects";
import { motion, AnimatePresence } from "motion/react";

interface ReturnModalProps {
  invoiceId: string | null;
  onConfirm: (invoiceId: string, note: string) => void;
  onClose: () => void;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({
  invoiceId,
  onConfirm,
  onClose,
}) => {
  const [note, setNote] = useState("");

  if (!invoiceId) return null;

  const handleConfirm = () => {
    soundFx.playReturn();
    onConfirm(invoiceId, note.trim() || "تم الإرجاع واستعادة السلع للمخزن");
    setNote("");
  };

  const handleCancel = () => {
    soundFx.playClick();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-slate-900 rounded-3xl border border-rose-500/30 p-5 sm:p-6 w-full max-w-sm shadow-2xl text-center space-y-4"
        >
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: -360 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-14 h-14 bg-rose-500/15 text-rose-400 rounded-2xl flex items-center justify-center text-2xl mx-auto border border-rose-500/30 shadow-lg shadow-rose-500/10"
          >
            <i className="fa-solid fa-rotate-left"></i>
          </motion.div>

          <div>
            <h3 className="text-base font-black text-white">
              تأكيد إرجاع الفاتورة #{invoiceId}
            </h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              سيتم نقل الفاتورة إلى سجل المرتجعات، وإعادة كافة السلع المباعة فوراً إلى رصيد المخزن ومزامنتها سحابياً.
            </p>
          </div>

          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="سبب أو ملاحظة الإرجاع (اختياري)..."
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-rose-500 transition-colors"
          />

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleConfirm}
              className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-rose-600/30 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <i className="fa-solid fa-rotate-left"></i> نعم، تأكيد الإرجاع
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCancel}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
            >
              إلغاء
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
