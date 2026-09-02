import React, { useState } from "react";
import { Product, ProductsMap } from "../types";

interface InventoryManagerProps {
  products: ProductsMap;
  onAddProduct: (code: string, product: Product) => void;
  onUpdateProduct: (oldCode: string, newCode: string, product: Product) => void;
  onRestockProduct: (code: string, additionalQty: number) => void;
  onDeleteProduct: (code: string) => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  shopName?: string;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onRestockProduct,
  onDeleteProduct,
  showToast,
  shopName = "RTG-SESTEM",
}) => {
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [sortBy, setSortBy] = useState<"name" | "qty" | "price" | "cost">("name");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editProductCode, setEditProductCode] = useState<string | null>(null);
  const [restockProductCode, setRestockProductCode] = useState<string | null>(null);
  const [stickerProductCode, setStickerProductCode] = useState<string | null>(null);
  const [deleteConfirmCode, setDeleteConfirmCode] = useState<string | null>(null);

  // Quick Price Edit Modal State
  const [quickPriceCode, setQuickPriceCode] = useState<string | null>(null);
  const [quickPriceVal, setQuickPriceVal] = useState<number | "">("");
  const [quickCostVal, setQuickCostVal] = useState<number | "">("");

  // Quick Barcode Edit & Generator State
  const [quickBarcodeCode, setQuickBarcodeCode] = useState<string | null>(null);
  const [quickNewBarcode, setQuickNewBarcode] = useState<string>("");

  // Add Product Form State
  const [addName, setAddName] = useState("");
  const [addBarcode, setAddBarcode] = useState("");
  const [addCost, setAddCost] = useState<number | "">("");
  const [addPrice, setAddPrice] = useState<number | "">("");
  const [addQty, setAddQty] = useState<number | "">(1);

  // Edit Product Form State
  const [editName, setEditName] = useState("");
  const [editBarcode, setEditBarcode] = useState("");
  const [editCost, setEditCost] = useState<number | "">("");
  const [editPrice, setEditPrice] = useState<number | "">("");
  const [editQty, setEditQty] = useState<number | "">("");

  // Restock Form State
  const [restockAddedQty, setRestockAddedQty] = useState<number>(1);

  // Helper to generate unique barcode
  const generateRandomBarcode = () => {
    const prefix = "RTG";
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${randomDigits}`;
  };

  // Open Quick Price Modal
  const handleOpenQuickPrice = (code: string) => {
    const item = products[code];
    if (!item) return;
    setQuickPriceCode(code);
    setQuickPriceVal(item.price);
    setQuickCostVal(item.cost);
  };

  // Submit Quick Price
  const handleSubmitQuickPrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPriceCode) return;
    const item = products[quickPriceCode];
    if (!item) return;

    const priceNum = Number(quickPriceVal);
    const costNum = Number(quickCostVal);

    if (isNaN(priceNum) || priceNum <= 0) {
      showToast("يرجى إدخال سعر بيع صحيح", "error");
      return;
    }
    const finalCost = isNaN(costNum) || costNum < 0 ? item.cost : costNum;

    onUpdateProduct(quickPriceCode, quickPriceCode, {
      ...item,
      price: priceNum,
      cost: finalCost,
    });

    showToast(`✓ تم تحديث سعر "${item.name}" إلى ${priceNum.toFixed(2)} د.ل`, "success");
    setQuickPriceCode(null);
  };

  // Open Quick Barcode Modal
  const handleOpenQuickBarcode = (code: string) => {
    setQuickBarcodeCode(code);
    setQuickNewBarcode(code);
  };

  // Submit Quick Barcode
  const handleSubmitQuickBarcode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBarcodeCode) return;
    const item = products[quickBarcodeCode];
    if (!item) return;

    const cleanNewCode = quickNewBarcode.trim();
    if (!cleanNewCode) {
      showToast("يرجى إدخال كود باركود صالح", "error");
      return;
    }

    if (cleanNewCode !== quickBarcodeCode && products[cleanNewCode]) {
      showToast(`الباركود (${cleanNewCode}) مستخدم بالفعل لمنتج آخر!`, "error");
      return;
    }

    onUpdateProduct(quickBarcodeCode, cleanNewCode, item);
    showToast(`✓ تم تحديث كود الباركود للمنتج "${item.name}" إلى: ${cleanNewCode}`, "success");
    setQuickBarcodeCode(null);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setAddName("");
    setAddBarcode(generateRandomBarcode());
    setAddCost("");
    setAddPrice("");
    setAddQty(1);
    setIsAddModalOpen(true);
  };

  // Submit Add Product
  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = addBarcode.trim();
    const cleanName = addName.trim();
    const costNum = Number(addCost);
    const priceNum = Number(addPrice);
    const qtyNum = Number(addQty);

    if (!cleanCode) {
      showToast("يرجى إدخال أو توليد باركود للمنتج", "error");
      return;
    }
    if (!cleanName) {
      showToast("يرجى كتابة اسم المنتج", "error");
      return;
    }
    if (products[cleanCode]) {
      showToast(`الباركود (${cleanCode}) مسجل مسبقاً لمنتج آخر!`, "error");
      return;
    }
    if (isNaN(costNum) || costNum < 0) {
      showToast("يرجى إدخال سعر تكلفة صحيح", "error");
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast("يرجى إدخال سعر بيع صحيح", "error");
      return;
    }

    onAddProduct(cleanCode, {
      name: cleanName,
      cost: costNum,
      price: priceNum,
      qty: isNaN(qtyNum) ? 0 : Math.max(0, qtyNum),
    });

    showToast(`✓ تم إضافة المنتج "${cleanName}" بنجاح`, "success");
    setIsAddModalOpen(false);
  };

  // Open Edit Modal
  const handleOpenEditModal = (code: string) => {
    const item = products[code];
    if (!item) return;
    setEditProductCode(code);
    setEditBarcode(code);
    setEditName(item.name);
    setEditCost(item.cost);
    setEditPrice(item.price);
    setEditQty(item.qty);
  };

  // Submit Edit Product
  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProductCode) return;

    const cleanNewCode = editBarcode.trim();
    const cleanName = editName.trim();
    const costNum = Number(editCost);
    const priceNum = Number(editPrice);
    const qtyNum = Number(editQty);

    if (!cleanNewCode) {
      showToast("يرجى إدخال باركود صالح", "error");
      return;
    }
    if (!cleanName) {
      showToast("يرجى كتابة اسم المنتج", "error");
      return;
    }
    if (cleanNewCode !== editProductCode && products[cleanNewCode]) {
      showToast(`الباركود (${cleanNewCode}) مستخدم بالفعل لمنتج آخر!`, "error");
      return;
    }
    if (isNaN(costNum) || costNum < 0) {
      showToast("يرجى إدخال سعر تكلفة صحيح", "error");
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast("يرجى إدخال سعر بيع صحيح", "error");
      return;
    }

    onUpdateProduct(editProductCode, cleanNewCode, {
      name: cleanName,
      cost: costNum,
      price: priceNum,
      qty: isNaN(qtyNum) ? 0 : Math.max(0, qtyNum),
    });

    showToast(`✓ تم تحديث بيانات المنتج "${cleanName}" بنجاح`, "success");
    setEditProductCode(null);
  };

  // Open Restock Modal
  const handleOpenRestockModal = (code: string) => {
    setRestockProductCode(code);
    setRestockAddedQty(1);
  };

  // Submit Restock
  const handleSubmitRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProductCode) return;
    const added = Number(restockAddedQty);
    if (isNaN(added) || added <= 0) {
      showToast("يرجى إدخال كمية صحيحة للتوريد", "error");
      return;
    }

    onRestockProduct(restockProductCode, added);
    const item = products[restockProductCode];
    showToast(`✓ تم زيادة المخزون بمقدار +${added} قطعة للمنتج "${item?.name || restockProductCode}"`, "success");
    setRestockProductCode(null);
  };

  // Submit Delete
  const handleConfirmDelete = () => {
    if (!deleteConfirmCode) return;
    const item = products[deleteConfirmCode];
    onDeleteProduct(deleteConfirmCode);
    showToast(`✓ تم حذف المنتج "${item?.name || deleteConfirmCode}" من المخزون`, "success");
    setDeleteConfirmCode(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    const keys = Object.keys(products);
    if (keys.length === 0) {
      showToast("لا توجد منتجات لتصديرها", "error");
      return;
    }

    const headers = ["الباركود", "اسم المنتج", "الكمية بالمخزن", "سعر التكلفة (د.ل)", "سعر البيع (د.ل)", "إجمالي التكلفة", "إجمالي القيمة البيعية"];
    const rows = keys.map((k) => {
      const p = products[k];
      return [
        `"${k}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        p.qty,
        p.cost,
        p.price,
        (p.qty * p.cost).toFixed(2),
        (p.qty * p.price).toFixed(2),
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `جرد_مخزون_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("✓ تم تصدير ملف جرد المخزون بنجاح", "success");
  };

  // Stats Calculations
  const productEntries: [string, Product][] = Object.entries(products);
  const totalItemsCount = productEntries.length;
  let totalWholesaleValue = 0;
  let totalRetailValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  productEntries.forEach(([, p]) => {
    const qty = Number(p.qty) || 0;
    const cost = Number(p.cost) || 0;
    const price = Number(p.price) || 0;
    totalWholesaleValue += qty * cost;
    totalRetailValue += qty * price;
    if (qty === 0) outOfStockCount++;
    else if (qty <= 3) lowStockCount++;
  });

  const expectedProfit = Math.max(0, totalRetailValue - totalWholesaleValue);

  // Filtered and Sorted entries
  const filteredProducts = productEntries
    .filter(([code, p]) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterStatus === "in_stock") return p.qty > 3;
      if (filterStatus === "low_stock") return p.qty > 0 && p.qty <= 3;
      if (filterStatus === "out_of_stock") return p.qty === 0;
      return true;
    })
    .sort(([, a], [, b]) => {
      if (sortBy === "name") return a.name.localeCompare(b.name, "ar");
      if (sortBy === "qty") return b.qty - a.qty;
      if (sortBy === "price") return b.price - a.price;
      if (sortBy === "cost") return b.cost - a.cost;
      return 0;
    });

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* 4 Summary Inventory Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-right card-hover">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">إجمالي الأصناف</span>
            <div className="w-8 h-8 rounded-lg bg-[#c5834e]/15 text-[#c5834e] flex items-center justify-center text-xs">
              <i className="fa-solid fa-boxes-stacked"></i>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {totalItemsCount} <span className="text-xs font-normal text-slate-500">صنف</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
            سجل المنتجات المعرفة
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-right card-hover">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">قيمة التكلفة (الجملة)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs">
              <i className="fa-solid fa-calculator"></i>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
            {totalWholesaleValue.toFixed(2)} <span className="text-xs font-normal text-slate-500">د.ل</span>
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">
            رأس المال المقيد في البضاعة
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-right card-hover">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">القيمة البيعية المقدرة</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">
              <i className="fa-solid fa-coins"></i>
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {totalRetailValue.toFixed(2)} <span className="text-xs font-normal text-slate-500">د.ل</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            أرباح متوقعة: +{expectedProfit.toFixed(2)} د.ل
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-right card-hover">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">تنبيهات النواقص</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center text-xs">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
            {lowStockCount + outOfStockCount} <span className="text-xs font-normal text-slate-500">تنبيه</span>
          </div>
          <div className="text-[11px] text-red-600 dark:text-red-400 font-medium mt-1">
            {outOfStockCount} نافد • {lowStockCount} قارب على النفاد
          </div>
        </div>
      </div>

      {/* Main Header / Actions Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#c5834e]/15 text-[#c5834e] flex items-center justify-center text-base">
              <i className="fa-solid fa-boxes-packing"></i>
            </div>
            <div className="text-right">
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                جرد وإدارة المخزون والأسعار
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                تحكم كامل بالمنتجات، تعديل الأسعار، توليد الباركود، والمزامنة التلقائية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <i className="fa-solid fa-file-excel text-emerald-600"></i> تصدير كشف الجرد
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 text-xs font-bold bg-[#c5834e] hover:bg-[#a6632f] text-white rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <i className="fa-solid fa-plus"></i> إضافة منتج جديد
            </button>
          </div>
        </div>

        {/* Filter and Search controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
          <div className="sm:col-span-6 relative">
            <i className="fa-solid fa-magnifying-glass text-slate-400 absolute right-3 top-2.5 text-xs"></i>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بالاسم أو الباركود..."
              className="w-full pr-8 pl-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-[#c5834e] text-slate-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as "all" | "in_stock" | "low_stock" | "out_of_stock")}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-[#c5834e] text-slate-700 dark:text-slate-300"
            >
              <option value="all">جميع الحالات ({totalItemsCount})</option>
              <option value="in_stock">متوفر (&gt; 3 قطع)</option>
              <option value="low_stock">منخفض (1 - 3 قطع)</option>
              <option value="out_of_stock">نافد تماماً (0 قطعة)</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "qty" | "price" | "cost")}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-[#c5834e] text-slate-700 dark:text-slate-300"
            >
              <option value="name">ترتيب: بالاسم أبجدياً</option>
              <option value="qty">ترتيب: بالأعلى كمية</option>
              <option value="price">ترتيب: بالأعلى سعر بيع</option>
              <option value="cost">ترتيب: بالأعلى سعر تكلفة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Products Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-[11px] font-bold border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-3.5">الباركود / الكود</th>
                <th className="py-3 px-3.5">اسم السلعة / المنتج</th>
                <th className="py-3 px-3 text-center">حالة المخزون والكمية</th>
                <th className="py-3 px-3.5 text-center">سعر التكلفة (الجملة)</th>
                <th className="py-3 px-3.5 text-center">سعر البيع (القطاعي)</th>
                <th className="py-3 px-3.5 text-center">هامش الربح</th>
                <th className="py-3 px-3.5 text-center">أزرار التحكم (السعر والكود والإجراءات)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <i className="fa-solid fa-box-open text-3xl mb-2 block opacity-40"></i>
                    <p className="font-bold text-sm">لا توجد منتجات مطابقة للبحث</p>
                    <p className="text-[11px] mt-1 text-slate-500">
                      يمكنك إضافة صنف جديد بالضغط على زر "إضافة منتج جديد" بالأعلى
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(([code, p]) => {
                  const qty = Number(p.qty) || 0;
                  const cost = Number(p.cost) || 0;
                  const price = Number(p.price) || 0;
                  const profitMargin = price - cost;
                  const profitPct = cost > 0 ? ((profitMargin / cost) * 100).toFixed(0) : "100";

                  let stockBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                      <i className="fa-solid fa-circle text-[6px]"></i> متوفر ({qty} قطعة)
                    </span>
                  );
                  if (qty === 0) {
                    stockBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 animate-pulse">
                        <i className="fa-solid fa-triangle-exclamation"></i> نفد المخزون (0)
                      </span>
                    );
                  } else if (qty <= 3) {
                    stockBadge = (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                        <i className="fa-solid fa-clock"></i> قارب على النفاد ({qty})
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={code}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Barcode with Quick Generator/Editor Button */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {code}
                          </span>
                          <button
                            title="تغيير أو إنشاء كود باركود جديد للمنتج"
                            onClick={() => handleOpenQuickBarcode(code)}
                            className="text-[#c5834e] hover:text-[#a6632f] hover:bg-[#c5834e]/10 p-1 rounded text-xs cursor-pointer transition-colors"
                          >
                            <i className="fa-solid fa-wand-magic-sparkles"></i>
                          </button>
                          <button
                            title="نسخ الباركود"
                            onClick={() => {
                              navigator.clipboard.writeText(code);
                              showToast("تم نسخ الباركود", "info");
                            }}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1 cursor-pointer"
                          >
                            <i className="fa-regular fa-copy"></i>
                          </button>
                        </div>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900 dark:text-white max-w-[200px] truncate" title={p.name}>
                          {p.name}
                        </div>
                      </td>

                      {/* Stock Badge */}
                      <td className="py-3 px-3 text-center">{stockBadge}</td>

                      {/* Cost */}
                      <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                        {cost.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">د.ل</span>
                      </td>

                      {/* Price with Quick Price Edit Button */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="inline-flex items-center justify-center gap-1 font-mono font-bold text-[#c5834e] bg-[#c5834e]/5 px-2 py-1 rounded-md border border-[#c5834e]/20">
                          <span>{price.toFixed(2)}</span>
                          <span className="text-[10px] font-normal text-slate-400">د.ل</span>
                          <button
                            onClick={() => handleOpenQuickPrice(code)}
                            title="تعديل سريع لسعر هذا المنتج"
                            className="text-slate-400 hover:text-[#c5834e] hover:bg-[#c5834e]/10 p-1 rounded text-xs cursor-pointer transition-colors"
                          >
                            <i className="fa-solid fa-pen text-[10px]"></i>
                          </button>
                        </div>
                      </td>

                      {/* Margin */}
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`font-mono font-bold text-xs ${
                            profitMargin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                          }`}
                        >
                          +{profitMargin.toFixed(2)} د.ل
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          ({profitPct}%)
                        </span>
                      </td>

                      {/* Full Action Controls on the left after price */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {/* 1. Quick Price Edit */}
                          <button
                            onClick={() => handleOpenQuickPrice(code)}
                            title="تعديل سريع لسعر البيع والتكلفة"
                            className="px-2 py-1 rounded-lg text-xs font-bold bg-[#c5834e]/10 text-[#c5834e] hover:bg-[#c5834e]/20 border border-[#c5834e]/30 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <i className="fa-solid fa-tag text-[10px]"></i> السعر
                          </button>

                          {/* 2. Quick Barcode Generator / Changer */}
                          <button
                            onClick={() => handleOpenQuickBarcode(code)}
                            title="إنشاء أو تغيير كود الباركود للمنتج"
                            className="px-2 py-1 rounded-lg text-xs font-bold bg-[#c5834e] hover:bg-[#a6632f] text-white flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                          >
                            <i className="fa-solid fa-barcode text-[10px]"></i> الكود
                          </button>

                          {/* 3. Comprehensive Edit Button */}
                          <button
                            onClick={() => handleOpenEditModal(code)}
                            title="تعديل شامل لكافة تفاصيل المنتج"
                            className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <i className="fa-solid fa-pen-to-square text-[10px]"></i> شامل
                          </button>

                          {/* 4. Quick Restock (+ Quantity) */}
                          <button
                            onClick={() => handleOpenRestockModal(code)}
                            title="توريد وزيادة الكمية"
                            className="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                          >
                            <i className="fa-solid fa-plus text-[10px]"></i> توريد
                          </button>

                          {/* 5. Barcode Sticker Print */}
                          <button
                            onClick={() => setStickerProductCode(code)}
                            title="طباعة ملصق الباركود"
                            className="p-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 cursor-pointer transition-all"
                          >
                            <i className="fa-solid fa-print"></i>
                          </button>

                          {/* 6. Delete Button */}
                          <button
                            onClick={() => setDeleteConfirmCode(code)}
                            title="حذف المنتج من المخزون"
                            className="p-1.5 rounded-lg text-xs font-bold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 cursor-pointer transition-all"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================== MODAL 1: ADD PRODUCT ===================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeInUp">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 w-full max-w-md shadow-2xl text-right space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#c5834e]/15 text-[#c5834e] flex items-center justify-center text-sm">
                  <i className="fa-solid fa-box-open"></i>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">إضافة صنف / منتج جديد</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm cursor-pointer p-1"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="space-y-3">
              {/* Product Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم السلعة / المنتج *
                </label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="مثال: ذراع تحكم بلايستيشن 5 أبيض"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-[#c5834e] text-slate-900 dark:text-white"
                />
              </div>

              {/* Barcode with Auto Generator */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رمز الباركود / كود المنتج *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={addBarcode}
                    onChange={(e) => setAddBarcode(e.target.value)}
                    placeholder="امسح بالماسح أو اكتب الكود"
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-[#c5834e] text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setAddBarcode(generateRandomBarcode())}
                    className="px-3 py-2 text-xs font-bold bg-[#c5834e]/15 text-[#c5834e] hover:bg-[#c5834e]/25 rounded-lg border border-[#c5834e]/30 flex items-center gap-1 cursor-pointer transition-colors"
                    title="توليد كود تلقائي"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles"></i> توليد
                  </button>
                </div>
              </div>

              {/* Prices Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    سعر التكلفة (الجملة) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    required
                    value={addCost}
                    onChange={(e) => setAddCost(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-[#c5834e] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    سعر البيع (القطاعي) *
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    value={addPrice}
                    onChange={(e) => setAddPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-[#c5834e] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Initial Qty */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الكمية المتوفرة بالمخزن
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={addQty}
                  onChange={(e) => setAddQty(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="1"
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-[#c5834e] text-slate-900 dark:text-white"
                />
              </div>

              {/* Real-time Profit Preview */}
              {Number(addPrice) > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-2.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <span>هامش الربح المتوقع للقطعة:</span>
                  <span className="font-bold font-mono">
                    +{(Number(addPrice) - Number(addCost || 0)).toFixed(2)} د.ل
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="submit"
                  className="bg-[#c5834e] hover:bg-[#a6632f] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <i className="fa-solid fa-floppy-disk"></i> حفظ وإضافة للمخزون
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 1.1: QUICK PRICE EDIT MODAL ===================== */}
      {quickPriceCode && products[quickPriceCode] && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeInUp">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 w-full max-w-sm shadow-2xl text-right space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#c5834e]/15 text-[#c5834e] flex items-center justify-center text-sm">
                  <i className="fa-solid fa-tag"></i>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">تعديل سريع للأسعار</h3>
                  <p className="text-[10px] text-slate-400">تحديث سعر البيع والتكلفة فورياً</p>
                </div>
              </div>
              <button
                onClick={() => setQuickPriceCode(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm cursor-pointer p-1"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                {products[quickPriceCode].name}
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-mono">
                <span>الباركود:</span>
                <span className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-200 font-bold">
                  {quickPriceCode}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitQuickPrice} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  سعر البيع (القطاعي) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.05"
                    step="0.05"
                    required
                    autoFocus
                    value={quickPriceVal}
                    onChange={(e) => setQuickPriceVal(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2 text-sm font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-[#c5834e] text-slate-900 dark:text-white"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">د.ل</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  سعر التكلفة (الجملة)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="0.05"
                    value={quickCostVal}
                    onChange={(e) => setQuickCostVal(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2 text-sm font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-[#c5834e] text-slate-900 dark:text-white"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">د.ل</span>
                </div>
              </div>

              {/* Profit Preview */}
              {Number(quickPriceVal) > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-2.5 text-xs flex items-center justify-between">
                  <span className="text-emerald-800 dark:text-emerald-300 font-medium">هامش الربح المتوقع:</span>
                  <span className="font-bold font-mono text-emerald-700 dark:text-emerald-400">
                    +{(Number(quickPriceVal) - Number(quickCostVal || 0)).toFixed(2)} د.ل
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="submit"
                  className="bg-[#c5834e] hover:bg-[#a6632f] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <i className="fa-solid fa-check"></i> حفظ السعر
                </button>
                <button
                  type="button"
                  onClick={() => setQuickPriceCode(null)}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 1.2: QUICK BARCODE GENERATOR & CHANGER ===================== */}
      {quickBarcodeCode && products[quickBarcodeCode] && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeInUp">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 w-full max-w-sm shadow-2xl text-right space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#c5834e]/15 text-[#c5834e] flex items-center justify-center text-sm">
                  <i className="fa-solid fa-barcode"></i>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">تغيير وإنشاء كود الباركود</h3>
                  <p className="text-[10px] text-slate-400">توليد كود تلقائي أو تخصيص يدوي</p>
                </div>
              </div>
              <button
                onClick={() => setQuickBarcodeCode(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm cursor-pointer p-1"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                {products[quickBarcodeCode].name}
              </div>
              <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500 font-mono">
                <span>الكود الحالي:</span>
                <span className="bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-200 font-bold">
                  {quickBarcodeCode}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitQuickBarcode} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  كود الباركود الجديد *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={quickNewBarcode}
                    onChange={(e) => setQuickNewBarcode(e.target.value)}
                    placeholder="اكتب الكود أو ولده تلقائياً"
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-[#c5834e] text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setQuickNewBarcode(generateRandomBarcode())}
                    className="px-3 py-2 text-xs font-bold bg-[#c5834e]/15 text-[#c5834e] hover:bg-[#c5834e]/25 rounded-lg border border-[#c5834e]/30 flex items-center gap-1 cursor-pointer transition-colors"
                    title="توليد كود تلقائي جديد"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles"></i> توليد
                  </button>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] text-slate-400 block mb-1">معاينة رمز الباركود</span>
                <span className="font-mono text-sm font-black tracking-widest text-slate-900 dark:text-white">
                  {quickNewBarcode || "---"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="submit"
                  className="bg-[#c5834e] hover:bg-[#a6632f] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <i className="fa-solid fa-check"></i> حفظ الكود الجديد
                </button>
                <button
                  type="button"
                  onClick={() => setQuickBarcodeCode(null)}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: FULL EDIT PRODUCT ===================== */}
      {editProductCode && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeInUp">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 w-full max-w-md shadow-2xl text-right space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#c5834e]/15 text-[#c5834e] flex items-center justify-center text-sm">
                  <i className="fa-solid fa-pen-to-square"></i>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">تعديل بيانات المنتج الكاملة</h3>
                  <p className="text-[10px] text-slate-400">تعديل الاسم، الباركود، التكلفة، وسعر البيع</p>
                </div>
              </div>
              <button
                onClick={() => setEditProductCode(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm cursor-pointer p-1"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-3">
              {/* Product Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم المنتج *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-[#c5834e] text-slate-900 dark:text-white"
                />
              </div>

              {/* Barcode with Generator */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  رمز الباركود / الكود *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={editBarcode}
                    onChange={(e) => setEditBarcode(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-[#c5834e] text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setEditBarcode(generateRandomBarcode())}
                    className="px-3 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer"
                    title="توليد كود جديد"
                  >
                    <i className="fa-solid fa-wand-magic-sparkles text-[#c5834e]"></i> جديد
                  </button>
                </div>
              </div>

              {/* Price & Cost */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    سعر التكلفة (الجملة) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    required
                    value={editCost}
                    onChange={(e) => setEditCost(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-[#c5834e] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    سعر البيع (القطاعي) *
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-[#c5834e] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Current Qty */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الكمية الحالية في المخزن
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-[#c5834e] text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="submit"
                  className="bg-[#c5834e] hover:bg-[#a6632f] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <i className="fa-solid fa-check"></i> حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => setEditProductCode(null)}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 3: RESTOCK QUANTITY ===================== */}
      {restockProductCode && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeInUp">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 w-full max-w-sm shadow-2xl text-right space-y-4">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl mx-auto border border-emerald-200 dark:border-emerald-500/20">
                <i className="fa-solid fa-truck-ramp-box"></i>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">توريد وزيادة كمية المخزون</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-bold">
                  {products[restockProductCode]?.name}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitRestock} className="space-y-3">
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">الرصيد الحالي بالمخزن:</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">
                    {products[restockProductCode]?.qty || 0} قطعة
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الكمية الإضافية الموردة (+)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={restockAddedQty}
                    onChange={(e) => setRestockAddedQty(Math.max(1, Number(e.target.value)))}
                    placeholder="1"
                    className="w-full px-3 py-2 text-center text-sm font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-600 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Quick Add Buttons */}
                <div className="flex gap-1.5 pt-1">
                  {[1, 5, 10, 25, 50].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRestockAddedQty(num)}
                      className={`flex-1 text-[10px] font-bold py-1 rounded border cursor-pointer transition-all ${
                        restockAddedQty === num
                          ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40"
                          : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      +{num}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">الرصيد الجديد المتوقع:</span>
                  <span className="font-bold font-mono text-emerald-700 dark:text-emerald-400">
                    {(products[restockProductCode]?.qty || 0) + Number(restockAddedQty || 0)} قطعة
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <i className="fa-solid fa-check"></i> تأكيد التوريد
                </button>
                <button
                  type="button"
                  onClick={() => setRestockProductCode(null)}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 4: BARCODE STICKER PRINT ===================== */}
      {stickerProductCode && products[stickerProductCode] && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeInUp">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 w-full max-w-sm shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <i className="fa-solid fa-barcode text-[#c5834e]"></i> طباعة ملصق الباركود
              </h3>
              <button
                onClick={() => setStickerProductCode(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm cursor-pointer"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Sticker Graphic Container */}
            <div
              id="barcode-sticker-print-area"
              className="bg-white text-black p-4 rounded-xl border-2 border-dashed border-slate-300 shadow-sm space-y-2 mx-auto"
            >
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                {shopName}
              </div>
              <div className="text-xs font-bold line-clamp-2 px-1">
                {products[stickerProductCode].name}
              </div>

              {/* Barcode Visual Bars */}
              <div className="py-1">
                <svg className="w-full h-12 mx-auto" viewBox="0 0 200 50">
                  {/* Visual barcode lines simulation */}
                  <rect x="10" y="5" width="4" height="40" fill="#000" />
                  <rect x="18" y="5" width="2" height="40" fill="#000" />
                  <rect x="24" y="5" width="6" height="40" fill="#000" />
                  <rect x="34" y="5" width="2" height="40" fill="#000" />
                  <rect x="40" y="5" width="4" height="40" fill="#000" />
                  <rect x="48" y="5" width="8" height="40" fill="#000" />
                  <rect x="60" y="5" width="2" height="40" fill="#000" />
                  <rect x="66" y="5" width="4" height="40" fill="#000" />
                  <rect x="74" y="5" width="6" height="40" fill="#000" />
                  <rect x="84" y="5" width="2" height="40" fill="#000" />
                  <rect x="90" y="5" width="6" height="40" fill="#000" />
                  <rect x="100" y="5" width="4" height="40" fill="#000" />
                  <rect x="108" y="5" width="2" height="40" fill="#000" />
                  <rect x="114" y="5" width="8" height="40" fill="#000" />
                  <rect x="126" y="5" width="4" height="40" fill="#000" />
                  <rect x="134" y="5" width="2" height="40" fill="#000" />
                  <rect x="140" y="5" width="6" height="40" fill="#000" />
                  <rect x="150" y="5" width="4" height="40" fill="#000" />
                  <rect x="158" y="5" width="2" height="40" fill="#000" />
                  <rect x="164" y="5" width="6" height="40" fill="#000" />
                  <rect x="174" y="5" width="4" height="40" fill="#000" />
                  <rect x="182" y="5" width="2" height="40" fill="#000" />
                </svg>
                <span className="font-mono text-xs font-black tracking-widest block text-black mt-0.5">
                  {stickerProductCode}
                </span>
              </div>

              <div className="text-base font-black font-mono border-t border-slate-200 pt-1.5 text-black">
                {products[stickerProductCode].price.toFixed(2)} د.ل
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  window.print();
                }}
                className="bg-[#c5834e] hover:bg-[#a6632f] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <i className="fa-solid fa-print"></i> طباعة الملصق
              </button>
              <button
                onClick={() => setStickerProductCode(null)}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 5: DELETE CONFIRMATION ===================== */}
      {deleteConfirmCode && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeInUp">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 w-full max-w-sm shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center text-xl mx-auto border border-red-200 dark:border-red-500/20">
              <i className="fa-solid fa-trash"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">هل أنت متأكد من حذف المنتج؟</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                سيتم إزالة <strong className="text-slate-900 dark:text-white">"{products[deleteConfirmCode]?.name}"</strong> ({deleteConfirmCode}) من قائمة المخزون.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <i className="fa-solid fa-trash"></i> نعم، تأكيد الحذف
              </button>
              <button
                onClick={() => setDeleteConfirmCode(null)}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold py-2.5 rounded-xl text-xs cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
