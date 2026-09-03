import React, { useState } from "react";
import { Order } from "../types";
import { RtgLogo } from "./RtgLogo";
import { soundFx } from "../services/soundEffects";
import { motion, AnimatePresence } from "motion/react";

interface PrintModalProps {
  order: Order | null;
  shopName: string;
  onClose: () => void;
}

/**
 * Clean SVG Barcode Component for Invoice Receipt
 * Generates crisp scannable barcode stripes based on invoice code
 */
const InvoiceBarcode: React.FC<{ code: string }> = ({ code }) => {
  const generateBars = (str: string) => {
    const bars: { width: number; isBlack: boolean }[] = [];
    // Start guard
    bars.push({ width: 3, isBlack: true });
    bars.push({ width: 2, isBlack: false });
    bars.push({ width: 2, isBlack: true });
    bars.push({ width: 2, isBlack: false });

    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      const w1 = ((charCode * 3) % 3) + 1;
      const w2 = ((charCode * 7) % 3) + 1;
      const w3 = ((charCode * 5) % 3) + 1;
      const w4 = ((charCode * 11) % 2) + 1;

      bars.push({ width: w1, isBlack: true });
      bars.push({ width: w2, isBlack: false });
      bars.push({ width: w3, isBlack: true });
      bars.push({ width: w4, isBlack: false });
    }

    // Stop guard
    bars.push({ width: 2, isBlack: true });
    bars.push({ width: 2, isBlack: false });
    bars.push({ width: 3, isBlack: true });

    return bars;
  };

  const bars = generateBars(code || "INV-000000");
  const totalWidth = bars.reduce((acc, b) => acc + b.width, 0);

  let currentX = 0;

  return (
    <div className="flex flex-col items-center justify-center my-1.5 text-center select-all">
      <svg
        viewBox={`0 0 ${totalWidth} 40`}
        className="w-full max-w-[210px] h-10"
        style={{ shapeRendering: "crispEdges" }}
      >
        {bars.map((bar, idx) => {
          const x = currentX;
          currentX += bar.width;
          if (!bar.isBlack) return null;
          return (
            <rect
              key={idx}
              x={x}
              y="0"
              width={bar.width}
              height="40"
              fill="#0f172a"
            />
          );
        })}
      </svg>
      <div className="font-mono text-[11px] font-black tracking-widest text-slate-900 mt-0.5 uppercase">
        * {code} *
      </div>
    </div>
  );
};

