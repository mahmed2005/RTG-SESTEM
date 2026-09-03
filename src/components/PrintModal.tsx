import React, { useState } from "react";
import { Order } from "../types";
import { RtgLogo } from "./RtgLogo";
import { soundFx } from "../services/soundEffects";
import { motion, AnimatePresence } from "motion/react";

interface PrintModalProps {
  order: Order | null;
  shopName?: string;
  onClose: () => void;
}

// Generate realistic SVG Barcode with checksum look
const InvoiceBarcode: React.FC<{ code: string }> = ({ code }) => {
  // Deterministic bar widths based on code characters
  const bars = React.useMemo(() => {
    const chars = (code || "INV-00000").toUpperCase();
    const result: { width: number; space: number }[] = [];
    for (let i = 0; i < chars.length; i++) {
      const codeVal = chars.charCodeAt(i);
      const w1 = (codeVal % 3) + 1.2;
      const s1 = ((codeVal >> 1) % 2) + 1;
      const w2 = ((codeVal >> 2) % 3) + 1;
      const s2 = ((codeVal >> 3) % 2) + 1;
      result.push({ width: w1, space: s1 });
      result.push({ width: w2, space: s2 });
    }
    return result;
  }, [code]);

  let currentX = 10;
  return (
    <div className="flex flex-col items-center justify-center my-1 select-none">
      <svg
        className="w-48 h-10 overflow-visible"
        viewBox="0 0 200 40"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Guard bars left */}
        <rect x="2" y="0" width="2" height="36" fill="#0f172a" />
        <rect x="6" y="0" width="2" height="36" fill="#0f172a" />

        {/* Guard bars right */}
        <rect x="192" y="0" width="2" height="36" fill="#0f172a" />
        <rect x="196" y="0" width="2" height="36" fill="#0f172a" />

        {/* Inner bars */}
        {bars.slice(0, 24).map((b, i) => {
          const x = currentX;
          currentX += b.width + b.space + 1.5;
          if (x > 185) return null;
          return (
            <rect
              key={i}
              x={x}
              y="2"
              width={b.width}
              height="30"
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
  const [isPrinting, setIsPrinting] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);
  const [printerPaperSize, setPrinterPaperSize] = useState<"80mm" | "58mm">("80mm");

  if (!order) return null;

  const isReturned =
    order.status === "مرتجع" ||
    order.status === "راجع" ||
    (order.status || "").includes("رجع") ||
    (Number(order.profit) === 0 && Boolean(order.returnNote));

  // Extract items cleanly
  const items =
    order.cartItems && order.cartItems.length > 0
      ? order.cartItems
      : order.desc.split(" ، ").map((part, idx) => {
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

  // Generate complete standalone printable HTML document
  const getPrintableHtml = () => {
    const el = document.getElementById("printable-receipt");
    const content = el ? el.innerHTML : "";
    const paperWidth = printerPaperSize === "58mm" ? "58mm" : "80mm";

    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>فاتورة #${order.id} - ${shopName || "RTG-SYSTEM"}</title>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;900&family=Tajawal:wght@400;500;700;800&display=swap">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Cairo', 'Tajawal', sans-serif; }
          @page { size: ${paperWidth} auto; margin: 3mm; }
          body {
            background: #fff;
            color: #000;
            width: ${paperWidth};
            max-width: 100%;
            margin: 0 auto;
            padding: 4px;
            font-size: 11px;
            line-height: 1.35;
          }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 3px 2px; }
          .no-print { display: none !important; }
          @media print {
            body { width: 100%; margin: 0; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div>${content}</div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    soundFx.playCashRegister();
    setIsPrinting(true);
    setPrintSuccess(false);

    try {
      // 1. First method: create an invisible isolated iframe for clean printing
      let printFrame = document.getElementById("rtg-print-frame") as HTMLIFrameElement | null;
      if (!printFrame) {
        printFrame = document.createElement("iframe");
        printFrame.id = "rtg-print-frame";
        printFrame.style.position = "fixed";
        printFrame.style.right = "0";
        printFrame.style.bottom = "0";
        printFrame.style.width = "0";
        printFrame.style.height = "0";
        printFrame.style.border = "none";
        printFrame.style.zIndex = "-9999";
        document.body.appendChild(printFrame);
      }

      const frameDoc = printFrame.contentDocument || (printFrame.contentWindow ? printFrame.contentWindow.document : null);
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(getPrintableHtml());
        frameDoc.close();
      }

      // 2. Also trigger standard window.print() after a tiny delay
      setTimeout(() => {
        try {
          if (printFrame && printFrame.contentWindow) {
            printFrame.contentWindow.focus();
            printFrame.contentWindow.print();
          } else {
            window.print();
          }
        } catch {
          window.print();
        }
        setIsPrinting(false);
        setPrintSuccess(true);
      }, 350);
    } catch (e) {
      console.warn("Direct iframe print failed, falling back to window.print():", e);
      window.print();
      setIsPrinting(false);
      setPrintSuccess(true);
    }
  };

  const handleExportPDF = () => {
    soundFx.playSuccess();
    const printWin = window.open("", "_blank", "width=600,height=800");
    if (printWin) {
      printWin.document.write(getPrintableHtml());
      printWin.document.close();
    } else {
      handlePrint();
    }
  };

  const handleCopyCode = () => {
    if (order.id) {
      soundFx.playClick();
      navigator.clipboard.writeText(order.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 15 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="bg-white text-slate-900 rounded-3xl p-4 sm:p-5 w-full max-w-sm shadow-2xl border border-slate-200/80 space-y-3 max-h-[95vh] flex flex-col justify-between overflow-hidden"
        >
          {/* Header Controls: Printer Size Toggle & Title */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <i className="fa-solid fa-receipt text-[#c5834e]"></i>
                معاينة وطباعة الفاتورة
              </span>
            </div>

            {/* Paper Size selector */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-[10px] font-bold">
              <button
                onClick={() => setPrinterPaperSize("80mm")}
                className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                  printerPaperSize === "80mm"
                    ? "bg-[#c5834e] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="مقاس 80 ملم - طابعة فواتير قياسية"
              >
                80mm
              </button>
              <button
                onClick={() => setPrinterPaperSize("58mm")}
                className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                  printerPaperSize === "58mm"
                    ? "bg-[#c5834e] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="مقاس 58 ملم - كاشير مصغر"
              >
                58mm
              </button>
            </div>
          </div>

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
                <p className="text-[10px] text-[#a6632f] font-bold font-['IBM_Plex_Sans_Arabic','Cairo',sans-serif]">
                  منظومة متكاملة لمتجرك الإلكتروني
                </p>
                <div className="inline-block mt-1 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 font-bold text-[11px]">
                  {shopName || "المتجر الرسمي"}
                </div>
              </div>
            </div>

            {/* If Order is Returned, show prominent refund stamp */}
            {isReturned && (
              <div className="bg-red-50 border-2 border-dashed border-red-500 rounded-xl p-2 text-center text-red-700">
                <span className="font-black text-xs block">⚠️ فاتورة ملغية / مرتجعة للمخزن</span>
                <span className="text-[9px] block text-red-600 mt-0.5">
                  تم استرجاع السلع للمخزن • صافي الربح المحتسب: 0.00 د.ل
                </span>
                {order.returnNote && (
                  <span className="text-[9px] text-slate-600 block mt-0.5 italic">
                    سبب الإرجاع: {order.returnNote}
                  </span>
                )}
              </div>
            )}

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
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    isReturned
                      ? "bg-rose-100 text-rose-800"
                      : "bg-emerald-100 text-emerald-900"
                  }`}
                >
                  {isReturned ? "مرتجع للمخزن" : order.status || "مكتملة"}
                </span>
              </div>
            </div>

            <div className="border-b border-dashed border-slate-300 my-1" />

            {/* Items Table */}
            <div className="space-y-1">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-500 text-[10px]">
                    <th className="py-1">السلعة / الصنف</th>
                    <th className="py-1 text-center">الكمية</th>
                    <th className="py-1 text-left">السعر</th>
                    <th className="py-1 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="text-slate-800">
                      <td className="py-1 font-bold">
                        <span className="block leading-tight">{item.name}</span>
                        {item.code && (
                          <span className="font-mono text-[9px] text-slate-400 block">
                            [{item.code}]
                          </span>
                        )}
                      </td>
                      <td className="py-1 text-center font-mono font-bold">{item.qty}</td>
                      <td className="py-1 text-left font-mono">{Number(item.price).toFixed(2)}</td>
                      <td className="py-1 text-left font-mono font-bold text-slate-900">
                        {(item.price * item.qty).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-b-2 border-dashed border-slate-300 my-1" />

            {/* Totals Calculation */}
            <div className="space-y-1 text-slate-700 bg-slate-50/50 p-2 rounded-xl">
              <div className="flex justify-between">
                <span className="text-slate-500">المجموع الفرعي:</span>
                <span className="font-mono font-bold">{subtotal.toFixed(2)} د.ل</span>
              </div>
              {Number(order.delivery) > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">رسوم التوصيل:</span>
                  <span className="font-mono">+{Number(order.delivery).toFixed(2)} د.ل</span>
                </div>
              )}
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
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

          {/* Instant feedback notification when print is sent */}
          {printSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-2 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-circle-check text-emerald-600"></i>
              <span>تم إرسال أمر الطباعة للطابعة الحرارية بنجاح ✓</span>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                disabled={isPrinting}
                onClick={handlePrint}
                className="bg-gradient-to-r from-[#c5834e] to-[#a6632f] hover:from-[#b5733e] hover:to-[#96531f] disabled:opacity-75 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#c5834e]/20 transition-all"
              >
                {isPrinting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>جاري إرسال الأمر...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-print"></i>
                    <span>طباعة الفاتورة الآن</span>
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleExportPDF}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <i className="fa-solid fa-file-pdf"></i>
                <span>حفظ / مشاركة PDF</span>
              </motion.button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleCopyCode}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-300 cursor-pointer transition-all"
              >
                <i className={`fa-solid ${copied ? "fa-check text-emerald-600" : "fa-copy"}`}></i>
                <span>{copied ? "تم نسخ الكود ✓" : "نسخ رقم الفاتورة"}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  soundFx.playClick();
                  onClose();
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs cursor-pointer transition-all border border-slate-200 text-center"
              >
                إغلاق النافذة
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
