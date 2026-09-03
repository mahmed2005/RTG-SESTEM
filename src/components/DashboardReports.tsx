import React from "react";
import { Order } from "../types";
import { soundFx } from "../services/soundEffects";
import { motion } from "motion/react";

interface DashboardReportsProps {
  orders: Order[];
}

export const DashboardReports: React.FC<DashboardReportsProps> = ({ orders }) => {
  let totalGrossSales = 0;
  let totalNetSales = 0;
  let totalProfit = 0;
  let ordersCount = 0;
  let returnedCount = 0;
  let totalReturnedAmount = 0;
  const methodCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {
    "في الانتظار": 0,
    "في الطريق": 0,
    "تم التوصيل": 0,
    "مرتجع": 0,
  };

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

  orders.forEach((o) => {
    ordersCount++;
    const orderTotal = Number(o.total) || 0;
    const orderProfit = Number(o.profit) || 0;

    totalGrossSales += orderTotal;

    if (isOrderReturned(o)) {
      returnedCount++;
      totalReturnedAmount += orderTotal;
      statusCounts["مرتجع"] = (statusCounts["مرتجع"] || 0) + 1;
      // CRITICAL GUARANTEE: Returned orders have STRICTLY ZERO PROFIT (0.00 د.ل)
      // and are excluded from net sales and net profit!
    } else {
      totalNetSales += orderTotal;
      totalProfit += orderProfit;

      const m = o.method || "كاش";
      methodCounts[m] = (methodCounts[m] || 0) + orderTotal;

      const s = o.status || "تم التوصيل";
      if (statusCounts[s] !== undefined) {
        statusCounts[s]++;
      } else {
        statusCounts[s] = 1;
      }
    }
  });

  const activeCount = ordersCount - returnedCount || 1;
  const avgOrder = totalNetSales / activeCount;
  const returnRate = ordersCount > 0 ? (returnedCount / ordersCount) * 100 : 0;

  const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
    "في الانتظار": {
      color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      icon: "fa-clock",
      label: "في الانتظار",
    },
    "في الطريق": {
      color: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20",
      icon: "fa-truck-fast",
      label: "في الطريق",
    },
    "تم التوصيل": {
      color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20",
      icon: "fa-circle-check",
      label: "تم التوصيل",
    },
    "مرتجع": {
      color: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20",
      icon: "fa-rotate-left",
      label: "مرتجع للمخزن",
    },
  };

  const handleExportFinancialPDF = () => {
    soundFx.playSuccess();
    const printWin = window.open("", "_blank", "width=850,height=900");
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

    const paymentRowsHtml = Object.keys(methodCounts)
      .map((m) => {
        const amt = methodCounts[m];
        const pct = totalNetSales > 0 ? ((amt / totalNetSales) * 100).toFixed(1) : "0";
        return `
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold;">${m}</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; direction: ltr; text-align: left; font-family: monospace;">${amt.toFixed(2)} د.ل</td>
          <td style="padding: 8px 12px; border: 1px solid #cbd5e1; text-align: center;">${pct}%</td>
        </tr>
      `;
      })
      .join("");

    printWin.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>التقرير المالي والمبيعات - RTG-SYSTEM</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@500;700;900&family=Tajawal:wght@400;600;700;800&display=swap">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', 'Tajawal', sans-serif; }
          body { background: #fff; color: #0f172a; padding: 24px; line-height: 1.5; font-size: 13px; }
          @page { size: A4 portrait; margin: 12mm; }
          .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: 900; color: #0f172a; }
          .subtitle { font-size: 13px; color: #a6632f; font-weight: bold; margin-top: 4px; }
          .date { font-size: 11px; color: #64748b; margin-top: 6px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; text-align: right; background: #f8fafc; }
          .card-title { font-size: 11px; color: #64748b; font-weight: bold; margin-bottom: 4px; }
          .card-value { font-size: 18px; font-weight: 900; font-family: monospace; color: #0f172a; }
          .card-sub { font-size: 10px; color: #10b981; margin-top: 4px; font-weight: bold; }
          .notice-box { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 10px 14px; border-radius: 6px; margin-bottom: 20px; font-size: 11px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { background: #f1f5f9; color: #0f172a; padding: 8px 12px; border: 1px solid #cbd5e1; text-align: right; }
          .footer { margin-top: 30px; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 12px; font-size: 11px; color: #64748b; }
          .btn-print { background: #a6632f; color: #fff; padding: 8px 16px; border: none; border-radius: 6px; font-size: 12px; font-weight: bold; cursor: pointer; margin-bottom: 16px; }
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
          <div class="title">RTG-SYSTEM — التقرير المالي الشامل</div>
          <div class="subtitle">منظومة إدارة المبيعات والمخازن السحابية</div>
          <div class="date">تاريخ ووقت إصدار التقرير: ${todayDate}</div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">صافي المبيعات الفعلية</div>
            <div class="card-value">${totalNetSales.toFixed(2)} د.ل</div>
            <div class="card-sub">بعد استبعاد المرتجعات</div>
          </div>
          <div class="card" style="background: #ecfdf5; border-color: #a7f3d0;">
            <div class="card-title" style="color: #065f46;">صافي الأرباح الحقيقي</div>
            <div class="card-value" style="color: #047857;">${totalProfit.toFixed(2)} د.ل</div>
            <div class="card-sub" style="color: #047857;">الأرباح المؤكدة الصافية</div>
          </div>
          <div class="card">
            <div class="card-title">إجمالي الطلبيات</div>
            <div class="card-value">${ordersCount} طلب</div>
            <div class="card-sub" style="color: #64748b;">${ordersCount - returnedCount} طلب ناجح</div>
          </div>
          <div class="card" style="background: #fff1f2; border-color: #fecdd3;">
            <div class="card-title" style="color: #9f1239;">المرتجعات الملغية</div>
            <div class="card-value" style="color: #be123c;">${returnedCount} طلب</div>
            <div class="card-sub" style="color: #be123c;">تم تصفير ربحها (0 د.ل)</div>
          </div>
        </div>

        <div class="notice-box">
          ✓ سياسة الأمان المالي المطبقة: عند إرجاع الفاتورة للمخزن، يتم تصفير أرباحها فوراً (0.00 د.ل) واسترجاع السلع التالفة أو المعادة للمخزن، ولا يتم احتسابها ضمن الأرباح المحققة نهائياً.
        </div>

        <h3 style="font-size: 14px; margin-bottom: 6px;">تفصيل وتوزيع طرق الدفع</h3>
        <table>
          <thead>
            <tr>
              <th>طريقة الدفع</th>
              <th style="text-align: left;">المبلغ الإجمالي المحصل</th>
              <th style="text-align: center;">النسبة المئوية</th>
            </tr>
          </thead>
          <tbody>
            ${paymentRowsHtml || '<tr><td colspan="3" style="text-align: center; padding: 12px;">لا توجد معاملات مسجلة</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          تم إنشاء هذا التقرير تلقائياً بواسطة RTG-SYSTEM السحابية • دعم: 0934590635
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="space-y-5 animate-fadeInUp">
      {/* Action Bar with PDF Export */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="text-right">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <i className="fa-solid fa-chart-pie text-[#c5834e]"></i>
            التقارير المالية والتدفقات النقدية
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            حساب دقيق للأرباح الصافية بعد تصفير المرتجعات واحتساب تكلفة السلع
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExportFinancialPDF}
          className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#c5834e] to-[#a6632f] hover:from-[#b5733e] hover:to-[#96531f] rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#c5834e]/20 shrink-0"
        >
          <i className="fa-solid fa-file-pdf"></i>
          <span>تصدير التقرير المالي الشامل (PDF)</span>
        </motion.button>
      </div>

      {/* Financial Return Guarantee Banner */}
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3.5 text-right flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm shrink-0 mt-0.5">
          <i className="fa-solid fa-shield-halved"></i>
        </div>
        <div className="text-xs space-y-1">
          <p className="font-bold text-emerald-900 dark:text-emerald-200">
            تأكيد حساب الأرباح: أرباح الفواتير المرتجعة مصفّرة تماماً (0.00 د.ل)
          </p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
            عند إرجاع أي فاتورة، يتم إزالة هامش ربحها بالكامل من صافي الأرباح، وإرجاع كميات السلع للمخزن دون أي تأثير سلبي على دقة ميزانيتك.
          </p>
        </div>
      </div>

      {/* 4 Professional Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Sales */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-right card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">صافي المبيعات المحققة</span>
            <div className="w-8 h-8 rounded-lg bg-[#c5834e]/10 text-[#c5834e] dark:text-[#e0a36e] flex items-center justify-center text-xs">
              <i className="fa-solid fa-wallet"></i>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {totalNetSales.toFixed(2)} <span className="text-xs font-normal text-slate-500">د.ل</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-2 flex items-center gap-1">
            <i className="fa-solid fa-circle-check text-[10px]"></i> بعد استبعاد المرتجعات
          </div>
        </div>

        {/* Pure Net Profit */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-right card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">صافي الربح الفعلي</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">
              <i className="fa-solid fa-chart-line"></i>
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {totalProfit.toFixed(2)} <span className="text-xs font-normal text-slate-500">د.ل</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-2 flex items-center gap-1">
            <i className="fa-solid fa-calculator text-[10px]"></i> ربح صافي بعد استبعاد المرتجع
          </div>
        </div>

        {/* Order Count */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-right card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">إجمالي الفواتير</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">
              <i className="fa-solid fa-receipt"></i>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {ordersCount} <span className="text-xs font-normal text-slate-500">فاتورة</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-2">
            منها {ordersCount - returnedCount} فاتورة مؤكدة
          </div>
        </div>

        {/* Returns */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-right card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">الفواتير المرتجعة</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center text-xs">
              <i className="fa-solid fa-rotate-left"></i>
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
            {returnedCount} <span className="text-xs font-normal text-slate-500">فاتورة</span>
          </div>
          <div className="text-[11px] text-red-600 dark:text-red-400 font-medium mt-2">
            ربحها: <strong className="font-mono">0.00 د.ل</strong> (مسترجعة)
          </div>
        </div>
      </div>

      {/* Orders status distribution */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-right">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs sm:text-sm tracking-wide flex items-center gap-2">
            <i className="fa-solid fa-layer-group text-[#c5834e]"></i> توزيع الفواتير حسب الحالة
          </h3>
          <span className="text-xs text-slate-400 font-mono">إجمالي: {ordersCount} طلب</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.keys(statusConfig).map((statusKey) => {
            const cfg = statusConfig[statusKey];
            const count = statusCounts[statusKey] || 0;
            return (
              <div key={statusKey} className={`${cfg.color} border rounded-xl p-4 text-center space-y-1`}>
                <i className={`fa-solid ${cfg.icon} text-lg block mb-1 opacity-80`}></i>
                <p className="text-xl font-bold font-mono">{count}</p>
                <p className="text-xs font-bold">{cfg.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment methods distribution */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-right">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs sm:text-sm tracking-wide flex items-center gap-2">
            <i className="fa-solid fa-chart-bar text-[#c5834e]"></i> توزيع المبيعات حسب طرق الدفع
          </h3>
          <span className="text-xs text-slate-400 font-medium">النسب المئوية المحققة</span>
        </div>
        <div className="space-y-3.5 pt-1">
          {Object.keys(methodCounts).length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center italic">لا توجد حركات بيع مؤكدة حالياً</p>
          ) : (
            Object.keys(methodCounts).map((m) => {
              const amt = methodCounts[m];
              const pct = totalNetSales > 0 ? ((amt / totalNetSales) * 100).toFixed(0) : "0";

              return (
                <div key={m} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700 dark:text-slate-300 font-bold">{m}</span>
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">
                      {amt.toFixed(2)} د.ل ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div
                      className="bg-[#c5834e] h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Financial Performance Summary Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm relative overflow-hidden text-right">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[#e0a36e] flex items-center gap-2">
              <i className="fa-solid fa-calculator"></i> ملخص الأداء المالي والمخزني الصافي
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              مؤشرات الأداء الفعلية بعد استبعاد المرتجعات ورسوم التوصيل والسلع التالفة
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-xs text-slate-400 font-medium block">متوسط قيمة الفاتورة</span>
            <span className="text-lg font-bold tracking-wide text-white font-mono mt-0.5 block">
              {avgOrder.toFixed(2)} د.ل
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">معدل الإرجاع</span>
            <span className="text-lg font-bold tracking-wide text-red-400 font-mono mt-0.5 block">
              {returnRate.toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">إجمالي المعاملات</span>
            <span className="text-lg font-bold tracking-wide text-emerald-400 font-mono mt-0.5 block">
              {ordersCount} فاتورة
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">قيمة المرتجعات</span>
            <span className="text-lg font-bold tracking-wide text-amber-400 font-mono mt-0.5 block">
              {totalReturnedAmount.toFixed(2)} د.ل
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