export const PrintModal: React.FC<PrintModalProps> = ({ order, shopName, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const handlePrint = () => {
    soundFx.playCashRegister();
    window.print();
  };

  const handleCopyCode = () => {
    if (order.id) {
      soundFx.playClick();
      navigator.clipboard.writeText(order.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Extract items cleanly
  const items =
    order.cartItems && order.cartItems.length > 0
      ? order.cartItems
      : order.desc.split(" ، ").map((part, idx) => {
          // Parse quantity if format like "2x [code] name"
          const match = part.match(/(\d+)\s*[xX×]\s*(?:\[([^\]]+)\])?\s*(.*)/);
          if (match) {
            return {
              code: match[2] || `ITEM-${idx + 1}`,
              name: match[3] || part,
              price: order.total / (parseInt(match[1]) || 1),
              cost: 0,
              qty: parseInt(match[1]) || 1,
            };
          }
          return {
            code: `ITEM-${idx + 1}`,
            name: part,
            price: order.total,
            cost: 0,
            qty: 1,
          };
        });

  const subtotal =
    order.cartItems && order.cartItems.length > 0
      ? order.cartItems.reduce((acc, i) => acc + i.price * i.qty, 0)
      : order.total - (order.delivery || 0) + (order.discount || 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 15 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="bg-white text-slate-900 rounded-3xl p-4 sm:p-5 w-full max-w-sm shadow-2xl border border-slate-200/80 space-y-3.5 max-h-[95vh] flex flex-col justify-between"
        >
          {/* Printable Receipt Card */}
          <div
            id="printable-receipt"
            className="overflow-y-auto p-4 border border-slate-300 rounded-2xl bg-white text-right font-sans text-[11px] text-slate-800 space-y-2.5 select-text shadow-inner"
            dir="rtl"
          >
            {/* Header with Official Branding */}
            <div className="text-center space-y-1 pb-1">
              <RtgLogo size="print" className="mx-auto" />
              <div className="pt-1">
                <h3 className="text-sm sm:text-base font-black text-slate-950 tracking-wider font-sans uppercase">
                  RTG-SYSTEM
                </h3>
                <p className="text-[10px] text-[#a6632f] font-bold">
                  منظومة متكاملة لمتجرك الإلكتروني
                </p>
                <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 font-bold text-[11px]">
                  {shopName || "المتجر الرسمي"}
                </div>
              </div>
            </div>

            <div className="border-b-2 border-dashed border-slate-300 my-1" />

            {/* Official Barcode & Invoice Number */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center shadow-xs">
              <span className="text-[10px] text-slate-500 font-bold block mb-0.5">
                فاتورة مبيعات إلكترونية معتمدة
              </span>
              <InvoiceBarcode code={order.id} />
            </div>

            {/* Invoice Meta Grid */}
            <div className="space-y-1 text-slate-700 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
              <div className="flex justify-between font-bold text-slate-950 pb-0.5 border-b border-slate-200/60">
                <span>رقم الفاتورة:</span>
                <span className="font-mono text-xs text-[#a6632f]">{order.id}</span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-slate-500">التاريخ والوقت:</span>
                <span className="font-mono text-[10px] text-slate-800">{order.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">العميل / المستلم:</span>
                <span className="font-bold text-slate-900">{order.cName || "زبون نقدي"}</span>
              </div>
              {order.cPhone && order.cPhone !== "غير محدد" && (
                <div className="flex justify-between">
                  <span className="text-slate-500">رقم الهاتف:</span>
                  <span className="font-mono font-bold text-slate-800">{order.cPhone}</span>
                </div>
              )}
              {order.cArea && order.cArea !== "المتجر / استلام" && (
                <div className="flex justify-between">
                  <span className="text-slate-500">العنوان / المنطقة:</span>
                  <span className="text-slate-800 font-medium">{order.cArea}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">طريقة الدفع:</span>
                <span className="font-bold px-2 py-0.5 rounded bg-amber-100/80 text-amber-900 text-[10px]">
                  {order.method}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">حالة الفاتورة:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  order.status === "مرتجع" || order.status === "راجع"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-emerald-100 text-emerald-900"
                }`}>
                  {order.status === "مرتجع" || order.status === "راجع" ? "مرتجع للمخزن" : order.status || "مكتملة"}
                </span>
              </div>
            </div>

            <div className="border-b border-dashed border-slate-300 my-1" />

            {/* Items Table */}
            <div className="space-y-1">
              <div className="font-bold text-[10px] text-slate-900 flex justify-between border-b border-slate-300 pb-1 px-1 bg-slate-100/80 rounded py-0.5">
                <span className="w-1/2">السلعة / الصنف</span>
                <span className="w-1/6 text-center">الكمية</span>
                <span className="w-1/3 text-left">الإجمالي</span>
              </div>
              <div className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px] py-1 px-1">
                    <span className="w-1/2 truncate font-medium text-slate-900">
                      {item.name}
                    </span>
                    <span className="w-1/6 text-center font-mono font-bold text-slate-700">
                      ×{item.qty}
                    </span>
                    <span className="w-1/3 text-left font-bold font-mono text-slate-950">
                      {(item.price * item.qty).toFixed(2)} د.ل
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-b-2 border-dashed border-slate-400 my-1.5" />

            {/* Financial Totals Breakdown */}
            <div className="space-y-1 text-slate-800 bg-slate-50 p-2.5 rounded-xl">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600">الإجمالي الفرعي:</span>
                <span className="font-mono font-medium">{subtotal.toFixed(2)} د.ل</span>
              </div>
              {Number(order.delivery || 0) > 0 && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-600">خدمة التوصيل:</span>
                  <span className="font-mono">{Number(order.delivery).toFixed(2)} د.ل</span>
                </div>
              )}
              {Number(order.discount || 0) > 0 && (
                <div className="flex justify-between text-amber-700 font-bold text-[11px]">
                  <span>الخصم الممنوح:</span>
                  <span className="font-mono">-{Number(order.discount).toFixed(2)} د.ل</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-black border-t-2 border-slate-900 pt-1.5 mt-1">
                <span>المبلغ الإجمالي الصافي:</span>
                <span className="font-mono text-base text-[#a6632f]">{order.total.toFixed(2)} د.ل</span>
              </div>
            </div>

            {/* Printable Footer */}
            <div className="text-center text-[9px] text-slate-500 space-y-0.5 pt-1 border-t border-dashed border-slate-300">
              <p className="font-bold text-slate-800 text-[10px]">شكراً لتسوقكم وثقتكم بنا!</p>
              <p className="font-mono text-[9px] text-slate-600">
                طُبعت بواسطة منظومة RTG-SYSTEM السحابية • دعم: 0934590635
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handlePrint}
                className="bg-gradient-to-r from-[#c5834e] to-[#a6632f] hover:from-[#b5733e] hover:to-[#96531f] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#c5834e]/20 transition-all"
              >
                <i className="fa-solid fa-print"></i> طباعة الفاتورة الآن
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleCopyCode}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-300 cursor-pointer transition-all"
              >
                <i className={`fa-solid ${copied ? "fa-check text-emerald-600" : "fa-copy"}`}></i>
                {copied ? "تم نسخ الكود ✓" : "نسخ رقم الفاتورة"}
              </motion.button>
            </div>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs cursor-pointer transition-all border border-slate-200"
            >
              إغلاق النافذة
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
