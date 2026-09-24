import React, { useState, useMemo } from "react";
import { Order, UserSession } from "../types";
import { soundFx } from "../services/soundEffects";
import { printService } from "../services/printHelper";
import { motion } from "motion/react";
import { ShareModal } from "./ShareModal";
import {
  generateOrderShareText,
  isTodayOrder,
  isOrderBelongsToUser,
} from "../services/shareHelper";

interface OrdersListProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, nextStatus: string) => void;
  onTriggerReturn: (orderId: string) => void;
  onOpenPrintModal: (order: Order) => void;
  currentUser?: UserSession | null;
  shopName?: string;
}

function generateOrdersReportText(
  filteredOrders: Order[],
  shopName: string,
  userTitle?: string
): string {
  const now = new Date().toLocaleDateString("ar-LY");
  let totalSales = 0;
  let totalProfit = 0;
  let validCount = 0;
  let returnCount = 0;

  filteredOrders.forEach((o) => {
    const isRet = o.status === "مرتجع" || o.status === "راجع";
    if (isRet) {
      returnCount++;
    } else {
      totalSales += Number(o.total || 0);
      totalProfit += Number(o.profit || 0);
      validCount++;
    }
  });

  let text = `📊 *تقرير كشف فواتير المبيعات*\n`;
  text += `🏪 *المتجر:* ${shopName}\n`;
  if (userTitle) {
    text += `👤 *المشرف / البائع:* ${userTitle}\n`;
  }
  text += `📅 *التاريخ:* ${now}\n`;
  text += `───────────────────\n`;
  text += `🧾 *إجمالي عدد الفواتير:* ${filteredOrders.length} (${validCount} ناجحة • ${returnCount} مرتجعة)\n`;
  text += `💰 *إجمالي المبيعات:* ${totalSales.toFixed(2)} د.ل\n`;
  text += `📈 *صافي الأرباح:* ${totalProfit.toFixed(2)} د.ل\n`;
  text += `───────────────────\n`;
  text += `📋 *أبرز الفواتير:*\n`;

  filteredOrders.slice(0, 10).forEach((o, idx) => {
    const isRet = o.status === "مرتجع" || o.status === "راجع";
    text += `${idx + 1}. #${o.id} - ${o.cName || "زبون نقدي"} | ${o.total.toFixed(2)} د.ل ${isRet ? "(مرتجع)" : `[${o.status || "مكتملة"}]`}${o.cashierName ? ` (بواسطة: ${o.cashierName})` : ""}\n`;
  });

  if (filteredOrders.length > 10) {
    text += `... والمزيد (${filteredOrders.length - 10} فاتورة أخرى)\n`;
  }
  text += `───────────────────\n`;
  text += `✨ تم تصدير التقرير عبر منظومة RTG-SYSTEM`;
  return text;
}

