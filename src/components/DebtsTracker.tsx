import React, { useState } from "react";
import { Debt } from "../types";

interface DebtsTrackerProps {
  debts: Debt[];
  onAddOrUpdateDebt: (
    type: "لي" | "علي",
    name: string,
    phone: string,
    amount: number,
    dueDate: string,
    note: string
  ) => void;
  onRecordPayment: (debtId: string, amount: number) => void;
  onCloseDebt: (debtId: string) => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export const DebtsTracker: React.FC<DebtsTrackerProps> = ({
  debts,
  onAddOrUpdateDebt,
  onRecordPayment,
  onCloseDebt,
  showToast,
}) => {
  // Form state
  const [debtType, setDebtType] = useState<"لي" | "علي">("لي");
  const [debtName, setDebtName] = useState("");
  const [debtPhone, setDebtPhone] = useState("");
  const [debtAmount, setDebtAmount] = useState<number | "">("");
  const [debtDueDate, setDebtDueDate] = useState("");
  const [debtNote, setDebtNote] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Payment Modal state
  const [paymentModalDebt, setPaymentModalDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");

  // Close Debt Modal state
  const [closeModalDebt, setCloseModalDebt] = useState<Debt | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  let owedToMe = 0;
  let iOwe = 0;
  let openCount = 0;
  let lateCount = 0;

  debts.forEach((d) => {
    const rem = Number(d.remaining) || 0;
    if (d.status !== "مغلق" && rem > 0) {
      openCount++;
      if (d.type === "لي") owedToMe += rem;
      if (d.type === "علي") iOwe += rem;
      if (d.dueDate && String(d.dueDate).slice(0, 10) < today) {
        lateCount++;
      }
    }
  });

  const filteredDebts = debts.filter((d) => {
    const q = search.toLowerCase().trim();
    if (
      q &&
      !String(d.name || "").toLowerCase().includes(q) &&
      !String(d.phone || "").includes(q) &&
      !d.id.toLowerCase().includes(q)
    ) {
      return false;
    }
    if (typeFilter && d.type !== typeFilter) return false;
    if (statusFilter && d.status !== statusFilter) return false;
    return true;
  });

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtName.trim()) {
      showToast("يرجى كتابة اسم الشخص / العميل", "error");
      return;
    }
    const amt = Number(debtAmount);
    if (!amt || amt <= 0) {
      showToast("يرجى إدخال مبلغ صحيح للدين", "error");
      return;
    }

    onAddOrUpdateDebt(
      debtType,
      debtName.trim(),
      debtPhone.trim(),
      amt,
      debtDueDate,
      debtNote.trim()
    );

    showToast("✓ تم حفظ وتسجيل الدين بنجاح", "success");
    setDebtName("");
    setDebtPhone("");
    setDebtAmount("");
    setDebtDueDate("");
    setDebtNote("");
  };

  const openPaymentModal = (debt: Debt) => {
    setPaymentModalDebt(debt);
    setPaymentAmount("");
  };

  const submitPayment = () => {
    if (!paymentModalDebt) return;
    const amt = parseFloat(paymentAmount) || 0;
    if (amt <= 0) {
      showToast("الرجاء إدخال قيمة صحيحة للدفعة", "error");
      return;
    }

    onRecordPayment(paymentModalDebt.id, amt);
    showToast(`✓ تم تسجيل دفعة بقيمة ${amt.toFixed(2)} د.ل`, "success");
    setPaymentModalDebt(null);
    setPaymentAmount("");
  };

