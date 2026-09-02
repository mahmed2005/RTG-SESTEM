import React, { useState } from "react";
import { Order } from "../types";

interface OrdersListProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, nextStatus: string) => void;
  onTriggerReturn: (orderId: string) => void;
  onOpenPrintModal: (order: Order) => void;
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

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase().trim();
    if (
      q &&
      !o.id.toLowerCase().includes(q) &&
      !o.cName.toLowerCase().includes(q) &&
      !String(o.cPhone).includes(q)
    ) {
      return false;
    }
    if (statusFilter && o.status !== statusFilter) return false;
    if (methodFilter && o.method !== methodFilter) return false;
    if (dateFilter) {
      const orderDate = typeof o.date === "string" ? o.date.substring(0, 10) : "";
      if (!orderDate.includes(dateFilter)) return false;
    }
    return true;
  });

  const exportCSV = () => {
    if (filteredOrders.length === 0) return;
    const headers = ["رقم الفاتورة", "التاريخ", "الزبون", "الهاتف", "المنطقة", "طريقة الدفع", "المبلغ الإجمالي", "صافي الربح", "الحالة"];
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
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <i className="fa-solid fa-magnifying-glass text-slate-400 absolute right-3.5 top-3 text-xs"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم الفاتورة (#RTG-...)، اسم الزبون، أو رقم الهاتف..."
              className="w-full pr-9 pl-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-lg outline-none focus:border-blue-600 dark:focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            onClick={exportCSV}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 hover:bg-blue-100 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <i className="fa-solid fa-file-excel text-xs"></i> تصدير البيانات (CSV)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg outline-none focus:border-blue-600"
          >
            <option value="">جميع الحالات</option>
            <option value="في الانتظار">في الانتظار</option>
            <option value="في الطريق">في الطريق</option>
            <option value="تم التوصيل">تم التوصيل</option>
            <option value="راجع">مرتجع</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg outline-none focus:border-blue-600"
          >
            <option value="">جميع طرق الدفع</option>
            <option value="كاش">كاش نقدي</option>
            <option value="مصراتي">خدمة مصراتي</option>
            <option value="سداد">خدمة سداد</option>
            <option value="تداول">خدمة تداول</option>
            <option value="بطاقة">بطاقة مصرفية</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* Table & Cards Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 dark:text-white uppercase text-xs sm:text-sm tracking-wide flex items-center gap-2">
            <i className="fa-solid fa-list-check text-blue-600"></i> سجل العمليات والفواتير
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {filteredOrders.length} فاتورة مسجلة
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center text-slate-400 text-xs py-16 space-y-2">
            <i className="fa-solid fa-receipt text-4xl mb-2 block opacity-30"></i>
            <p className="font-bold">لا توجد فواتير مطابقة لخيارات الفلترة</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3">رقم الفاتورة</th>
                    <th className="px-5 py-3">الزبون والمنطقة</th>
                    <th className="px-5 py-3">المنتجات</th>
                    <th className="px-5 py-3">طريقة الدفع</th>
                    <th className="px-5 py-3">المبلغ الإجمالي</th>
                    <th className="px-5 py-3">التوقيت</th>
                    <th className="px-5 py-3">الحالة</th>
                    <th className="px-5 py-3 text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredOrders.map((o) => {
                    let statusBadge = (
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                        {o.status}
                      </span>
                    );
                    if (o.status === "تم التوصيل") {
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
                    } else if (o.status === "راجع") {
                      statusBadge = (
                        <span className="px-2.5 py-1 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 rounded-full text-[10px] font-bold border border-red-200 dark:border-red-500/20">
                          مرتجع
                        </span>
                      );
                    }

                    return (
                      <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
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
                          {o.total.toFixed(2)} د.ل
                          {o.status !== "راجع" && (
                            <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                              + {o.profit.toFixed(2)} ربح
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-[11px]">
                          {o.date}
                        </td>
                        <td className="px-5 py-3.5">
                          {statusBadge}
                        </td>
                        <td className="px-5 py-3.5 text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            {o.status !== "راجع" ? (
                              <>
                                <select
                                  value={o.status}
                                  onChange={(e) => onUpdateStatus(o.id, e.target.value)}
                                  className="text-[11px] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-blue-600"
                                >
                                  <option value="في الانتظار">في الانتظار</option>
                                  <option value="في الطريق">في الطريق</option>
                                  <option value="تم التوصيل">تم التوصيل</option>
                                </select>
                                <button
                                  onClick={() => onTriggerReturn(o.id)}
                                  className="text-[11px] bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-100 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                                  title="إرجاع الفاتورة"
                                >
                                  إرجاع
                                </button>
                                <button
                                  onClick={() => onOpenPrintModal(o)}
                                  className="text-[11px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                                  title="طباعة"
                                >
                                  <i className="fa-solid fa-print"></i>
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-red-500 italic">
                                مرتجع ومسترجع بالمخزن
                              </span>
                            )}
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
              {filteredOrders.map((o) => (
                <div key={o.id} className="pt-3 first:pt-0 space-y-2 text-right">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                      #{o.id}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {o.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-start text-xs">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{o.cName}</p>
                      <p className="text-[11px] text-slate-500">{o.cPhone} {o.cArea && `• ${o.cArea}`}</p>
                    </div>
                    <div className="text-left font-mono">
                      <span className="font-bold text-slate-900 dark:text-white block">{o.total.toFixed(2)} د.ل</span>
                      <span className="text-[10px] text-slate-400">{o.method}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded text-[11px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                    {o.desc}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">{o.date}</span>
                    <div className="flex items-center gap-1.5">
                      {o.status !== "راجع" && (
                        <>
                          <button
                            onClick={() => onTriggerReturn(o.id)}
                            className="text-[10px] bg-red-50 dark:bg-red-500/10 text-red-600 border border-red-200 dark:border-red-500/20 px-2 py-1 rounded"
                          >
                            إرجاع
                          </button>
                          <button
                            onClick={() => onOpenPrintModal(o)}
                            className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded"
                          >
                            طباعة
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
