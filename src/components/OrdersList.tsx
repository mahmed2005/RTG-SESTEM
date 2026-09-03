import React, { useState } from "react";
import { Order } from "../types";
import { soundFx } from "../services/soundEffects";
import { motion } from "motion/react";

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
    const isReturned = o.status === "مرتجع" || o.status === "راجع";
    if (statusFilter) {
      if (statusFilter === "مرتجع" || statusFilter === "راجع") {
        if (!isReturned) return false;
      } else if (o.status !== statusFilter) {
        return false;
      }
    }
    if (methodFilter && o.method !== methodFilter) return false;
    if (dateFilter) {
      const orderDate = typeof o.date === "string" ? o.date.substring(0, 10) : "";
      if (!orderDate.includes(dateFilter)) return false;
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
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={exportCSV}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-[#c5834e] dark:text-[#e0a36e] bg-[#c5834e]/10 border border-[#c5834e]/30 hover:bg-[#c5834e]/20 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <i className="fa-solid fa-file-excel text-xs"></i> تصدير البيانات (CSV)
          </motion.button>
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
            <option value="كاش">كاش نقدي</option>
            <option value="مصراتي">خدمة مصراتي</option>
            <option value="سداد">خدمة سداد</option>
            <option value="تداول">خدمة تداول</option>
            <option value="بطاقة">بطاقة مصرفية</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              soundFx.playClick();
              setDateFilter(e.target.value);
            }}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-xl outline-none focus:border-[#c5834e]"
          />
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
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[#c5834e] dark:text-[#e0a36e]">
                        #{o.id}
                      </span>
                      {isReturned ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                          <i className="fa-solid fa-rotate-left text-[9px]"></i> مرتجع
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {o.status}
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
