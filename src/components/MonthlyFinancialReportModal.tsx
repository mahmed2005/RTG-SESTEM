import React, { useState, useMemo } from "react";
import { Order } from "../types";
import { soundFx } from "../services/soundEffects";
import { printService } from "../services/printHelper";
import { motion, AnimatePresence } from "motion/react";

// Helper to convert Arabic-Indic numerals (٠-٩) to Western (0-9)
function toStandardDigits(str: string): string {
  if (!str) return "";
  return str.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

interface MonthlyFinancialReportModalProps {
  orders: Order[];
  shopName?: string;
  onClose: () => void;
  onRefreshOrders?: () => void;
}

export const MonthlyFinancialReportModal: React.FC<MonthlyFinancialReportModalProps> = ({
  orders,
  shopName = "RTG-GEARX",
  onClose,
  onRefreshOrders,
}) => {
  // Current month string format: YYYY-MM
  const now = new Date();
  const currentMonthDefault = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Find all available months in orders, ensuring current month is always available and sorted
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    monthsSet.add(currentMonthDefault);

    orders.forEach((o) => {
      if (o.date) {
        const normalized = toStandardDigits(o.date);
        // Try extracting YYYY-MM or parse Date
        const match = normalized.match(/(\d{4})[/-](\d{1,2})/);
        if (match) {
          const y = match[1];
          const m = match[2].padStart(2, "0");
          monthsSet.add(`${y}-${m}`);
        } else {
          const d = new Date(normalized);
          if (!isNaN(d.getTime())) {
            monthsSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
          }
        }
      }
    });

    return Array.from(monthsSet).sort().reverse();
  }, [orders, currentMonthDefault]);

  // Selected month ALWAYS defaults strictly to the current active month
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthDefault);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Month label formatter with Arabic names
  const formatMonthLabel = (mStr: string) => {
    const [y, m] = mStr.split("-");
    const monthNum = parseInt(m, 10);
    const arabicMonths = [
      "يناير (شهر 1)",
      "فبراير (شهر 2)",
      "مارس (شهر 3)",
      "أبريل (شهر 4)",
      "مايو (شهر 5)",
      "يونيو (شهر 6)",
      "يوليو (شهر 7)",
      "أغسطس (شهر 8)",
      "سبتمبر (شهر 9)",
      "أكتوبر (شهر 10)",
      "نوفمبر (شهر 11)",
      "ديسمبر (شهر 12)",
    ];
    const name = arabicMonths[monthNum - 1] || `شهر ${m}`;
    const isCurrent = mStr === currentMonthDefault;
    return `${y} — ${name}${isCurrent ? " ⚡ (الشهر الحالي)" : ""}`;
  };

  const handleQuickRefresh = () => {
    soundFx.playClick();
    setIsRefreshing(true);
    if (onRefreshOrders) {
      onRefreshOrders();
    }
    setTimeout(() => {
      setIsRefreshing(false);
      soundFx.playSuccess();
    }, 700);
  };

  // Capital at beginning of month (stored in localStorage per month)
  const capitalStorageKey = `rtg_capital_${selectedMonth}`;
  const [initialCapital, setInitialCapital] = useState<number>(() => {
    const saved = localStorage.getItem(capitalStorageKey);
    return saved ? Number(saved) : 13500;
  });

  const handleCapitalChange = (val: number) => {
    setInitialCapital(val);
    localStorage.setItem(capitalStorageKey, String(val));
  };

  // Helper to check returned order
  const isOrderReturned = (o: Order) => {
    if (!o) return false;
    const s = (o.status || "").trim();
    return (
      s === "مرتجع" ||
      s === "راجع" ||
      s === "مرتجع للمخزن" ||
      s.includes("رجع") ||
      s.includes("رتجع") ||
      (Number(o.profit) === 0 && Boolean(o.returnNote))
    );
  };

  // Filter orders for the selected month
  const [yearStr, monthStr] = selectedMonth.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const daysInMonth = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  const monthOrders = useMemo(() => {
    return orders.filter((o) => {
      if (!o.date) return false;
      const normalized = toStandardDigits(o.date).trim();
      // Match against year and month (YYYY/MM/DD or DD/MM/YYYY)
      const match = normalized.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
      if (match) {
        return parseInt(match[1], 10) === year && parseInt(match[2], 10) === month;
      }
      const matchDMY = normalized.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
      if (matchDMY) {
        return parseInt(matchDMY[3], 10) === year && parseInt(matchDMY[2], 10) === month;
      }
      const d = new Date(normalized);
      if (!isNaN(d.getTime())) {
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      }
      return (
        normalized.includes(`${year}/${monthStr}`) ||
        normalized.includes(`${year}-${monthStr}`)
      );
    });
  }, [orders, year, month, monthStr]);

  // Aggregate monthly statistics
  const monthlyMetrics = useMemo(() => {
    let totalCustomers = 0;
    let totalProductsQty = 0;
    let totalGrossSales = 0;
    let totalNetProfit = 0;
    let totalDeliveryFees = 0;
    let totalExpenses = 0;
    let returnedCount = 0;
    let returnedItemsQty = 0;
    let pendingCount = 0;
    let inTransitCount = 0;
    let deliveredCount = 0;

    const soldProductsMap: Record<string, { name: string; qty: number; sales: number; profit: number }> = {};
    const returnedProductsMap: Record<string, { name: string; qty: number }> = {};

    monthOrders.forEach((o) => {
      const isRet = isOrderReturned(o);
      const totalVal = Number(o.total) || 0;
      const profitVal = isRet ? 0 : Number(o.profit) || 0;
      const deliveryVal = Number(o.delivery) || 0;

      if (o.status === "في الانتظار") pendingCount++;
      else if (o.status === "في الطريق") inTransitCount++;
      else if (o.status === "تم التوصيل") deliveredCount++;

      // Parse items
      const itemsList =
        o.cartItems && o.cartItems.length > 0
          ? o.cartItems
          : o.desc.split(" ، ").map((part, idx) => {
              const match = part.match(/(\d+)\s*[xX×]\s*(?:\[([^\]]+)\])?\s*(.*)/);
              return {
                code: match ? match[2] || `ITEM-${idx}` : `ITEM-${idx}`,
                name: match ? match[3] || part : part,
                qty: match ? parseInt(match[1], 10) || 1 : 1,
                price: match ? totalVal : totalVal,
                cost: 0,
              };
            });

      if (isRet) {
        returnedCount++;
        itemsList.forEach((it) => {
          returnedItemsQty += it.qty;
          const key = it.name || it.code;
          if (!returnedProductsMap[key]) {
            returnedProductsMap[key] = { name: key, qty: 0 };
          }
          returnedProductsMap[key].qty += it.qty;
        });
      } else {
        totalCustomers++;
        totalGrossSales += totalVal;
        totalNetProfit += profitVal;
        totalDeliveryFees += deliveryVal;

        itemsList.forEach((it) => {
          totalProductsQty += it.qty;
          const key = it.name || it.code;
          if (!soldProductsMap[key]) {
            soldProductsMap[key] = { name: key, qty: 0, sales: 0, profit: 0 };
          }
          soldProductsMap[key].qty += it.qty;
          soldProductsMap[key].sales += it.price * it.qty;
          soldProductsMap[key].profit += (it.price - (it.cost || 0)) * it.qty;
        });
      }
    });

    // Net LY Total
    const netTotalLY = totalGrossSales;
    const profitMargin = totalGrossSales > 0 ? (totalNetProfit / totalGrossSales) * 100 : 0;

    return {
      totalCustomers,
      totalProductsQty,
      totalGrossSales,
      totalNetProfit,
      totalDeliveryFees,
      totalExpenses,
      netTotalLY,
      profitMargin,
      returnedCount,
      returnedItemsQty,
      pendingCount,
      inTransitCount,
      deliveredCount,
      soldProducts: Object.values(soldProductsMap).sort((a, b) => b.qty - a.qty),
      returnedProducts: Object.values(returnedProductsMap).sort((a, b) => b.qty - a.qty),
    };
  }, [monthOrders]);

  // Construct day-by-day table matching the Google Sheet exactly (Days 1 to daysInMonth)
  const dailyRows = useMemo(() => {
    const daysArr = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month - 1, d);
      const dayName = dayDate.toLocaleDateString("ar-LY", { weekday: "long" });
      const dateFormatted = `${year}/${monthStr}/${String(d).padStart(2, "0")}`;

      // Filter orders on this day
      const dayOrders = monthOrders.filter((o) => {
        if (!o.date) return false;
        const match = o.date.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
        if (match) {
          return (
            parseInt(match[1], 10) === year &&
            parseInt(match[2], 10) === month &&
            parseInt(match[3], 10) === d
          );
        }
        const dt = new Date(o.date);
        if (!isNaN(dt.getTime())) {
          return (
            dt.getFullYear() === year &&
            dt.getMonth() + 1 === month &&
            dt.getDate() === d
          );
        }
        return o.date.includes(`${year}/${monthStr}/${String(d).padStart(2, "0")}`);
      });

      const validOrders = dayOrders.filter((o) => !isOrderReturned(o));
      const hasSales = validOrders.length > 0;

      let customersCount = validOrders.length;
      let totalQty = 0;
      let totalValue = 0;
      let totalGain = 0;
      let deliveryTotal = 0;
      let expensesTotal = 0;
      const productNames: string[] = [];

      validOrders.forEach((o) => {
        totalValue += Number(o.total) || 0;
        totalGain += Number(o.profit) || 0;
        deliveryTotal += Number(o.delivery) || 0;

        const items =
          o.cartItems && o.cartItems.length > 0
            ? o.cartItems
            : o.desc.split(" ، ").map((part) => {
                const match = part.match(/(\d+)\s*[xX×]\s*(?:\[([^\]]+)\])?\s*(.*)/);
                return {
                  name: match ? match[3] || part : part,
                  qty: match ? parseInt(match[1], 10) || 1 : 1,
                };
              });

        items.forEach((it) => {
          totalQty += it.qty;
          if (!productNames.includes(it.name)) {
            productNames.push(it.name);
          }
        });
      });

      const netDailyLY = totalValue;

      daysArr.push({
        dayNumber: d,
        dayName,
        dateFormatted,
        hasSales,
        customersCount,
        productNames: productNames.join(" ، "),
        totalQty,
        totalValue,
        totalGain,
        deliveryTotal,
        expensesTotal,
        netDailyLY,
        otherIncome: 0,
        notes: hasSales ? "" : "-",
      });
    }

    return daysArr;
  }, [daysInMonth, year, month, monthStr, monthOrders]);

  // Generate printable HTML matching the Google Sheet design exactly
  const generatePrintableHtml = () => {
    const tableRowsHtml = dailyRows
      .map((r) => {
        const rowBg = r.hasSales ? "#ffffff" : "#fef2f2";
        const badgeColor = r.hasSales ? "#15803d" : "#b91c1c";
        const badgeBg = r.hasSales ? "#dcfce7" : "#fee2e2";

        return `
          <tr style="background: ${rowBg}; border-bottom: 1px solid #cbd5e1;">
            <td style="padding: 6px 8px; text-align: center; font-weight: bold;">${r.dayNumber}</td>
            <td style="padding: 6px 8px; text-align: center; font-size: 11px;">${r.dayName}</td>
            <td style="padding: 6px 8px; text-align: center; font-family: monospace; font-size: 11px;">${r.dateFormatted}</td>
            <td style="padding: 6px 8px; text-align: center;">
              <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: ${badgeBg}; color: ${badgeColor};">
                ${r.hasSales ? "نعم" : "لا"}
              </span>
            </td>
            <td style="padding: 6px 8px; text-align: center; font-weight: bold;">${r.customersCount || 0}</td>
            <td style="padding: 6px 8px; font-size: 11px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${r.productNames || "-"}</td>
            <td style="padding: 6px 8px; text-align: center; font-weight: bold;">${r.totalQty}</td>
            <td style="padding: 6px 8px; text-align: left; font-family: monospace; font-weight: bold;">${r.totalValue > 0 ? r.totalValue.toFixed(0) + " د.ل" : "0"}</td>
            <td style="padding: 6px 8px; text-align: left; font-family: monospace; font-weight: bold; color: #15803d;">${r.totalGain > 0 ? r.totalGain.toFixed(0) + " د.ل" : "0"}</td>
            <td style="padding: 6px 8px; text-align: left; font-family: monospace;">${r.deliveryTotal > 0 ? r.deliveryTotal.toFixed(0) + " د.ل" : "0"}</td>
            <td style="padding: 6px 8px; text-align: left; font-family: monospace; color: #b91c1c;">${r.expensesTotal > 0 ? r.expensesTotal.toFixed(0) + " د.ل" : "0"}</td>
            <td style="padding: 6px 8px; text-align: left; font-family: monospace; font-weight: bold;">${r.netDailyLY > 0 ? r.netDailyLY.toFixed(0) + " د.ل" : "0"}</td>
            <td style="padding: 6px 8px; text-align: center; font-size: 10px; color: #64748b;">${r.notes}</td>
          </tr>
        `;
      })
      .join("");

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>كشف الحساب الشهري - ${shopName} (${selectedMonth})</title>
        <style>
          @page { size: A4 landscape; margin: 8mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', 'Tajawal', sans-serif; }
          body { background: #fff; color: #0f172a; padding: 12px; font-size: 11px; }
          .header-box { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #334155; padding-bottom: 8px; margin-bottom: 12px; }
          .title { font-size: 20px; font-weight: 900; color: #0f172a; }
          .capital-card { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold; }
          .summary-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; margin-bottom: 12px; }
          .metric-cell { background: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 8px; border-radius: 4px; text-align: center; }
          .metric-title { font-size: 10px; color: #64748b; font-weight: bold; }
          .metric-val { font-size: 13px; font-weight: 900; color: #0f172a; font-family: monospace; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; text-align: right; font-size: 10.5px; }
          th { background: #334155; color: white; padding: 6px 8px; font-weight: bold; border: 1px solid #1e293b; text-align: center; }
          tfoot tr { background: #e2e8f0; font-weight: 900; border-top: 2px solid #0f172a; }
          tfoot td { padding: 8px 6px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div>
            <div class="title">${shopName} — التقرير المالي وحركة المبيعات الشهرية</div>
            <div style="font-size: 12px; color: #c5834e; font-weight: bold;">شهر: ${selectedMonth} | إجمالي الفواتير: ${monthlyMetrics.totalCustomers} فاتورة</div>
          </div>
          <div class="capital-card">
            رأس مال بداية الشهر: <span style="color: #0f172a; font-family: monospace;">${initialCapital.toLocaleString()} د.ل</span>
          </div>
        </div>

        <div class="summary-grid">
          <div class="metric-cell">
            <div class="metric-title">عدد الزبائن</div>
            <div class="metric-val">${monthlyMetrics.totalCustomers}</div>
          </div>
          <div class="metric-cell">
            <div class="metric-title">الكميات المباعة</div>
            <div class="metric-val">${monthlyMetrics.totalProductsQty} قطعة</div>
          </div>
          <div class="metric-cell">
            <div class="metric-title">إجمالي المبيعات</div>
            <div class="metric-val">${monthlyMetrics.totalGrossSales.toLocaleString()} د.ل</div>
          </div>
          <div class="metric-cell">
            <div class="metric-title">إجمالي المكسب</div>
            <div class="metric-val" style="color: #16a34a;">${monthlyMetrics.totalNetProfit.toLocaleString()} د.ل</div>
          </div>
          <div class="metric-cell">
            <div class="metric-title">رسوم التوصيل</div>
            <div class="metric-val">${monthlyMetrics.totalDeliveryFees.toLocaleString()} د.ل</div>
          </div>
          <div class="metric-cell">
            <div class="metric-title">نسبة المكسب</div>
            <div class="metric-val" style="color: #c5834e;">${monthlyMetrics.profitMargin.toFixed(2)}%</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px;">اليوم</th>
              <th style="width: 65px;">اليوم</th>
              <th style="width: 80px;">التاريخ</th>
              <th style="width: 65px;">هل بعت اليوم</th>
              <th style="width: 55px;">عدد الزبائن</th>
              <th>أسماء المنتجات</th>
              <th style="width: 65px;">إجمالي الكمية</th>
              <th style="width: 85px;">إجمالي القيمة</th>
              <th style="width: 85px;">إجمالي المكسب</th>
              <th style="width: 65px;">التوصيل</th>
              <th style="width: 65px;">المصروفات</th>
              <th style="width: 85px;">إجمالي LY</th>
              <th style="width: 60px;">ملاحظة</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4">الإجمالي الشهري</td>
              <td>${monthlyMetrics.totalCustomers}</td>
              <td>-</td>
              <td>${monthlyMetrics.totalProductsQty}</td>
              <td style="text-align: left; font-family: monospace;">${monthlyMetrics.totalGrossSales.toLocaleString()} د.ل</td>
              <td style="text-align: left; font-family: monospace; color: #15803d;">${monthlyMetrics.totalNetProfit.toLocaleString()} د.ل</td>
              <td style="text-align: left; font-family: monospace;">${monthlyMetrics.totalDeliveryFees.toLocaleString()} د.ل</td>
              <td style="text-align: left; font-family: monospace; color: #b91c1c;">${monthlyMetrics.totalExpenses} د.ل</td>
              <td style="text-align: left; font-family: monospace;">${monthlyMetrics.netTotalLY.toLocaleString()} د.ل</td>
              <td style="font-weight: bold; color: #c5834e;">${monthlyMetrics.profitMargin.toFixed(2)}%</td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    soundFx.playSuccess();
    const html = generatePrintableHtml();
    printService.showDocument({
      title: `الكشف الشهري - ${shopName} (${selectedMonth})`,
      html,
    });
  };

  const handleExportCSV = () => {
    soundFx.playSuccess();
    const headers = [
      "اليوم",
      "اليوم بالاسم",
      "التاريخ",
      "هل بعت اليوم",
      "عدد الزبائن",
      "أسماء المنتجات",
      "إجمالي الكمية للمنتجات",
      "إجمالي القيمة",
      "إجمالي المكسب",
      "التوصيل",
      "المصروفات",
      "إجمالي LY",
      "ملاحظة",
    ];

    const rows = dailyRows.map((r) => [
      r.dayNumber,
      `"${r.dayName}"`,
      `"${r.dateFormatted}"`,
      r.hasSales ? "نعم" : "لا",
      r.customersCount,
      `"${r.productNames.replace(/"/g, '""')}"`,
      r.totalQty,
      r.totalValue,
      r.totalGain,
      r.deliveryTotal,
      r.expensesTotal,
      r.netDailyLY,
      `"${r.notes}"`,
    ]);

    // Summary row
    rows.push([
      "الإجمالي",
      "",
      "",
      "",
      monthlyMetrics.totalCustomers,
      "",
      monthlyMetrics.totalProductsQty,
      monthlyMetrics.totalGrossSales,
      monthlyMetrics.totalNetProfit,
      monthlyMetrics.totalDeliveryFees,
      monthlyMetrics.totalExpenses,
      monthlyMetrics.netTotalLY,
      `"نسبة المكسب: ${monthlyMetrics.profitMargin.toFixed(2)}%"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `monthly_report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[70] flex items-center justify-center p-2 sm:p-4 animate-fadeInUp">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#2c323f] rounded-2xl sm:rounded-3xl w-full max-w-6xl h-[94vh] flex flex-col shadow-2xl overflow-hidden text-right"
          dir="rtl"
        >
          {/* Header Bar */}
          <div className="p-3 sm:p-5 border-b border-slate-200 dark:border-[#2c323f] bg-slate-50 dark:bg-[#181c22] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#c5834e]/15 border border-[#c5834e]/30 text-[#c5834e] flex items-center justify-center text-lg shadow-inner">
                <i className="fa-solid fa-chart-pie"></i>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-wide">
                    {shopName} — التقرير المالي الشهري الشامل
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#c5834e]/10 text-[#c5834e] border border-[#c5834e]/20 font-bold">
                    حركة الحسابات
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  ملخص دقيق ومفصل لكافة المبيعات، الأرباح، المنتجات، والتوصيل يوماً بيوم
                </p>
              </div>
            </div>

            {/* Controls: Month selector, Capital, Quick Refresh, Export Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Quick Refresh Button for Current Month Data */}
              <button
                type="button"
                onClick={handleQuickRefresh}
                disabled={isRefreshing}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                  isRefreshing
                    ? "bg-[#c5834e]/20 text-[#c5834e] border-[#c5834e]/40"
                    : "bg-slate-100 dark:bg-[#1c222c] hover:bg-[#c5834e]/10 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#2c323f]"
                }`}
                title="تحديث وإعادة احتساب مبيعات الشهر الحالي فوراً"
              >
                <i
                  className={`fa-solid fa-arrows-rotate text-[#c5834e] ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                ></i>
                <span className="hidden sm:inline">ريفريش سريع</span>
              </button>

              {/* Month Selector Dropdown */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#2c323f] rounded-xl px-2.5 py-1.5 text-xs">
                <i className="fa-regular fa-calendar text-[#c5834e]"></i>
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    soundFx.playClick();
                    setSelectedMonth(e.target.value);
                  }}
                  className="bg-transparent text-slate-800 dark:text-white font-bold outline-none cursor-pointer max-w-[200px]"
                >
                  {availableMonths.map((m) => (
                    <option
                      key={m}
                      value={m}
                      className="bg-white dark:bg-[#121418] text-slate-900 dark:text-white"
                    >
                      {formatMonthLabel(m)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Snap Back to Current Month Button if looking at past months */}
              {selectedMonth !== currentMonthDefault && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setSelectedMonth(currentMonthDefault);
                  }}
                  className="px-2.5 py-1.5 bg-[#c5834e]/15 hover:bg-[#c5834e]/25 text-[#c5834e] border border-[#c5834e]/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 animate-pulse"
                  title="الرجوع إلى الشهر الحالي فوراً"
                >
                  <i className="fa-solid fa-bolt"></i>
                  <span>الشهر الحالي</span>
                </button>
              )}

              {/* Capital Input */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-[#121418] border border-slate-200 dark:border-[#2c323f] rounded-xl px-2.5 py-1.5 text-xs">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold">رأس المال:</span>
                <input
                  type="number"
                  value={initialCapital}
                  onChange={(e) => handleCapitalChange(Number(e.target.value) || 0)}
                  className="w-20 bg-transparent text-slate-900 dark:text-white font-mono font-bold text-xs outline-none text-left"
                  placeholder="13500"
                />
                <span className="text-[10px] text-slate-400">د.ل</span>
              </div>

              {/* Primary PDF & Print Viewer */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePrint}
                className="px-3 py-1.5 bg-gradient-to-r from-[#c5834e] to-[#a6632f] hover:from-[#b5733e] hover:to-[#96531f] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#c5834e]/20 cursor-pointer"
                title="معاينة وطباعة وتصدير تقرير PDF متوافق 100% مع الهاتف والكمبيوتر"
              >
                <i className="fa-solid fa-file-pdf"></i>
                <span>تقرير PDF</span>
              </motion.button>

              {/* Direct Print Button */}
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  handlePrint();
                  setTimeout(() => {
                    printService.triggerNativePrint();
                  }, 250);
                }}
                className="px-2.5 py-1.5 bg-slate-100 dark:bg-[#1f242e] hover:bg-slate-200 dark:hover:bg-[#28303e] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#2c323f] rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                title="طباعة ورقية مباشرة"
              >
                <i className="fa-solid fa-print text-slate-500"></i>
                <span className="hidden lg:inline">طباعة عادية</span>
              </button>

              {/* Excel / CSV Export */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-2.5 py-1.5 bg-slate-200 dark:bg-[#222731] hover:bg-slate-300 dark:hover:bg-[#2b323f] text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                title="تصدير ملف إكسل CSV"
              >
                <i className="fa-solid fa-file-excel text-emerald-600"></i>
                <span className="hidden md:inline">Excel</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-[#222731] hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs transition-colors cursor-pointer"
                title="إغلاق"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
          </div>

          {/* Metric Cards Ribbon (Matching image bottom row) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 p-3 sm:p-4 bg-slate-100/70 dark:bg-[#0f1217] border-b border-slate-200 dark:border-[#2c323f] shrink-0 text-center">
            <div className="bg-white dark:bg-[#181c22] p-2.5 rounded-xl border border-slate-200 dark:border-[#2c323f]/80">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">عدد الزبائن</span>
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono">
                {monthlyMetrics.totalCustomers}
              </span>
            </div>

            <div className="bg-white dark:bg-[#181c22] p-2.5 rounded-xl border border-slate-200 dark:border-[#2c323f]/80">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">الكميات المباعة</span>
              <span className="text-sm sm:text-base font-black text-[#c5834e] font-mono">
                {monthlyMetrics.totalProductsQty} <span className="text-[10px]">قطعة</span>
              </span>
            </div>

            <div className="bg-white dark:bg-[#181c22] p-2.5 rounded-xl border border-slate-200 dark:border-[#2c323f]/80">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">إجمالي القيمة</span>
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono">
                {monthlyMetrics.totalGrossSales.toLocaleString()} <span className="text-[10px]">د.ل</span>
              </span>
            </div>

            <div className="bg-white dark:bg-[#181c22] p-2.5 rounded-xl border border-slate-200 dark:border-[#2c323f]/80">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">إجمالي المكسب</span>
              <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {monthlyMetrics.totalNetProfit.toLocaleString()} <span className="text-[10px]">د.ل</span>
              </span>
            </div>

            <div className="bg-white dark:bg-[#181c22] p-2.5 rounded-xl border border-slate-200 dark:border-[#2c323f]/80">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">التوصيل</span>
              <span className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-200 font-mono">
                {monthlyMetrics.totalDeliveryFees.toLocaleString()} <span className="text-[10px]">د.ل</span>
              </span>
            </div>

            <div className="bg-white dark:bg-[#181c22] p-2.5 rounded-xl border border-slate-200 dark:border-[#2c323f]/80">
              <span className="text-[10px] font-bold text-rose-500 block">المصروفات</span>
              <span className="text-sm sm:text-base font-black text-rose-500 font-mono">
                {monthlyMetrics.totalExpenses.toLocaleString()} <span className="text-[10px]">د.ل</span>
              </span>
            </div>

            <div className="bg-white dark:bg-[#181c22] p-2.5 rounded-xl border border-slate-200 dark:border-[#2c323f]/80">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">إجمالي الصافي</span>
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono">
                {monthlyMetrics.netTotalLY.toLocaleString()} <span className="text-[10px]">د.ل</span>
              </span>
            </div>

            <div className="bg-white dark:bg-[#181c22] p-2.5 rounded-xl border border-slate-200 dark:border-[#2c323f]/80">
              <span className="text-[10px] font-bold text-[#c5834e] block">نسبة المكسب</span>
              <span className="text-sm sm:text-base font-black text-[#c5834e] font-mono">
                {monthlyMetrics.profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Body Content Tabs / Sections */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-5">
            {/* Status Breakdown & Returns Ribbon */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block">تم التوصيل</span>
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono">
                    {monthlyMetrics.deliveredCount} فاتورة
                  </span>
                </div>
                <i className="fa-solid fa-circle-check text-2xl text-emerald-500/40"></i>
              </div>

              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block">في الطريق</span>
                  <span className="text-lg font-black text-amber-700 dark:text-amber-400 font-mono">
                    {monthlyMetrics.inTransitCount} فاتورة
                  </span>
                </div>
                <i className="fa-solid fa-truck-fast text-2xl text-amber-500/40"></i>
              </div>

              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 block">في الانتظار</span>
                  <span className="text-lg font-black text-blue-700 dark:text-blue-400 font-mono">
                    {monthlyMetrics.pendingCount} فاتورة
                  </span>
                </div>
                <i className="fa-solid fa-clock text-2xl text-blue-500/40"></i>
              </div>

              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 block">مرتجع للمخزن</span>
                  <span className="text-lg font-black text-rose-700 dark:text-rose-400 font-mono">
                    {monthlyMetrics.returnedCount} فاتورة ({monthlyMetrics.returnedItemsQty} قطعة)
                  </span>
                </div>
                <i className="fa-solid fa-rotate-left text-2xl text-rose-500/40"></i>
              </div>
            </div>

            {/* Main Day-by-Day Sheet Table */}
            <div className="bg-white dark:bg-[#181c22] rounded-2xl border border-slate-200 dark:border-[#2c323f] shadow-sm overflow-hidden">
              <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-[#2c323f] flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <i className="fa-solid fa-table text-[#c5834e]"></i>
                  جدول حركة المبيعات اليومية لشهر ({selectedMonth})
                </h3>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  مطابق لتصميم جدول الإكسل اليومي
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 dark:bg-[#0f1217] text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-[#2c323f]">
                    <tr>
                      <th className="px-3 py-2.5 text-center">اليوم</th>
                      <th className="px-3 py-2.5 text-center">اليوم بالاسم</th>
                      <th className="px-3 py-2.5 text-center">التاريخ</th>
                      <th className="px-3 py-2.5 text-center">هل بعت اليوم</th>
                      <th className="px-3 py-2.5 text-center">عدد الزبائن</th>
                      <th className="px-3 py-2.5">أسماء المنتجات</th>
                      <th className="px-3 py-2.5 text-center">إجمالي الكمية</th>
                      <th className="px-3 py-2.5">إجمالي القيمة</th>
                      <th className="px-3 py-2.5 text-emerald-600 dark:text-emerald-400">إجمالي المكسب</th>
                      <th className="px-3 py-2.5">التوصيل</th>
                      <th className="px-3 py-2.5 text-rose-500">المصروفات</th>
                      <th className="px-3 py-2.5">إجمالي LY</th>
                      <th className="px-3 py-2.5 text-center">ملاحظة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#2c323f]/60">
                    {dailyRows.map((r) => (
                      <tr
                        key={r.dayNumber}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                          !r.hasSales ? "bg-rose-500/[0.02]" : ""
                        }`}
                      >
                        <td className="px-3 py-2 text-center font-bold font-mono text-slate-700 dark:text-slate-300">
                          {r.dayNumber}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-500 text-[11px]">{r.dayName}</td>
                        <td className="px-3 py-2 text-center font-mono text-[11px] text-slate-500">
                          {r.dateFormatted}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.hasSales
                                ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                                : "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400"
                            }`}
                          >
                            {r.hasSales ? "نعم" : "لا"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-slate-900 dark:text-white">
                          {r.customersCount || 0}
                        </td>
                        <td className="px-3 py-2 text-[11px] text-slate-700 dark:text-slate-300 max-w-[200px] truncate" title={r.productNames}>
                          {r.productNames || <span className="text-slate-400">-</span>}
                        </td>
                        <td className="px-3 py-2 text-center font-mono font-bold text-[#c5834e]">
                          {r.totalQty}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-slate-900 dark:text-white">
                          {r.totalValue > 0 ? `${r.totalValue.toFixed(0)} د.ل` : "0"}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {r.totalGain > 0 ? `${r.totalGain.toFixed(0)} د.ل` : "0"}
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400">
                          {r.deliveryTotal > 0 ? `${r.deliveryTotal.toFixed(0)} د.ل` : "0"}
                        </td>
                        <td className="px-3 py-2 font-mono text-rose-500">
                          {r.expensesTotal > 0 ? `${r.expensesTotal.toFixed(0)} د.ل` : "0"}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-slate-900 dark:text-white">
                          {r.netDailyLY > 0 ? `${r.netDailyLY.toFixed(0)} د.ل` : "0"}
                        </td>
                        <td className="px-3 py-2 text-center text-[10px] text-slate-400">{r.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 dark:bg-[#0f1217] font-black border-t-2 border-slate-300 dark:border-[#2c323f]">
                    <tr>
                      <td colSpan={4} className="px-3 py-3 text-right font-bold text-slate-900 dark:text-white">
                        الإجمالي لشهر ({selectedMonth}):
                      </td>
                      <td className="px-3 py-3 text-center text-slate-900 dark:text-white font-mono">
                        {monthlyMetrics.totalCustomers}
                      </td>
                      <td className="px-3 py-3 text-slate-500 text-[11px]">-</td>
                      <td className="px-3 py-3 text-center text-[#c5834e] font-mono">
                        {monthlyMetrics.totalProductsQty}
                      </td>
                      <td className="px-3 py-3 font-mono text-slate-900 dark:text-white">
                        {monthlyMetrics.totalGrossSales.toLocaleString()} د.ل
                      </td>
                      <td className="px-3 py-3 font-mono text-emerald-600 dark:text-emerald-400">
                        {monthlyMetrics.totalNetProfit.toLocaleString()} د.ل
                      </td>
                      <td className="px-3 py-3 font-mono text-slate-700 dark:text-slate-300">
                        {monthlyMetrics.totalDeliveryFees.toLocaleString()} د.ل
                      </td>
                      <td className="px-3 py-3 font-mono text-rose-500">
                        {monthlyMetrics.totalExpenses} د.ل
                      </td>
                      <td className="px-3 py-3 font-mono text-slate-900 dark:text-white">
                        {monthlyMetrics.netTotalLY.toLocaleString()} د.ل
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-[#c5834e]">
                        {monthlyMetrics.profitMargin.toFixed(1)}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Products Breakdown Grid (Sold & Returned) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Sold Products List */}
              <div className="bg-white dark:bg-[#181c22] p-4 rounded-2xl border border-slate-200 dark:border-[#2c323f] space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2c323f] pb-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <i className="fa-solid fa-basket-shopping text-[#c5834e]"></i>
                    المنتجات التي تم بيعها خلال الشهر ({monthlyMetrics.soldProducts.length})
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-[#c5834e]">
                    إجمالي: {monthlyMetrics.totalProductsQty} قطعة
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-[#2c323f]/50 text-xs">
                  {monthlyMetrics.soldProducts.length === 0 ? (
                    <p className="text-center py-6 text-slate-400 text-xs">لا توجد مبيعات مسجلة في هذا الشهر</p>
                  ) : (
                    monthlyMetrics.soldProducts.map((p, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-[#222731] text-[10px] font-bold flex items-center justify-center text-slate-500">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-xs">
                          <span className="bg-[#c5834e]/10 text-[#c5834e] px-2 py-0.5 rounded font-bold">
                            {p.qty} قطعة
                          </span>
                          <span className="text-slate-900 dark:text-white font-bold">
                            {p.sales.toFixed(1)} د.ل
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Returned Products List */}
              <div className="bg-white dark:bg-[#181c22] p-4 rounded-2xl border border-slate-200 dark:border-[#2c323f] space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2c323f] pb-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <i className="fa-solid fa-rotate-left text-rose-500"></i>
                    المنتجات الراجعة / المسترجعة ({monthlyMetrics.returnedProducts.length})
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-rose-500">
                    إجمالي: {monthlyMetrics.returnedItemsQty} قطعة
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-[#2c323f]/50 text-xs">
                  {monthlyMetrics.returnedProducts.length === 0 ? (
                    <p className="text-center py-6 text-slate-400 text-xs">لا توجد مرتجعات في هذا الشهر — ممتاز!</p>
                  ) : (
                    monthlyMetrics.returnedProducts.map((p, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-rose-50 dark:bg-rose-500/10 text-[10px] font-bold flex items-center justify-center text-rose-500">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                        </div>
                        <span className="bg-rose-50 dark:bg-rose-500/15 text-rose-500 px-2 py-0.5 rounded font-bold font-mono">
                          {p.qty} قطعة راجعة
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
