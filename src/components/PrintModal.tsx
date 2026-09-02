import React from "react";
import { Order } from "../types";
import { RtgLogo } from "./RtgLogo";

interface PrintModalProps {
  order: Order | null;
  shopName: string;
  onClose: () => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({ order, shopName, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const items = order.cartItems && order.cartItems.length > 0
    ? order.cartItems
    : order.desc.split(" ، ").map((part, idx) => ({
        code: `ITEM-${idx + 1}`,
        name: part,
        price: order.total,
        cost: 0,
        qty: 1,
      }));

  const subtotal = order.cartItems && order.cartItems.length > 0
    ? order.cartItems.reduce((acc, i) => acc + i.price * i.qty, 0)
    : order.total - (order.delivery || 0) + (order.discount || 0);

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeInUp">
      <div className="bg-white text-slate-900 rounded-2xl p-4 w-full max-w-sm shadow-2xl space-y-4 max-h-[92vh] flex flex-col justify-between">
        {/* Printable Receipt Container */}
        <div
          id="printable-receipt"
          className="overflow-y-auto p-3 border border-slate-200 rounded-xl bg-slate-50 text-right font-mono text-[11px] text-slate-800 space-y-2 select-text"
          dir="rtl"
        >
          <div className="text-center space-y-1">
            <RtgLogo size="print" />
            <h3 className="text-sm font-black text-black">RTG GEARX</h3>
            <p className="text-[10px] text-slate-600 font-bold">
              {shopName || "MOBILE & GAMING ACCESSORIES"}
            </p>
          </div>

          <div className="border-b border-dashed border-slate-400 my-1.5" />

          <div className="space-y-0.5 text-slate-700">
            <p className="flex justify-between font-bold">
              <span>رقم الفاتورة:</span>
              <span>{order.id}</span>
            </p>
            <p className="flex justify-between">
              <span>التاريخ:</span>
              <span>{order.date}</span>
            </p>
            <p className="flex justify-between">
              <span>الزبون:</span>
              <span>{order.cName}</span>
            </p>
            {order.cPhone && order.cPhone !== "غير محدد" && (
              <p className="flex justify-between">
                <span>الهاتف:</span>
                <span>{order.cPhone}</span>
              </p>
            )}
            {order.cArea && order.cArea !== "المتجر / استلام" && (
              <p className="flex justify-between">
                <span>المنطقة:</span>
                <span>{order.cArea}</span>
              </p>
            )}
            <p className="flex justify-between">
              <span>طريقة الدفع:</span>
              <span>{order.method}</span>
            </p>
          </div>

          <div className="border-b border-dashed border-slate-400 my-2" />

          {/* Items */}
          <div className="space-y-1.5">
            <p className="font-bold text-xs text-slate-900 flex justify-between border-b border-slate-200 pb-0.5">
              <span>السلعة</span>
              <span>الإجمالي</span>
            </p>
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-[10.5px]">
                <span className="truncate max-w-[180px]">
                  {item.name} {item.qty > 1 && `(x${item.qty})`}
                </span>
                <span className="font-bold">{(item.price * item.qty).toFixed(2)} د.ل</span>
              </div>
            ))}
          </div>

          <div className="border-b border-dashed border-slate-400 my-2" />

          {/* Totals */}
          <div className="space-y-1 text-slate-800">
            <p className="flex justify-between">
              <span>الإجمالي الفرعي:</span>
              <span>{subtotal.toFixed(2)} د.ل</span>
            </p>
            {Number(order.delivery || 0) > 0 && (
              <p className="flex justify-between">
                <span>التوصيل والشحن:</span>
                <span>{Number(order.delivery).toFixed(2)} د.ل</span>
              </p>
            )}
            {Number(order.discount || 0) > 0 && (
              <p className="flex justify-between text-amber-700 font-bold">
                <span>الخصم الممنوح:</span>
                <span>-{Number(order.discount).toFixed(2)} د.ل</span>
              </p>
            )}
            <p className="flex justify-between font-black text-sm text-black border-t border-slate-300 pt-1">
              <span>صافي المطلوب:</span>
              <span>{order.total.toFixed(2)} د.ل</span>
            </p>
          </div>

          <div className="border-b border-dashed border-slate-400 my-2" />

          <div className="text-center text-[9px] text-slate-500 space-y-0.5 pt-1">
            <p>شكراً لتسوقكم وثقتكم بنا!</p>
            <p>RTG GEARX — واتساب: 0934590635</p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handlePrint}
            className="bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 glow-btn cursor-pointer shadow"
          >
            <i className="fa-solid fa-print"></i> طباعة الفاتورة
          </button>
          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