  const submitCloseDebt = () => {
    if (!closeModalDebt) return;
    onCloseDebt(closeModalDebt.id);
    showToast("✓ تم إغلاق الدين واعتباره مسدداً بالكامل", "success");
    setCloseModalDebt(null);
  };

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-right card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">ديون لك (عند العملاء)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">
              <i className="fa-solid fa-hand-holding-dollar"></i>
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {owedToMe.toFixed(2)} <span className="text-xs font-normal text-slate-500">د.ل</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-2">
            مستحقات واجبة التحصيل
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-right card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">ديون عليك (للموردين)</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center text-xs">
              <i className="fa-solid fa-money-bill-transfer"></i>
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
            {iOwe.toFixed(2)} <span className="text-xs font-normal text-slate-500">د.ل</span>
          </div>
          <div className="text-[11px] text-red-600 dark:text-red-400 font-medium mt-2">
            التزامات للموردين
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-right card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">حسابات مفتوحة</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">
              <i className="fa-solid fa-file-invoice-dollar"></i>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {openCount} <span className="text-xs font-normal text-slate-500">حساب</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-2">
            قيد التسوية والمتابعة
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-right card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">ديون متأخرة</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs">
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
            {lateCount} <span className="text-xs font-normal text-slate-500">حساب</span>
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-2">
            تجاوزت تاريخ الاستحقاق
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Add/Update Form */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-3 text-right">
          <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <i className="fa-solid fa-plus text-blue-600"></i> إضافة أو تسجيل دين جديد
          </h4>

