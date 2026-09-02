import React from "react";
import { Order } from "../types";

interface DashboardReportsProps {
  orders: Order[];
}

export const DashboardReports: React.FC<DashboardReportsProps> = ({ orders }) => {
  let totalSales = 0;
  let totalProfit = 0;
  let ordersCount = 0;
  let returnedCount = 0;
  const methodCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {
    "في الانتظار": 0,
    "في الطريق": 0,
    "تم التوصيل": 0,
    "راجع": 0,
  };

  orders.forEach((o) => {
    ordersCount++;
    if (o.status === "راجع") {
      returnedCount++;
      statusCounts["راجع"]++;
    } else {
      totalSales += o.total;
      totalProfit += o.profit;
      methodCounts[o.method] = (methodCounts[o.method] || 0) + o.total;
      if (statusCounts[o.status] !== undefined) {
        statusCounts[o.status]++;
      } else {
        statusCounts[o.status] = 1;
      }
    }
  });

  const activeCount = ordersCount - returnedCount || 1;
  const avgOrder = totalSales / activeCount;
  const returnRate = ordersCount > 0 ? (returnedCount / ordersCount) * 100 : 0;

  const statusConfig: Record<string, { color: string; icon: string }> = {
    "في الانتظار": {
      color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      icon: "fa-clock",
    },
    "في الطريق": {
      color: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20",
      icon: "fa-truck-fast",
    },
    "تم التوصيل": {
      color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20",
      icon: "fa-circle-check",
    },
    "راجع": {
      color: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20",
      icon: "fa-rotate-left",
    },
  };

  return (
    <div className="space-y-5 animate-fadeInUp">
      {/* 4 Professional Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-right card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">إجمالي المبيعات</span>
            <div className="w-8 h-8 rounded-lg bg-[#c5834e]/10 text-[#c5834e] dark:text-[#e0a36e] flex items-center justify-center text-xs">
              <i className="fa-solid fa-wallet"></i>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {totalSales.toFixed(2)} <span className="text-xs font-normal text-slate-500">د.ل</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-2 flex items-center gap-1">
            <i className="fa-solid fa-arrow-trend-up text-[10px]"></i> تدفق نقدي مباشر
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-right card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">صافي الأرباح</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">
              <i className="fa-solid fa-chart-line"></i>
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {totalProfit.toFixed(2)} <span className="text-xs font-normal text-slate-500">د.ل</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-2 flex items-center gap-1">
            <i className="fa-solid fa-circle-check text-[10px]"></i> محسوبة بعد التكلفة
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-right card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">عدد الطلبيات</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">
              <i className="fa-solid fa-receipt"></i>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {ordersCount} <span className="text-xs font-normal text-slate-500">طلب</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-2">
            معدل النشاط مستقر
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-right card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">المرتجع</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center text-xs">
              <i className="fa-solid fa-rotate-left"></i>
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
            {returnedCount} <span className="text-xs font-normal text-slate-500">طلب</span>
          </div>
          <div className="text-[11px] text-red-600 dark:text-red-400 font-medium mt-2">
            {returnRate.toFixed(1)}% نسبة المرتجع
          </div>
        </div>
      </div>

      {/* Orders status distribution */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-right">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs sm:text-sm tracking-wide flex items-center gap-2">
            <i className="fa-solid fa-layer-group text-[#c5834e]"></i> توزيع الطلبيات حسب الحالة
          </h3>
          <span className="text-xs text-slate-400 font-mono">إجمالي: {ordersCount} طلب</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.keys(statusCounts).map((status) => {
            const cfg = statusConfig[status] || {
              color: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
              icon: "fa-question",
            };
            return (
              <div key={status} className={`${cfg.color} border rounded-xl p-4 text-center space-y-1`}>
                <i className={`fa-solid ${cfg.icon} text-lg block mb-1 opacity-80`}></i>
                <p className="text-xl font-bold font-mono">{statusCounts[status]}</p>
                <p className="text-xs font-medium">{status}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment methods distribution */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-right">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs sm:text-sm tracking-wide flex items-center gap-2">
            <i className="fa-solid fa-chart-bar text-[#c5834e]"></i> توزيع طرق الدفع
          </h3>
          <span className="text-xs text-slate-400 font-medium">النسب المئوية</span>
        </div>
        <div className="space-y-3.5 pt-1">
          {Object.keys(methodCounts).length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center italic">لا توجد حركات بيع مسجلة حالياً</p>
          ) : (
            Object.keys(methodCounts).map((m) => {
              const amt = methodCounts[m];
              const pct = totalSales > 0 ? ((amt / totalSales) * 100).toFixed(0) : "0";

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

      {/* Financial Performance Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm relative overflow-hidden text-right">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[#e0a36e] flex items-center gap-2">
              <i className="fa-solid fa-calculator"></i> ملخص الأداء المالي الصافي
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              مؤشرات الأداء بعد استبعاد تكاليف السلع المشتراة ورسوم التوصيل.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
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
          <div className="col-span-2 sm:col-span-1">
            <span className="text-xs text-slate-400 font-medium block">إجمالي المعاملات</span>
            <span className="text-lg font-bold tracking-wide text-emerald-400 font-mono mt-0.5 block">
              {ordersCount} معاملة
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
