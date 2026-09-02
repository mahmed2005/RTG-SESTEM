import React, { useState } from "react";

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
    onConfirm(invoiceId, note.trim() || "تم الإرجاع واستعادة السلع للمخزن");
    setNote("");
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeInUp">
      <div className="bg-[#1e293b] rounded-2xl border border-slate-800 p-5 w-full max-w-sm shadow-2xl text-center space-y-4">
        <div className="w-12 h-12 bg-red-500/15 text-[#ff1e27] rounded-full flex items-center justify-center text-xl mx-auto border border-red-500/30">
          <i className="fa-solid fa-rotate-left"></i>
        </div>

        <div>
          <h3 className="text-sm font-black text-white">
            تأكيد إرجاع الفاتورة #{invoiceId} بالكامل؟
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            سيتم تصفير أرباح هذه الفاتورة وإعادة كافة السلع المباعة فيها إلى رصيد المخزن تلقائياً.
          </p>
        </div>

        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="سبب أو ملاحظة الإرجاع (اختياري)..."
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-xs outline-none focus:border-[#ff1e27]"
        />

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleConfirm}
            className="bg-[#ff1e27] hover:bg-[#b91c1c] text-white font-bold py-2.5 rounded-xl text-xs glow-btn cursor-pointer"
          >
            نعم، تأكيد الإرجاع
          </button>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