          <form onSubmit={handleSaveDebt} className="space-y-2.5">
            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1">نوع الدين</label>
              <select
                value={debtType}
                onChange={(e) => setDebtType(e.target.value as "لي" | "علي")}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none focus:border-blue-600"
              >
                <option value="لي">لي عند شخص (زبون)</option>
                <option value="علي">علي لشخص (مورد / التزام)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1">الاسم *</label>
              <input
                type="text"
                required
                value={debtName}
                onChange={(e) => setDebtName(e.target.value)}
                placeholder="اسم الشخص أو التاجر"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1">رقم الهاتف</label>
              <input
                type="tel"
                value={debtPhone}
                onChange={(e) => setDebtPhone(e.target.value)}
                placeholder="091XXXXXXX"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1">قيمة الدين (د.ل) *</label>
              <input
                type="number"
                min="1"
                step="0.1"
                required
                value={debtAmount}
                onChange={(e) => setDebtAmount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0.0"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none focus:border-blue-600 font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1">تاريخ الاستحقاق (اختياري)</label>
              <input
                type="date"
                value={debtDueDate}
                onChange={(e) => setDebtDueDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1">ملاحظات / تفاصيل</label>
              <textarea
                value={debtNote}
                onChange={(e) => setDebtNote(e.target.value)}
                placeholder="تفاصيل المشتريات أو ملاحظة..."
                rows={2}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none focus:border-blue-600 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 mt-1"
            >
              <i className="fa-solid fa-floppy-disk"></i> حفظ الدين في السجل
            </button>
          </form>
        </div>

        {/* Debts Filter & List */}
        <div className="lg:col-span-8 space-y-3">
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 text-right">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass text-slate-400 absolute right-3.5 top-3 text-xs"></i>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو الهاتف أو رقم الدين..."
                className="w-full pr-9 pl-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg outline-none focus:border-blue-600"
              >
                <option value="">كل الأنواع (لي وعلي)</option>
                <option value="لي">لي (عند الزبائن)</option>
                <option value="علي">علي (للموردين)</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg outline-none focus:border-blue-600"
              >
                <option value="">كل الحالات</option>
                <option value="مفتوح">مفتوح</option>
                <option value="مدفوع جزئياً">مدفوع جزئياً</option>
                <option value="مغلق">مغلق (مسدد)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredDebts.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-400 text-xs py-14 space-y-2">
                <i className="fa-solid fa-folder-open text-4xl mb-1 block opacity-30"></i>
                <p className="font-bold">لا توجد ديون مطابقة</p>
              </div>
            ) : (
              filteredDebts.map((d) => {
                const remaining = Number(d.remaining) || 0;
                let statusBadge = (
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                    {d.type === "لي" ? "لي (مستحق)" : "علي (مطلوب)"} • {d.status}
                  </span>
                );
                if (d.status === "مغلق") {
                  statusBadge = (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                      {d.type === "لي" ? "لي" : "علي"} • مغلق
                    </span>
                  );
                } else if (d.status === "مدفوع جزئياً") {
                  statusBadge = (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                      {d.type === "لي" ? "لي" : "علي"} • جزئي
                    </span>
                  );
                }

                return (
                  <div
                    key={d.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3 text-right transition-all hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">{d.name || "غير محدد"}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {d.phone || "بدون هاتف"} • #{d.id}
                        </p>
                      </div>
                      {statusBadge}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-2.5 border border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] text-slate-500 font-bold">المبلغ الأصلي</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-white font-mono mt-0.5">
                          {Number(d.original).toFixed(2)} د.ل
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-2.5 border border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] text-slate-500 font-bold">المدفوع</p>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                          {Number(d.paid).toFixed(2)} د.ل
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-2.5 border border-slate-200 dark:border-slate-800">
                        <p className="text-[10px] text-slate-500 font-bold">المتبقي</p>
                        <p
                          className={`text-xs font-bold font-mono mt-0.5 ${
                            remaining === 0 ? "text-slate-400" : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {remaining.toFixed(2)} د.ل
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        <i className="fa-solid fa-calendar ml-1 text-slate-400"></i>
                        استحقاق: {d.dueDate || "غير محدد"}
                      </span>
                      <span>
                        <i className="fa-solid fa-clock-rotate-left ml-1 text-slate-400"></i>
                        آخر تحديث: {d.updatedAt || d.date}
                      </span>
                    </div>

                    {d.note && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2">
                        {d.note}
                      </p>
                    )}

                    <div className="flex items-center gap-2 justify-end pt-1 border-t border-slate-100 dark:border-slate-800">
                      {d.status !== "مغلق" && remaining > 0 ? (
                        <>
                          <button
                            onClick={() => openPaymentModal(d)}
                            className="text-[11px] bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 px-3 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <i className="fa-solid fa-coins"></i> تسجيل دفعة
                          </button>
                          <button
                            onClick={() => setCloseModalDebt(d)}
                            className="text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <i className="fa-solid fa-lock"></i> إغلاق كامل
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                          <i className="fa-solid fa-circle-check"></i> تم تسديد الدين بالكامل
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Debt Payment Modal */}
      {paymentModalDebt && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeInUp">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 w-full max-w-sm shadow-xl text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-xl mx-auto border border-emerald-200 dark:border-emerald-500/20">
              <i className="fa-solid fa-coins"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">تسجيل دفعة جديدة</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                سجل دفعة لحساب <strong className="text-slate-800 dark:text-white">{paymentModalDebt.name}</strong>
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2.5 text-right">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">المتبقي على الدين:</span>
                <span className="text-red-600 dark:text-red-400 font-bold font-mono">
                  {paymentModalDebt.remaining.toFixed(2)} د.ل
                </span>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="أدخل قيمة الدفعة"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none focus:border-blue-600 text-center font-bold transition-all"
                />
              </div>

              {/* Quick % Buttons */}
              <div className="flex gap-1.5 pt-1">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() =>
                      setPaymentAmount(
                        ((paymentModalDebt.remaining * pct) / 100).toFixed(2)
                      )
                    }
                    className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg border transition-all cursor-pointer ${
                      pct === 100
                        ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/40 hover:bg-emerald-100"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {pct === 100 ? "الكل" : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={submitPayment}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <i className="fa-solid fa-check"></i> تأكيد الدفعة
              </button>
              <button
                onClick={() => setPaymentModalDebt(null)}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i> إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Debt Confirmation Modal */}
      {closeModalDebt && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeInUp">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 w-full max-w-sm shadow-xl text-center space-y-3">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-xl mx-auto border border-red-200 dark:border-red-500/20">
              <i className="fa-solid fa-lock"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">تأكيد إغلاق الدين 100%؟</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                سيتم اعتبار دين <strong className="text-slate-800 dark:text-white">{closeModalDebt.name}</strong> مُسدّداً بالكامل وتغيير حالته إلى <span className="text-emerald-600 dark:text-emerald-400 font-bold">مغلق</span>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={submitCloseDebt}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <i className="fa-solid fa-check"></i> نعم، إغلاق نهائي
              </button>
              <button
                onClick={() => setCloseModalDebt(null)}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i> إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
