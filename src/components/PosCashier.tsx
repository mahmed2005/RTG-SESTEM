import React, { useState } from "react";
import { ProductsMap, CartItem, Order } from "../types";
import { soundFx } from "../services/soundEffects";
import { motion, AnimatePresence } from "motion/react";

interface PosCashierProps {
  products: ProductsMap;
  onOrderCreated: (order: Order, updatedProducts: ProductsMap) => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  onOpenPrintModal: (order: Order) => void;
}

export const PosCashier: React.FC<PosCashierProps> = ({
  products,
  onOrderCreated,
  showToast,
  onOpenPrintModal,
}) => {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerBackupPhone, setCustomerBackupPhone] = useState("");
  const [customerArea, setCustomerArea] = useState("");
  const [payMethod, setPayMethod] = useState("كاش");
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<string>("");

  const addToCart = (barcode: string) => {
    const prod = products[barcode];
    if (!prod || prod.qty <= 0) {
      soundFx.playWarning();
      showToast("عذراً، هذا المنتج نفد من المخزن!", "error");
      return;
    }

    soundFx.playBeep();

    setCart((prev) => {
      const existing = prev.find((item) => item.code === barcode);
      if (existing) {
        if (existing.qty >= prod.qty) {
          showToast(`الكمية المتاحة في المخزن فقط ${prod.qty} قطع`, "info");
          return prev;
        }
        return prev.map((item) =>
          item.code === barcode ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          code: barcode,
          name: prod.name,
          price: prod.price,
          cost: prod.cost,
          qty: 1,
        },
      ];
    });
  };

  const updateCartQty = (barcode: string, newQty: number) => {
    soundFx.playClick();
    const prod = products[barcode];
    if (newQty <= 0) {
      setCart((prev) => prev.filter((item) => item.code !== barcode));
      return;
    }

    if (prod && newQty > prod.qty) {
      showToast(`أقصى كمية متوفرة هي ${prod.qty}`, "info");
      setCart((prev) =>
        prev.map((item) => (item.code === barcode ? { ...item, qty: prod.qty } : item))
      );
      return;
    }

    setCart((prev) =>
      prev.map((item) => (item.code === barcode ? { ...item, qty: newQty } : item))
    );
  };

  const clearCart = () => {
    soundFx.playWarning();
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerBackupPhone("");
    setCustomerArea("");
    setDeliveryFee(0);
    setDiscountAmount(0);
    setPaidAmount("");
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const cartTotal = Math.max(0, cartSubtotal + Number(deliveryFee || 0) - Number(discountAmount || 0));

  const parsedPaid = parseFloat(paidAmount) || 0;
  const change = parsedPaid > 0 ? parsedPaid - cartTotal : 0;

  const handleSubmitOrder = () => {
    if (cart.length === 0) {
      soundFx.playWarning();
      showToast("السلة فارغة! أضف منتجاً أولاً للمتابعة", "error");
      return;
    }

    soundFx.playCashRegister();

    let netProfit = 0;
    const parts: string[] = [];

    cart.forEach((item) => {
      netProfit += (item.price - item.cost) * item.qty;
      parts.push(`${item.qty}x [${item.code}] ${item.name}`);
    });

    const invoiceId = "INV-" + Date.now().toString().slice(-6);
    const dateStr = new Date().toLocaleString("ar-LY", { hour12: false });

    // Update inventory stocks immediately
    const updatedProducts: ProductsMap = { ...products };
    cart.forEach((item) => {
      if (updatedProducts[item.code]) {
        updatedProducts[item.code] = {
          ...updatedProducts[item.code],
          qty: Math.max(0, updatedProducts[item.code].qty - item.qty),
        };
      }
    });

    const newOrder: Order = {
      id: invoiceId,
      date: dateStr,
      desc: parts.join(" ، "),
      total: cartTotal,
      profit: netProfit - Number(discountAmount || 0),
      method: payMethod,
      delivery: Number(deliveryFee || 0),
      discount: Number(discountAmount || 0),
      status: "في الانتظار",
      cName: customerName.trim() || "زبون مباشر",
      cPhone: customerPhone.trim() || "غير محدد",
      cBackup: customerBackupPhone.trim(),
      cArea: customerArea.trim() || "المتجر / استلام",
      cartItems: [...cart],
    };

    onOrderCreated(newOrder, updatedProducts);
    onOpenPrintModal(newOrder);
    showToast(`✓ تم تأكيد وحفظ الفاتورة #${invoiceId} بنجاح`, "success");
    clearCart();
  };

  const productKeys = Object.keys(products).filter((key) => {
    const p = products[key];
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return p.name.toLowerCase().includes(q) || key.toLowerCase().includes(q);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Products Catalog Section */}
      <div className="lg:col-span-7 space-y-3">
        {/* Search Header */}
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2">
          <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass text-slate-400 absolute right-3.5 top-3 text-xs"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم السلعة أو الباركود..."
              className="w-full pr-9 pl-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-[#c5834e] transition-colors"
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer transition-colors"
            >
              مسح
            </button>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 overflow-y-auto max-h-[58vh] lg:max-h-[72vh] p-0.5">
          {productKeys.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center py-14 text-slate-400 text-xs">
              <i className="fa-solid fa-box-open text-4xl mb-2 block opacity-30"></i>
              لا توجد منتجات مطابقة لعملية البحث
            </div>
          ) : (
            productKeys.map((barcode) => {
              const prod = products[barcode];
              const isLow = prod.qty <= 3 && prod.qty > 0;
              const outOfStock = prod.qty <= 0;

              return (
                <motion.div
                  key={barcode}
                  whileHover={!outOfStock ? { scale: 1.02, y: -2 } : {}}
                  whileTap={!outOfStock ? { scale: 0.98 } : {}}
                  onClick={() => !outOfStock && addToCart(barcode)}
                  className={`p-3 rounded-2xl border transition-all text-right relative flex flex-col justify-between h-28 select-none shadow-xs ${
                    outOfStock
                      ? "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-40 cursor-not-allowed"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-[#c5834e] dark:hover:border-[#c5834e] cursor-pointer"
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug">
                      {prod.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{barcode}</p>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-[#c5834e] dark:text-[#e0a36e] font-mono">
                      {prod.price.toFixed(2)} د.ل
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                        outOfStock
                          ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20"
                          : isLow
                          ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {outOfStock ? "نفد" : `${prod.qty} بالمخزن`}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Cart & Customer Section */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col justify-between space-y-4">
        <div>
          {/* Cart Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
            <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <i className="fa-solid fa-basket-shopping text-[#c5834e]"></i> سلة التجهيز الحالية ({cart.length})
            </span>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] text-red-600 dark:text-red-400 font-bold hover:underline cursor-pointer"
              >
                مسح السلة
              </button>
            )}
          </div>

          {/* Cart items list with AnimatePresence */}
          <div className="space-y-2 overflow-y-auto max-h-[22vh] lg:max-h-[26vh] pr-0.5">
            {cart.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-8">
                <i className="fa-solid fa-cart-arrow-down text-2xl mb-1.5 block opacity-30"></i>
                السلة فارغة، اضغط على أي سلعة لإضافتها
              </div>
            ) : (
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.div
                    key={item.code}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <div className="flex-1 text-right pl-2">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {item.price.toFixed(2)} د.ل × {item.qty} ={" "}
                        <strong className="text-[#c5834e] dark:text-[#e0a36e]">
                          {(item.price * item.qty).toFixed(2)} د.ل
                        </strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => updateCartQty(item.code, item.qty - 1)}
                        className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center cursor-pointer"
                      >
                        -
                      </motion.button>
                      <span className="font-bold font-mono text-xs w-5 text-center text-slate-900 dark:text-white">
                        {item.qty}
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => updateCartQty(item.code, item.qty + 1)}
                        className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-[#c5834e]/20 hover:text-[#c5834e] text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center cursor-pointer"
                      >
                        +
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Customer & Order Metadata Form */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="اسم الزبون (اختياري)..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-[#c5834e]"
              />
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="رقم الهاتف..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-[#c5834e] font-mono text-right"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={customerArea}
                onChange={(e) => setCustomerArea(e.target.value)}
                placeholder="المنطقة أو العنوان..."
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-[#c5834e]"
              />
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-[#c5834e]"
              >
                <option value="كاش">كاش نقدي</option>
                <option value="مصراتي">خدمة مصراتي</option>
                <option value="سداد">خدمة سداد</option>
                <option value="تداول">خدمة تداول</option>
                <option value="بطاقة">بطاقة مصرفية</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">رسوم التوصيل</label>
                <input
                  type="number"
                  min="0"
                  value={deliveryFee || ""}
                  onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-[#c5834e] text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">الخصم (د.ل)</label>
                <input
                  type="number"
                  min="0"
                  value={discountAmount || ""}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-amber-600 dark:text-amber-400 rounded-xl outline-none focus:border-amber-500 text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-bold mb-1">المستلم (كاش)</label>
                <input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl outline-none focus:border-[#c5834e] text-center font-bold"
                />
              </div>
            </div>

            {payMethod === "كاش" && parsedPaid > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-3 py-2 flex justify-between items-center"
              >
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">الباقي للزبون:</span>
                <span
                  className={`text-sm font-black font-mono ${
                    change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600"
                  }`}
                >
                  {change.toFixed(2)} د.ل
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Totals & Submit */}
        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-800 text-right">
          <div className="flex justify-between text-xs font-medium text-slate-500">
            <span>إجمالي السلع:</span>
            <span className="text-slate-800 dark:text-white font-mono">{cartSubtotal.toFixed(2)} د.ل</span>
          </div>
          {Number(deliveryFee || 0) > 0 && (
            <div className="flex justify-between text-xs font-medium text-slate-500">
              <span>شحن / توصيل:</span>
              <span className="text-slate-800 dark:text-white font-mono">+{Number(deliveryFee || 0).toFixed(2)} د.ل</span>
            </div>
          )}
          {Number(discountAmount || 0) > 0 && (
            <div className="flex justify-between text-xs font-medium text-amber-600 dark:text-amber-400">
              <span>الخصم:</span>
              <span className="font-mono">-{Number(discountAmount || 0).toFixed(2)} د.ل</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800 pt-2">
            <span>صافي المطلوب:</span>
            <span className="text-[#c5834e] dark:text-[#e0a36e] text-base font-black font-mono">{cartTotal.toFixed(2)} د.ل</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmitOrder}
            className="w-full btn-brand-bronze font-bold py-3 rounded-xl shadow-lg shadow-[#c5834e]/20 text-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            <i className="fa-solid fa-circle-check"></i> تأكيد وحفظ الفاتورة
          </motion.button>
        </div>
      </div>
    </div>
  );
};
