import React, { useState } from "react";
import { Debt } from "../types";
import { soundFx } from "../services/soundEffects";

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
  shopName?: string;
}

export const DebtsTracker: React.FC<DebtsTrackerProps> = ({
  debts,
  onAddOrUpdateDebt,
  onRecordPayment,
  onCloseDebt,
  showToast,
  shopName = "RTG-SESTEM",
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

  // Export Comprehensive Debts Statement (PDF)
  const handleExportDebtsPDF = () => {
    soundFx.playSuccess();
    const printWin = window.open("", "_blank", "width=920,height=900");
    if (!printWin) {
      window.print();
      return;
    }

    const todayDate = new Date().toLocaleDateString("ar-LY", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const netBalance = owedToMe - iOwe;

    const rowsHtml = filteredDebts
      .map((d, idx) => {
        const totalAmt = Number(d.amount) || 0;
        const paidAmt = Number(d.paid) || 0;
        const remAmt = Number(d.remaining) || 0;
        const isOwedToMe = d.type === "لي";

        let statusText = d.status || "مفتوح";
        let statusBg = "#fef2f2";
        let statusColor = "#991b1b";
        if (d.status === "مغلق") {
          statusBg = "#ecfdf5";
          statusColor = "#065f46";
        } else if (d.status === "مدفوع جزئياً") {
          statusBg = "#fffbeb";
          statusColor = "#92400e";
        }

        return `
          <tr>
            <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: center;">${idx + 1}</td>
            <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold; text-align: center;">${d.id}</td>
            <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-weight: bold;">${d.name}</td>
            <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; direction: ltr;">${d.phone || "—"}</td>
            <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: center;">
              <span style="background: ${isOwedToMe ? "#eff6ff" : "#fef2f2"}; color: ${isOwedToMe ? "#1d4ed8" : "#b91c1c"}; padding: 2px 8px; border-radius: 6px; font-weight: bold; font-size: 10px;">
                ${isOwedToMe ? "لي (مستحق)" : "علي (مطلوب)"}
              </span>
            </td>
            <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace;">${totalAmt.toFixed(2)} د.ل</td>
            <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; color: #047857;">${paidAmt.toFixed(2)} د.ل</td>
            <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: center; font-family: monospace; font-weight: bold; color: ${isOwedToMe ? "#1d4ed8" : "#b91c1c"};">
              ${remAmt.toFixed(2)} د.ل
            </td>
            <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: center;">
              <span style="background: ${statusBg}; color: ${statusColor}; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold;">${statusText}</span>
            </td>
            <td style="padding: 7px 10px; border: 1px solid #cbd5e1; text-align: center; font-size: 10px;">${d.dueDate || "—"}</td>
            <td style="padding: 7px 10px; border: 1px solid #cbd5e1; font-size: 10px; color: #475569;">${d.note || "—"}</td>
          </tr>
        `;
      })
      .join("");

    printWin.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>كشف سجل الديون والمعاملات - ${shopName}</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@500;700;900&family=Tajawal:wght@400;600;700;800&display=swap">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', 'Tajawal', sans-serif; }
          body { background: #fff; color: #0f172a; padding: 20px; line-height: 1.4; font-size: 12px; }
          @page { size: A4 landscape; margin: 10mm; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 20px; font-weight: 900; color: #0f172a; }
          .subtitle { font-size: 13px; color: #a6632f; font-weight: bold; margin-top: 3px; }
          .date { font-size: 11px; color: #64748b; margin-top: 4px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
          .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; text-align: right; background: #f8fafc; }
          .card-title { font-size: 10px; color: #64748b; font-weight: bold; margin-bottom: 3px; }
          .card-value { font-size: 17px; font-weight: 900; font-family: monospace; color: #0f172a; }
          .card-sub { font-size: 10px; margin-top: 3px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
          th { background: #f1f5f9; color: #0f172a; padding: 7px 10px; border: 1px solid #cbd5e1; text-align: center; font-weight: 900; }
          .footer { margin-top: 24px; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 10px; font-size: 11px; color: #64748b; }
          .btn-print { background: #a6632f; color: #fff; padding: 8px 16px; border: none; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; margin-bottom: 12px; }
          @media print {
            .btn-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div style="text-align: left;">
          <button class="btn-print" onclick="window.print()">طباعة / حفظ بتنسيق PDF</button>
        </div>
        <div class="header">
          <div class="title">${shopName} — كشف سجل الديون والمعاملات المالية</div>
          <div class="subtitle">تقرير شامل بمستحقات العملاء والتزامات الموردين والأرصدة المتبقية</div>
          <div class="date">تاريخ ووقت التقرير: ${todayDate}</div>
        </div>

        <div class="grid">
          <div class="card" style="background: #eff6ff; border-color: #bfdbfe;">
            <div class="card-title" style="color: #1e40af;">إجمالي ديون لك (مستحقات عند العملاء)</div>
            <div class="card-value" style="color: #1d4ed8;">${owedToMe.toFixed(2)} د.ل</div>
            <div class="card-sub" style="color: #1e40af;">أموال واجبة التحصيل</div>
          </div>
          <div class="card" style="background: #fef2f2; border-color: #fecaca;">
            <div class="card-title" style="color: #991b1b;">إجمالي ديون عليك (التزامات للموردين)</div>
            <div class="card-value" style="color: #b91c1c;">${iOwe.toFixed(2)} د.ل</div>
            <div class="card-sub" style="color: #991b1b;">التزامات واجبة السداد</div>
          </div>
          <div class="card" style="background: ${netBalance >= 0 ? "#ecfdf5" : "#fff1f2"}; border-color: ${netBalance >= 0 ? "#a7f3d0" : "#fecdd3"};">
            <div class="card-title" style="color: ${netBalance >= 0 ? "#065f46" : "#9f1239"};">صافي المركز المالي (لك - عليك)</div>
            <div class="card-value" style="color: ${netBalance >= 0 ? "#047857" : "#be123c"};">${netBalance >= 0 ? "+" : ""}${netBalance.toFixed(2)} د.ل</div>
            <div class="card-sub" style="color: ${netBalance >= 0 ? "#065f46" : "#9f1239"};">${netBalance >= 0 ? "فائض مستحق لصالحك" : "عجز مستحق عليك"}</div>
          </div>
          <div class="card">
            <div class="card-title">إجمالي السجلات المعروضة</div>
            <div class="card-value">${filteredDebts.length} حساب</div>
            <div class="card-sub" style="color: #64748b;">${openCount} مفتوح • ${lateCount} متأخر</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px;">#</th>
              <th>رقم الدين</th>
              <th style="text-align: right;">الاسم / الطرف</th>
              <th>الهاتف</th>
              <th>نوع المعاملة</th>
              <th>القيمة الأصلية</th>
              <th>المدفوع</th>
              <th>المتبقي</th>
              <th>الحالة</th>
              <th>تاريخ الاستحقاق</th>
              <th>ملاحظات</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          تم استخراج هذا الكشف تلقائياً عبر منظومة ${shopName} • ${todayDate}
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
    showToast("✓ تم فتح كشف سجل الديون والمعاملات بتنسيق PDF بنجاح", "success");
  };

  // Print Single Debt Voucher / Statement
  const handlePrintSingleDebt = (debt: Debt) => {
    soundFx.playCashRegister();
    const printWin = window.open("", "_blank", "width=520,height=700");
    if (!printWin) {
      window.print();
      return;
    }

    const todayDate = new Date().toLocaleDateString("ar-LY", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const totalAmt = Number(debt.original) || 0;
    const paidAmt = Number(debt.paid) || 0;
    const remAmt = Number(debt.remaining) || 0;
    const isOwedToMe = debt.type === "لي";

    printWin.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>وصل سند دين - ${debt.name}</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;900&family=Tajawal:wght@500;700;900&display=swap">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', 'Tajawal', sans-serif; }
          body { background: #fff; color: #000; padding: 15px; font-size: 13px; line-height: 1.5; }
          @page { size: auto; margin: 5mm; }
          .receipt-box { border: 2px solid #000; border-radius: 8px; padding: 15px; max-width: 450px; margin: 0 auto; }
          .top-title { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 12px; }
          .shop { font-size: 16px; font-weight: 900; }
          .type-label { font-size: 12px; color: #475569; font-weight: bold; margin-top: 2px; }
          .row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dotted #ccc; }
          .label { color: #475569; font-size: 12px; }
          .val { font-weight: bold; }
          .amount-box { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; margin: 12px 0; text-align: center; }
          .rem-title { font-size: 11px; color: #475569; font-weight: bold; }
          .rem-val { font-size: 20px; font-weight: 900; font-family: monospace; color: #000; }
          .signatures { display: flex; justify-content: space-between; margin-top: 25px; padding-top: 10px; border-top: 1px solid #000; }
          .sig-box { text-align: center; width: 45%; font-size: 11px; font-weight: bold; }
          .sig-line { border-bottom: 1px dotted #000; height: 35px; margin-bottom: 4px; }
          .btn-bar { text-align: center; margin-bottom: 15px; }
          .btn { background: #c57b42; color: #fff; border: none; padding: 8px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; }
          @media print {
            .btn-bar { display: none !important; }
            body { padding: 0 !important; }
            .receipt-box { border: 1px solid #000 !important; }
          }
        </style>
      </head>
      <body>
        <div class="btn-bar">
          <button class="btn" onclick="window.print()">🖨️ طباعة سند الدين</button>
        </div>
        <div class="receipt-box">
          <div class="top-title">
            <div class="shop">${shopName}</div>
            <div class="type-label">سند قيد دين / مطالبة مالية (${isOwedToMe ? "مستحق على عميل" : "التزام لمورد"})</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">رقم القيد: ${debt.id}</div>
          </div>

          <div class="row">
            <span class="label">اسم الطرف المعني:</span>
            <span class="val">${debt.name}</span>
          </div>
          <div class="row">
            <span class="label">رقم الهاتف:</span>
            <span class="val" style="direction: ltr; font-family: monospace;">${debt.phone || "غير مسجل"}</span>
          </div>
          <div class="row">
            <span class="label">تاريخ التسجيل:</span>
            <span class="val">${debt.date || todayDate}</span>
          </div>
          <div class="row">
            <span class="label">تاريخ الاستحقاق:</span>
            <span class="val">${debt.dueDate || "غير محدد"}</span>
          </div>
          <div class="row">
            <span class="label">إجمالي قيمة الدين:</span>
            <span class="val" style="font-family: monospace;">${totalAmt.toFixed(2)} د.ل</span>
          </div>
          <div class="row">
            <span class="label">المبلغ المسدد حتى الآن:</span>
            <span class="val" style="font-family: monospace; color: #047857;">${paidAmt.toFixed(2)} د.ل</span>
          </div>

          <div class="amount-box">
            <div class="rem-title">المبلغ المتبقي الواجب سداده</div>
            <div class="rem-val">${remAmt.toFixed(2)} د.ل</div>
            <div style="font-size: 10px; font-weight: bold; color: ${debt.status === "مغلق" ? "#047857" : "#b91c1c"}; margin-top: 3px;">
              الحالة: ${debt.status}
            </div>
          </div>

          ${debt.note ? `
          <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 4px; padding: 6px; font-size: 11px; margin-bottom: 10px;">
            <strong>ملاحظات:</strong> ${debt.note}
          </div>
          ` : ""}

          <div class="signatures">
            <div class="sig-box">
              <div class="sig-line"></div>
              <span>توقيع المستلم / العميل</span>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <span>ختم وتوقيع الإدارة (${shopName})</span>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    printWin.document.close();
    showToast(`✓ تم فتح سند الدين الخاص بـ "${debt.name}" بنجاح`, "success");
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
            <div className="w-8 h-8 rounded-lg bg-[#c5834e]/10 text-[#c5834e] dark:text-[#e0a36e] flex items-center justify-center text-xs">
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
            <i className="fa-solid fa-plus text-[#c5834e]"></i> إضافة أو تسجيل دين جديد
          </h4>

          <form onSubmit={handleSaveDebt} className="space-y-2.5">
            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1">نوع الدين</label>
              <select
                value={debtType}
                onChange={(e) => setDebtType(e.target.value as "لي" | "علي")}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none focus:border-[#c5834e]"
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
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none focus:border-[#c5834e]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1">رقم الهاتف</label>
              <input
                type="tel"
                value={debtPhone}
                onChange={(e) => setDebtPhone(e.target.value)}
                placeholder="091XXXXXXX"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none focus:border-[#c5834e]"
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
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none focus:border-[#c5834e] font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1">تاريخ الاستحقاق (اختياري)</label>
              <input
                type="date"
                value={debtDueDate}
                onChange={(e) => setDebtDueDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none focus:border-[#c5834e]"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-bold mb-1">ملاحظات / تفاصيل</label>
              <textarea
                value={debtNote}
                onChange={(e) => setDebtNote(e.target.value)}
                placeholder="تفاصيل المشتريات أو ملاحظة..."
                rows={2}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none focus:border-[#c5834e] resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full btn-brand-bronze font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 mt-1"
            >
              <i className="fa-solid fa-floppy-disk"></i> حفظ الدين في السجل
            </button>
          </form>
        </div>

        {/* Debts Filter & List */}
        <div className="lg:col-span-8 space-y-3">
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-right">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#c5834e]"></span>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                  سجل ومعاملات الديون ({filteredDebts.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={handleExportDebtsPDF}
                className="px-3 py-1.5 text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-[#c5834e] dark:text-[#d88b4f] border border-[#c5834e]/30 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm"
                title="تصدير كشف شامل لسجل الديون والمعاملات بتنسيق PDF رسمي"
              >
                <i className="fa-solid fa-file-pdf text-red-500"></i>
                <span>تصدير كشف الديون (PDF)</span>
              </button>
            </div>

            <div className="relative">
              <i className="fa-solid fa-magnifying-glass text-slate-400 absolute right-3.5 top-3 text-xs"></i>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم أو الهاتف أو رقم الدين..."
                className="w-full pr-9 pl-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none focus:border-[#c5834e]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg outline-none focus:border-[#c5834e]"
              >
                <option value="">كل الأنواع (لي وعلي)</option>
                <option value="لي">لي (عند الزبائن)</option>
                <option value="علي">علي (للموردين)</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg outline-none focus:border-[#c5834e]"
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
                      <button
                        type="button"
                        onClick={() => handlePrintSingleDebt(d)}
                        className="text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        title="طباعة سند قيد / وصل مالي لهذا الحساب"
                      >
                        <i className="fa-solid fa-print text-[#c5834e]"></i> طباعة سند
                      </button>

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
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg outline-none focus:border-[#c5834e] text-center font-bold transition-all"
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