// Helper to convert Arabic-Indic numerals (٠-٩) to Western (0-9)
function toStandardDigits(str: string): string {
  if (!str) return "";
  return str.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

// Robust timestamp parser for sorting newest-first across all locales and date formats
function parseOrderTimestamp(order: Order): number {
  if (!order) return 0;
  const rawDate = toStandardDigits(order.date || "").trim();

  if (rawDate) {
    // 1. Pattern: YYYY/MM/DD or YYYY-MM-DD (with optional HH:mm:ss)
    const matchYMD = rawDate.match(
      /(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/
    );
    if (matchYMD) {
      const y = parseInt(matchYMD[1], 10);
      const m = parseInt(matchYMD[2], 10) - 1;
      const day = parseInt(matchYMD[3], 10);
      const hh = matchYMD[4] ? parseInt(matchYMD[4], 10) : 0;
      const mm = matchYMD[5] ? parseInt(matchYMD[5], 10) : 0;
      const ss = matchYMD[6] ? parseInt(matchYMD[6], 10) : 0;
      return new Date(y, m, day, hh, mm, ss).getTime();
    }

    // 2. Pattern: DD/MM/YYYY or DD-MM-YYYY (with optional HH:mm:ss)
    const matchDMY = rawDate.match(
      /(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/
    );
    if (matchDMY) {
      const day = parseInt(matchDMY[1], 10);
      const m = parseInt(matchDMY[2], 10) - 1;
      const y = parseInt(matchDMY[3], 10);
      const hh = matchDMY[4] ? parseInt(matchDMY[4], 10) : 0;
      const mm = matchDMY[5] ? parseInt(matchDMY[5], 10) : 0;
      const ss = matchDMY[6] ? parseInt(matchDMY[6], 10) : 0;
      return new Date(y, m, day, hh, mm, ss).getTime();
    }

    // 3. Try standard Date constructor
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) {
      return d.getTime();
    }
  }

  // 4. Fallback to order numeric ID
  const idDigits = (order.id || "").replace(/\D/g, "");
  if (idDigits) {
    return parseInt(idDigits, 10);
  }

  return 0;
}

// Robust matcher for Date Picker (YYYY-MM-DD) against invoice date
function matchesDateFilter(orderDateRaw: string, filterStr: string): boolean {
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
  return normalized.includes(filterStr) || normalized.includes(dPart) || normalized.includes(dPartPadded);
}

export const OrdersList: React.FC<OrdersListProps> = ({
  orders,
  onUpdateStatus,
  onTriggerReturn,
  onOpenPrintModal,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Sort orders newest-first strictly across all states and categories
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const tA = parseOrderTimestamp(a);
      const tB = parseOrderTimestamp(b);
      if (tA !== tB) return tB - tA;

      return String(b.id || "").localeCompare(String(a.id || ""), undefined, { numeric: true });
    });
  }, [orders]);

  const filteredOrders = sortedOrders.filter((o) => {
    const q = search.toLowerCase().trim();
    if (
      q &&
      !o.id.toLowerCase().includes(q) &&
      !o.cName.toLowerCase().includes(q) &&
      !String(o.cPhone).includes(q)
    ) {
      return false;
    }
    const isReturned = o.status === "مرتجع" || o.status === "راجع";
    if (statusFilter) {
      if (statusFilter === "مرتجع" || statusFilter === "راجع") {
        if (!isReturned) return false;
      } else if (o.status !== statusFilter) {
        return false;
      }
    }
    if (methodFilter && o.method !== methodFilter && !o.method.includes(methodFilter)) return false;
    if (dateFilter) {
      if (!matchesDateFilter(o.date, dateFilter)) return false;
    }
    return true;
  });

  const exportCSV = () => {
    soundFx.playSuccess();
    if (filteredOrders.length === 0) return;
    const headers = [
      "رقم الفاتورة",
      "التاريخ",
      "الزبون",
      "الهاتف",
      "المنطقة",
      "طريقة الدفع",
      "المبلغ الإجمالي",
      "صافي الربح",
      "الحالة",
    ];
    const rows = filteredOrders.map((o) => [
      o.id,
      `"${o.date}"`,
      `"${o.cName}"`,
      `"${o.cPhone || ""}"`,
      `"${o.cArea || ""}"`,
      `"${o.method}"`,
      o.total,
      o.profit,
      `"${o.status}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    soundFx.playSuccess();
    if (filteredOrders.length === 0) return;

    const todayDate = new Date().toLocaleDateString("ar-LY", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    let totalAmount = 0;
    let totalProfits = 0;
    let returnsCount = 0;

    const rowsHtml = filteredOrders
      .map((o) => {
        const isRet =
          o.status === "مرتجع" ||
          o.status === "راجع" ||
          (o.status || "").includes("رجع") ||
          (Number(o.profit) === 0 && Boolean(o.returnNote));
        const profitVal = isRet ? 0 : Number(o.profit) || 0;
        const totalVal = Number(o.total) || 0;
        if (isRet) {
          returnsCount++;
        } else {
          totalAmount += totalVal;
          totalProfits += profitVal;
        }

        return `
          <tr style="border-bottom: 1px solid #e2e8f0; ${isRet ? 'background: #fff1f2;' : ''}">
            <td style="padding: 7px 10px; font-family: monospace; font-weight: bold; color: #a6632f;">${o.id}</td>
            <td style="padding: 7px 10px; font-size: 11px;">${o.date}</td>
            <td style="padding: 7px 10px; font-weight: bold;">${o.cName || "زبون نقدي"}</td>
            <td style="padding: 7px 10px; font-family: monospace;">${o.cPhone || "-"}</td>
            <td style="padding: 7px 10px;">${o.method}</td>
            <td style="padding: 7px 10px; text-align: left; font-family: monospace; font-weight: bold;">${totalVal.toFixed(2)} د.ل</td>
            <td style="padding: 7px 10px; text-align: left; font-family: monospace; color: ${isRet ? '#dc2626' : '#16a34a'}; font-weight: bold;">
              ${profitVal.toFixed(2)} د.ل
            </td>
            <td style="padding: 7px 10px; text-align: center;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; background: ${isRet ? '#fee2e2; color: #991b1b;' : '#dcfce7; color: #166534;'}">
                ${isRet ? 'مرتجع للمخزن (ربح: 0 د.ل)' : o.status || 'مكتملة'}
              </span>
            </td>
          </tr>
        `;
      })
      .join("");

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>كشف فواتير المبيعات - RTG-SYSTEM</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;900&family=Tajawal:wght@400;500;700;800&display=swap">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', 'Tajawal', sans-serif; }
          body { background: #fff; color: #0f172a; padding: 20px; font-size: 12px; }
          @page { size: A4 landscape; margin: 10mm; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
          .summary { display: flex; gap: 12px; margin-bottom: 16px; }
          .stat { border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; background: #f8fafc; text-align: right; flex: 1; }
          .stat-title { font-size: 10px; color: #64748b; font-weight: bold; }
          .stat-val { font-size: 16px; font-weight: 900; font-family: monospace; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; text-align: right; }
          th { background: #f1f5f9; padding: 8px 10px; border-bottom: 2px solid #cbd5e1; font-weight: 900; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h2 style="font-size: 18px; font-weight: 900;">RTG-SYSTEM — كشف فواتير المبيعات</h2>
            <p style="color: #a6632f; font-weight: bold; font-size: 11px;">منظومة إدارة المبيعات والمخازن</p>
          </div>
          <div style="text-align: left; font-size: 11px; color: #64748b;">
            تاريخ الطباعة: ${todayDate}<br>
            عدد الفواتير المعروضة: ${filteredOrders.length}
          </div>
        </div>

        <div class="summary">
          <div class="stat">
            <div class="stat-title">إجمالي المبيعات المؤكدة</div>
            <div class="stat-val">${totalAmount.toFixed(2)} د.ل</div>
          </div>
          <div class="stat" style="background: #ecfdf5; border-color: #a7f3d0;">
            <div class="stat-title" style="color: #065f46;">صافي الأرباح الحقيقي</div>
            <div class="stat-val" style="color: #047857;">${totalProfits.toFixed(2)} د.ل</div>
          </div>
          <div class="stat">
            <div class="stat-title">عدد الفواتير</div>
            <div class="stat-val">${filteredOrders.length}</div>
          </div>
          <div class="stat" style="background: #fff1f2; border-color: #fecdd3;">
            <div class="stat-title" style="color: #9f1239;">الفواتير المرتجعة</div>
            <div class="stat-val" style="color: #be123c;">${returnsCount} (أرباحها: 0 د.ل)</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>رقم الفاتورة</th>
              <th>التاريخ</th>
              <th>الزبون</th>
              <th>الهاتف</th>
              <th>طريقة الدفع</th>
              <th style="text-align: left;">المبلغ الإجمالي</th>
              <th style="text-align: left;">صافي الربح</th>
              <th style="text-align: center;">الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `;

    printService.showDocument({
      title: "كشف فواتير المبيعات - RTG-SYSTEM",
      html,
    });
  };

  const handleReturnClick = (orderId: string) => {
    soundFx.playWarning();
    onTriggerReturn(orderId);
  };

  const handlePrintClick = (order: Order) => {
    soundFx.playPrint();
    onOpenPrintModal(order);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <i className="fa-solid fa-magnifying-glass text-slate-400 absolute right-3.5 top-3 text-xs"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم الفاتورة (#INV-...)، اسم الزبون، أو رقم الهاتف..."
              className="w-full pr-9 pl-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-[#c5834e] transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={exportPDF}
              className="w-full sm:w-auto px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#c5834e] to-[#a6632f] hover:from-[#b5733e] hover:to-[#96531f] rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-md shadow-[#c5834e]/20"
            >
              <i className="fa-solid fa-file-pdf text-xs"></i> تقرير الفواتير (PDF)
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={exportCSV}
              className="w-full sm:w-auto px-3 py-2 text-xs font-bold text-[#c5834e] dark:text-[#e0a36e] bg-[#c5834e]/10 border border-[#c5834e]/30 hover:bg-[#c5834e]/20 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <i className="fa-solid fa-file-excel text-xs"></i> تصدير (CSV)
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              soundFx.playClick();
              setStatusFilter(e.target.value);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl outline-none focus:border-[#c5834e]"
          >
            <option value="">جميع الحالات</option>
            <option value="في الانتظار">في الانتظار</option>
            <option value="في الطريق">في الطريق</option>
            <option value="تم التوصيل">تم التوصيل</option>
            <option value="مرتجع">مرتجع (مسترجع بالمخزن)</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => {
              soundFx.playClick();
              setMethodFilter(e.target.value);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl outline-none focus:border-[#c5834e]"
          >
            <option value="">جميع طرق الدفع</option>
            <option value="كاش">كاش</option>
            <option value="سداد">خدمات سداد</option>
            <option value="تداول">خدمات تداول</option>
            <option value="بطاقة">بطاقة مصرفية</option>
            <option value="حوالة">حوالة مصرفية</option>
          </select>

          <div className="relative flex items-center">
            <input
              type="date"
              value={dateFilter}
              title="فلترة الفواتير بالتاريخ (يوم/شهر/سنة)"
              onChange={(e) => {
                soundFx.playClick();
                setDateFilter(e.target.value);
              }}
              className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl outline-none focus:border-[#c5834e] cursor-pointer"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setDateFilter("");
                }}
                title="مسح فلتر التاريخ وإظهار الكل"
                className="mr-1.5 px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[10px] font-bold rounded-lg border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1"
              >
                <i className="fa-solid fa-xmark"></i> مسح
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            <i className="fa-solid fa-receipt text-4xl mb-3 block opacity-30"></i>
            لا توجد فواتير مطابقة لمعايير البحث الحالية
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3">رقم الفاتورة</th>
                    <th className="px-5 py-3">الزبون</th>
                    <th className="px-5 py-3">السلع والتفاصيل</th>
                    <th className="px-5 py-3">الدفع</th>
                    <th className="px-5 py-3">المبلغ الإجمالي</th>
                    <th className="px-5 py-3">التوقيت</th>
                    <th className="px-5 py-3">الحالة</th>
                    <th className="px-5 py-3 text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredOrders.map((o) => {
                    const isReturned = o.status === "مرتجع" || o.status === "راجع";

                    let statusBadge = (
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                        {o.status}
                      </span>
                    );

                    if (isReturned) {
                      statusBadge = (
                        <span className="px-2.5 py-1 bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 rounded-full text-[10px] font-bold border border-rose-200 dark:border-rose-500/30 flex items-center gap-1 w-fit">
                          <i className="fa-solid fa-rotate-left text-[9px]"></i> مرتجع
                        </span>
                      );
                    } else if (o.status === "تم التوصيل") {
                      statusBadge = (
                        <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-bold border border-emerald-200 dark:border-emerald-500/20">
                          تم التوصيل
                        </span>
                      );
                    } else if (o.status === "في الطريق") {
                      statusBadge = (
                        <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-bold border border-amber-200 dark:border-amber-500/20">
                          في الطريق
                        </span>
                      );
                    }

                    return (
                      <tr
                        key={o.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                          isReturned ? "bg-rose-500/5" : ""
                        }`}
                      >
                        <td className="px-5 py-3.5 font-mono font-bold text-[#c5834e]">
                          #{o.id}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{o.cName}</div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            {o.cPhone && <span>{o.cPhone}</span>}
                            {o.cArea && <span className="text-slate-500">• {o.cArea}</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 max-w-[220px]">
                          <div className="truncate text-slate-600 dark:text-slate-400 text-[11px]" title={o.desc}>
                            {o.desc}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700">
                            {o.method}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                          <span className={isReturned ? "line-through text-slate-400" : ""}>
                            {o.total.toFixed(2)} د.ل
                          </span>
                          {!isReturned && (
                            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                              + {o.profit.toFixed(2)} ربح
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-[11px]">
                          {o.date}
                        </td>
                        <td className="px-5 py-3.5">{statusBadge}</td>
                        <td className="px-5 py-3.5 text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isReturned ? (
                              <>
                                <select
                                  value={o.status}
                                  onChange={(e) => onUpdateStatus(o.id, e.target.value)}
                                  className="text-[11px] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-[#c5834e]"
                                >
                                  <option value="في الانتظار">في الانتظار</option>
                                  <option value="في الطريق">في الطريق</option>
                                  <option value="تم التوصيل">تم التوصيل</option>
                                </select>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleReturnClick(o.id)}
                                  className="text-[11px] bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1"
                                  title="إرجاع الفاتورة واستعادة السلع"
                                >
                                  <i className="fa-solid fa-rotate-left text-[10px]"></i> إرجاع
                                </motion.button>
                              </>
                            ) : (
                              <span className="text-[10px] text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-lg font-bold flex items-center gap-1">
                                <i className="fa-solid fa-check"></i> مسترجع بالمخزن
                              </span>
                            )}
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handlePrintClick(o)}
                              className="text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1"
                              title="طباعة الفاتورة"
                            >
                              <i className="fa-solid fa-print"></i>
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800 p-3 space-y-3">
              {filteredOrders.map((o) => {
                const isReturned = o.status === "مرتجع" || o.status === "راجع";
                return (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`pt-3 first:pt-0 space-y-2 text-right p-3 rounded-xl ${
                      isReturned ? "bg-rose-500/5 border border-rose-500/20" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-[#c5834e] dark:text-[#e0a36e]">
                          #{o.id}
                        </span>
                        {o.deliveryType && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                            {o.deliveryType === "فوري" ? "⚡ فوري" : o.deliveryType === "توصيل" ? "🚚 توصيل" : "⏳ مؤجل"}
                          </span>
                        )}
                      </div>

                      {/* Interactive Status Changer on Mobile */}
                      {!isReturned ? (
                        <div className="flex items-center gap-1">
                          <select
                            value={o.status}
                            onChange={(e) => {
                              soundFx.playClick();
                              onUpdateStatus(o.id, e.target.value);
                            }}
                            className={`text-[11px] font-bold rounded-lg px-2.5 py-1 outline-none border transition-all cursor-pointer ${
                              o.status === "تم التوصيل"
                                ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30"
                                : o.status === "في الطريق"
                                ? "bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30"
                                : "bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-500/30"
                            }`}
                          >
                            <option value="في الانتظار">⏳ في الانتظار</option>
                            <option value="في الطريق">🚚 في الطريق</option>
                            <option value="تم التوصيل">✓ تم التوصيل</option>
                          </select>
                        </div>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30 flex items-center gap-1">
                          <i className="fa-solid fa-rotate-left text-[9px]"></i> مرتجع للمخزن
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-start text-xs">
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{o.cName}</p>
                        <p className="text-[11px] text-slate-500">
                          {o.cPhone} {o.cArea && `• ${o.cArea}`}
                        </p>
                      </div>
                      <div className="text-left font-mono">
                        <span
                          className={`font-bold block ${
                            isReturned ? "line-through text-slate-400" : "text-slate-900 dark:text-white"
                          }`}
                        >
                          {o.total.toFixed(2)} د.ل
                        </span>
                        <span className="text-[10px] text-slate-400">{o.method}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-lg text-[11px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                      {o.desc}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400">{o.date}</span>
                      <div className="flex items-center gap-1.5">
                        {!isReturned ? (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleReturnClick(o.id)}
                            className="text-[10px] bg-red-50 dark:bg-red-500/10 text-red-600 border border-red-200 dark:border-red-500/20 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1"
                          >
                            <i className="fa-solid fa-rotate-left"></i> إرجاع
                          </motion.button>
                        ) : (
                          <span className="text-[10px] text-rose-500 font-bold bg-rose-500/10 px-2 py-0.5 rounded">
                            مسترجع بالمخزن
                          </span>
                        )}
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handlePrintClick(o)}
                          className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1"
                        >
                          <i className="fa-solid fa-print"></i> طباعة
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
