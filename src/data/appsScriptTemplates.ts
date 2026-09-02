// Apps Script Code Templates & Instructions for RTG-SESTEM
// Note: Words referencing "Google Sheet" are not displayed in public UI;
// In UI, it is presented as "الخادم السحابي الذكي" & "محرك المزامنة السحابية".

export const MASTER_SUBSCRIPTIONS_SCRIPT_CODE = `/**
 * ====================================================================
 * منظومة RTG-SESTEM — كود الخادم المركزي للمشتركين والتراخيص
 * النسخة: 3.0 (Full Two-Way Sync & CRUD)
 * ====================================================================
 * 
 * طريقة الاستخدام:
 * 1. افتح جدول المشتركين (ملف 1) في حسابك.
 * 2. من القائمة العلوية: الإضافات (Extensions) -> Apps Script.
 * 3. احذف أي كود موجود، والصق هذا الكود كاملاً، ثم اضغط حفظ (Save).
 * 4. من القائمة العلوية اختر الدالة setupMasterSheet واضغط "تشغيل (Run)" لإنشاء وتنسيق صفحة "المشتركون" تلقائياً.
 * 5. اضغط "نشر (Deploy)" -> "نشر جديد (New deployment)".
 * 6. اضغط على الترس واختر "تطبيق ويب (Web app)".
 *    - الوصف: RTG Master Server v3
 *    - تنفيذ كـ (Execute as): أنا (Me)
 *    - مَن يملك حق الوصول (Who has access): أي شخص (Anyone)  [ضروري جداً]
 * 7. اضغط Deploy وانسخ الرابط الناتج وضعه في خانة "رابط الخادم المركزي" بلوحة الأدمن.
 */

function doGet(e) {
  try {
    var params = e.parameter || {};
    var action = params.action || "checkLicense";
    var callback = params.callback;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("المشتركون");
    if (!sheet) {
      sheet = ss.getSheets()[0];
    }

    var data = sheet.getDataRange().getValues();

    // 1. التحقق من ترخيص المتجر
    if (action === "checkLicense") {
      var key = (params.key || "").toString().trim().toUpperCase();
      var username = (params.username || params.email || "").toString().trim().toLowerCase();
      var password = (params.password || "").toString().trim();

      var foundStore = null;

      for (var i = 1; i < data.length; i++) {
        var rowCode = (data[i][0] || "").toString().trim().toUpperCase();
        var rowUser = (data[i][1] || "").toString().trim().toLowerCase();
        var rowPass = (data[i][2] || "").toString().trim();

        var matchByKey = (key && rowCode === key);
        var matchByCreds = (username && rowUser === username && (!password || rowPass === password));

        if (matchByKey || matchByCreds) {
          foundStore = {
            storeCode: data[i][0],
            username: data[i][1],
            storeName: data[i][3] || "متجر RTG-SESTEM",
            phone: data[i][4],
            cloudUrl: data[i][5] || "",
            startDate: formatDate(data[i][6]),
            endDate: formatDate(data[i][7]),
            plan: data[i][8] || "شهري",
            status: data[i][9] || "نشط",
            notes: data[i][10] || ""
          };
          break;
        }
      }

      var result = {};
      if (!foundStore) {
        result = {
          valid: false,
          message: "بيانات الدخول أو كود الترخيص غير مسجلة بالنظام!"
        };
      } else {
        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var endD = new Date(foundStore.endDate);
        endD.setHours(23, 59, 59, 999);

        var diffTime = endD.getTime() - today.getTime();
        var daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (foundStore.status === "معلق" || foundStore.status === "ملغى") {
          result = {
            valid: false,
            message: "تم إيقاف حساب هذا المتجر مؤقتاً. يرجى التواصل مع الإدارة للتفعيل."
          };
        } else if (daysRemaining < 0) {
          result = {
            valid: false,
            expired: true,
            endDate: foundStore.endDate,
            message: "انتهت فترة اشتراك متجرك في (" + foundStore.endDate + "). يرجى تجديد الاشتراك للمتابعة."
          };
        } else {
          result = {
            valid: true,
            storeCode: foundStore.storeCode,
            storeName: foundStore.storeName,
            cloudUrl: foundStore.cloudUrl,
            scriptUrl: foundStore.cloudUrl,
            endDate: foundStore.endDate,
            daysRemaining: daysRemaining,
            plan: foundStore.plan,
            message: "تم التحقق من الترخيص بنجاح ✓"
          };
        }
      }

      return respondOutput(result, callback);
    }

    // 2. جلب جميع المشتركين للأدمن
    if (action === "getAllStores") {
      var stores = [];
      for (var j = 1; j < data.length; j++) {
        if (data[j][0]) {
          stores.push({
            id: "STORE-" + j,
            storeCode: data[j][0].toString(),
            username: data[j][1] ? data[j][1].toString() : "",
            password: data[j][2] ? data[j][2].toString() : "",
            storeName: data[j][3] ? data[j][3].toString() : "",
            phone: data[j][4] ? data[j][4].toString() : "",
            cloudUrl: data[j][5] ? data[j][5].toString() : "",
            startDate: formatDate(data[j][6]),
            endDate: formatDate(data[j][7]),
            plan: data[j][8] ? data[j][8].toString() : "شهري",
            status: data[j][9] ? data[j][9].toString() : "نشط",
            notes: data[j][10] ? data[j][10].toString() : ""
          });
        }
      }
      return respondOutput({ success: true, stores: stores }, callback);
    }

    // 3. حذف متجر من المشتركين (GET fallback)
    if (action === "deleteStore") {
      var codeToDelete = (params.storeCode || "").toString().trim().toUpperCase();
      if (codeToDelete) {
        for (var dIdx = 1; dIdx < data.length; dIdx++) {
          if (data[dIdx][0] && data[dIdx][0].toString().trim().toUpperCase() === codeToDelete) {
            sheet.deleteRow(dIdx + 1);
            return respondOutput({ success: true, message: "تم حذف المشترك بنجاح" }, callback);
          }
        }
      }
      return respondOutput({ success: false, message: "لم يتم العثور على المتجر" }, callback);
    }

    return respondOutput({ status: "online", system: "RTG-SESTEM Master Server v3" }, callback);

  } catch (err) {
    return respondOutput({ error: err.toString() }, e.parameter ? e.parameter.callback : null);
  }
}

function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : "{}";
    var payload = JSON.parse(rawData);
    var action = payload.action;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("المشتركون");
    if (!sheet) sheet = ss.getSheets()[0];

    var data = sheet.getDataRange().getValues();

    // إضافة أو تعديل بيانات متجر
    if (action === "addOrUpdateStore") {
      var storeCode = (payload.storeCode || "").toString().trim().toUpperCase();
      var foundRow = -1;

      for (var i = 1; i < data.length; i++) {
        if (data[i][0] && data[i][0].toString().trim().toUpperCase() === storeCode) {
          foundRow = i + 1;
          break;
        }
      }

      var rowValues = [
        payload.storeCode || "",
        payload.username || "",
        payload.password || "",
        payload.storeName || "",
        payload.phone || "",
        payload.cloudUrl || "",
        payload.startDate || "",
        payload.endDate || "",
        payload.plan || "شهري",
        payload.status || "نشط",
        payload.notes || ""
      ];

      if (foundRow > 0) {
        sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
      } else {
        sheet.appendRow(rowValues);
      }

      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "تم حفظ بيانات المتجر بنجاح" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // حذف مشترك
    if (action === "deleteStore") {
      var sCode = (payload.storeCode || "").toString().trim().toUpperCase();
      var deleted = false;
      for (var r = 1; r < data.length; r++) {
        if (data[r][0] && data[r][0].toString().trim().toUpperCase() === sCode) {
          sheet.deleteRow(r + 1);
          deleted = true;
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: deleted }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function formatDate(val) {
  if (!val) return "";
  if (val instanceof Date) {
    var y = val.getFullYear();
    var m = ("0" + (val.getMonth() + 1)).slice(-2);
    var d = ("0" + val.getDate()).slice(-2);
    return y + "-" + m + "-" + d;
  }
  return val.toString();
}

function respondOutput(obj, callback) {
  var json = JSON.stringify(obj);
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + json + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * دالة التهيئة التلقائية للملف 1 (المشتركون والتراخيص)
 * اضغط "تشغيل (Run)" لهذه الدالة لتجهيز الجدول والأعمدة فوراً
 */
function setupMasterSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("المشتركون");
  if (!sheet) {
    sheet = ss.insertSheet("المشتركون");
  }

  // حذف أوراق العمل الفارغة غير المطلوبة
  var allSheets = ss.getSheets();
  for (var i = 0; i < allSheets.length; i++) {
    if (allSheets[i].getName() !== "المشتركون" && allSheets.length > 1) {
      try { ss.deleteSheet(allSheets[i]); } catch (e) {}
    }
  }

  var headers = [
    "كود المتجر",
    "اسم المستخدم",
    "كلمة المرور",
    "اسم المتجر",
    "رقم الهاتف",
    "رابط الخادم الخاص",
    "تاريخ البدء",
    "تاريخ الانتهاء",
    "الباقة",
    "الحالة",
    "ملاحظات"
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // تنسيق الشريط العلوي بلون مميز
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#1e293b");
  headerRange.setFontColor("#f8fafc");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);

  // ضبط عرض الأعمدة
  sheet.setColumnWidth(1, 130); // كود
  sheet.setColumnWidth(2, 140); // يوزر
  sheet.setColumnWidth(3, 110); // كلمة المرور
  sheet.setColumnWidth(4, 180); // اسم المتجر
  sheet.setColumnWidth(5, 130); // الهاتف
  sheet.setColumnWidth(6, 250); // الرابط
  sheet.setColumnWidth(7, 120); // البدء
  sheet.setColumnWidth(8, 120); // الانتهاء
  sheet.setColumnWidth(9, 100); // الباقة
  sheet.setColumnWidth(10, 100); // الحالة
  sheet.setColumnWidth(11, 200); // ملاحظات

  SpreadsheetApp.flush();
  Logger.log("✓ تم تهيئة جدول المشتركين بنجاح!");
}
`;

export const STORE_ENGINE_SCRIPT_CODE = `/**
 * ====================================================================
 * منظومة RTG-SESTEM — كود محرك المتجر (المنتجات، الفواتير، الديون)
 * النسخة: 3.0 (Full CRUD, Stock Control & Sync)
 * ====================================================================
 * 
 * طريقة الاستخدام:
 * 1. افتح جدول متجرك (ملف 2 أو ملف كل مشترك).
 * 2. من القائمة: الإضافات (Extensions) -> Apps Script.
 * 3. احذف أي كود والصق هذا الكود كاملاً، ثم اضغط حفظ (Save).
 * 4. من القائمة العلوية اختر الدالة setupStoreSheets واضغط "تشغيل (Run)"
 *    ليتم تلقائياً إنشاء وتنسيق الصفحات الثلاث: [المنتجات] و [الفواتير] و [الديون].
 * 5. اضغط "نشر (Deploy)" -> "نشر جديد (New deployment)".
 * 6. اختر "تطبيق ويب (Web app)".
 *    - الوصف: RTG Store Engine v3
 *    - تنفيذ كـ (Execute as): أنا (Me)
 *    - مَن يملك حق الوصول (Who has access): أي شخص (Anyone)  [ضروري جداً]
 * 7. اضغط Deploy وانسخ الرابط الناتج وضعه في خانة "رابط الخادم الخاص" للمتجر.
 */

function doGet(e) {
  try {
    var params = e.parameter || {};
    var action = params.action || "getStoreData";
    var callback = params.callback;

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. جلب كامل بيانات المتجر للمنظومة
    if (action === "getStoreData") {
      // أ. قراءة المنتجات
      var prodSheet = ss.getSheetByName("المنتجات");
      var products = {};
      if (prodSheet && prodSheet.getLastRow() > 1) {
        var prodData = prodSheet.getDataRange().getValues();
        for (var p = 1; p < prodData.length; p++) {
          var barcode = (prodData[p][0] || "").toString().trim();
          if (barcode) {
            products[barcode] = {
              name: prodData[p][1] ? prodData[p][1].toString() : "منتج",
              qty: Number(prodData[p][2]) || 0,
              cost: Number(prodData[p][3]) || 0,
              price: Number(prodData[p][4]) || 0
            };
          }
        }
      }

      // ب. قراءة الفواتير
      var orderSheet = ss.getSheetByName("الفواتير");
      var orders = [];
      if (orderSheet && orderSheet.getLastRow() > 1) {
        var ordData = orderSheet.getDataRange().getValues();
        for (var o = 1; o < ordData.length; o++) {
          var invId = (ordData[o][0] || "").toString().trim();
          if (invId) {
            orders.push({
              id: invId,
              date: ordData[o][1] ? ordData[o][1].toString() : "",
              desc: ordData[o][2] ? ordData[o][2].toString() : "",
              total: Number(ordData[o][3]) || 0,
              profit: Number(ordData[o][4]) || 0,
              method: ordData[o][5] ? ordData[o][5].toString() : "كاش",
              delivery: Number(ordData[o][6]) || 0,
              discount: Number(ordData[o][7]) || 0,
              status: ordData[o][8] ? ordData[o][8].toString() : "تم التوصيل",
              cName: ordData[o][9] ? ordData[o][9].toString() : "",
              cPhone: ordData[o][10] ? ordData[o][10].toString() : "",
              cBackup: ordData[o][11] ? ordData[o][11].toString() : "",
              cArea: ordData[o][12] ? ordData[o][12].toString() : ""
            });
          }
        }
      }

      // ج. قراءة الديون
      var debtSheet = ss.getSheetByName("الديون");
      var debts = [];
      if (debtSheet && debtSheet.getLastRow() > 1) {
        var debtData = debtSheet.getDataRange().getValues();
        for (var d = 1; d < debtData.length; d++) {
          var debtId = (debtData[d][0] || "").toString().trim();
          if (debtId) {
            debts.push({
              id: debtId,
              date: debtData[d][1] ? debtData[d][1].toString() : "",
              type: debtData[d][2] ? debtData[d][2].toString() : "لي",
              name: debtData[d][3] ? debtData[d][3].toString() : "",
              phone: debtData[d][4] ? debtData[d][4].toString() : "",
              original: Number(debtData[d][5]) || 0,
              paid: Number(debtData[d][6]) || 0,
              remaining: Number(debtData[d][7]) || 0,
              dueDate: debtData[d][8] ? debtData[d][8].toString() : "",
              status: debtData[d][9] ? debtData[d][9].toString() : "مفتوح",
              note: debtData[d][10] ? debtData[d][10].toString() : "",
              updatedAt: debtData[d][11] ? debtData[d][11].toString() : ""
            });
          }
        }
      }

      var result = {
        success: true,
        products: products,
        orders: orders,
        debts: debts,
        syncedAt: new Date().toISOString()
      };

      return respondOutput(result, callback);
    }

    // حذف منتج عبر GET
    if (action === "deleteProduct") {
      var bCode = (params.barcode || "").toString().trim();
      var pSheet = ss.getSheetByName("المنتجات");
      if (pSheet && bCode) {
        var pData = pSheet.getDataRange().getValues();
        for (var pi = 1; pi < pData.length; pi++) {
          if (pData[pi][0] && pData[pi][0].toString().trim() === bCode) {
            pSheet.deleteRow(pi + 1);
            return respondOutput({ success: true, message: "تم حذف المنتج بنجاح" }, callback);
          }
        }
      }
      return respondOutput({ success: false, message: "لم يتم العثور على المنتج" }, callback);
    }

    return respondOutput({ status: "online", store: ss.getName() }, callback);

  } catch (err) {
    return respondOutput({ error: err.toString() }, e.parameter ? e.parameter.callback : null);
  }
}

function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : "{}";
    var payload = JSON.parse(rawData);
    var action = payload.action;

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. إضافة فاتورة وخصم المخزون تلقائياً
    if (action === "addOrder") {
      var ordSheet = ss.getSheetByName("الفواتير");
      if (!ordSheet) ordSheet = ss.insertSheet("الفواتير");

      var row = [
        payload.invoiceId || ("INV-" + Date.now().toString().slice(-6)),
        payload.date || new Date().toLocaleString("ar-LY"),
        payload.productsList || payload.desc || "",
        Number(payload.totalSales || payload.total) || 0,
        Number(payload.netProfit || payload.profit) || 0,
        payload.method || "كاش",
        Number(payload.deliveryFee || payload.delivery) || 0,
        Number(payload.discount) || 0,
        payload.orderStatus || payload.status || "تم التوصيل",
        payload.customerName || payload.cName || "",
        payload.customerPhone || payload.cPhone || "",
        payload.customerBackupPhone || payload.cBackup || "",
        payload.customerArea || payload.cArea || ""
      ];

      ordSheet.appendRow(row);

      // خصم الكميات المباعة من صفحة المنتجات فوراً
      if (payload.cartItems && Array.isArray(payload.cartItems)) {
        var prodSheet = ss.getSheetByName("المنتجات");
        if (prodSheet && prodSheet.getLastRow() > 1) {
          var pData = prodSheet.getDataRange().getValues();
          for (var itemIdx = 0; itemIdx < payload.cartItems.length; itemIdx++) {
            var item = payload.cartItems[itemIdx];
            for (var r = 1; r < pData.length; r++) {
              if (pData[r][0] && pData[r][0].toString().trim() === item.code.toString().trim()) {
                var currentQty = Number(pData[r][2]) || 0;
                var updatedQty = Math.max(0, currentQty - Number(item.qty || 1));
                prodSheet.getRange(r + 1, 3).setValue(updatedQty);
                prodSheet.getRange(r + 1, 6).setValue(new Date().toLocaleString("ar-LY"));
                break;
              }
            }
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "تم تسجيل الفاتورة وتحديث المخزون بنجاح" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. إرجاع فاتورة وإعادة الكميات للمخزون
    if (action === "refundOrder") {
      var ordSheetRefund = ss.getSheetByName("الفواتير");
      if (ordSheetRefund && ordSheetRefund.getLastRow() > 1) {
        var oRows = ordSheetRefund.getDataRange().getValues();
        for (var oi = 1; oi < oRows.length; oi++) {
          if (oRows[oi][0] && oRows[oi][0].toString().trim() === payload.invoiceId.toString().trim()) {
            ordSheetRefund.getRange(oi + 1, 9).setValue("مرتجع");
            break;
          }
        }
      }

      // إعادة الكميات إلى صفحة المنتجات إن وجدت
      if (payload.items && Array.isArray(payload.items)) {
        var pSheetRef = ss.getSheetByName("المنتجات");
        if (pSheetRef && pSheetRef.getLastRow() > 1) {
          var pRowsRef = pSheetRef.getDataRange().getValues();
          for (var it = 0; it < payload.items.length; it++) {
            var itm = payload.items[it];
            for (var pr = 1; pr < pRowsRef.length; pr++) {
              if (pRowsRef[pr][0] && pRowsRef[pr][0].toString().trim() === itm.code.toString().trim()) {
                var curQ = Number(pRowsRef[pr][2]) || 0;
                pSheetRef.getRange(pr + 1, 3).setValue(curQ + Number(itm.qty || 1));
                break;
              }
            }
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "تم إرجاع الفاتورة وإعادة المخزون" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. تحديث حالة الفاتورة
    if (action === "updateStatus") {
      var ordSheet2 = ss.getSheetByName("الفواتير");
      if (ordSheet2 && ordSheet2.getLastRow() > 1) {
        var oData = ordSheet2.getDataRange().getValues();
        for (var i = 1; i < oData.length; i++) {
          if (oData[i][0] && oData[i][0].toString().trim() === payload.invoiceId.toString().trim()) {
            ordSheet2.getRange(i + 1, 9).setValue(payload.status);
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. حذف فاتورة
    if (action === "deleteOrder") {
      var ordSheetDel = ss.getSheetByName("الفواتير");
      if (ordSheetDel && ordSheetDel.getLastRow() > 1) {
        var odRows = ordSheetDel.getDataRange().getValues();
        for (var od = 1; od < odRows.length; od++) {
          if (odRows[od][0] && odRows[od][0].toString().trim() === payload.invoiceId.toString().trim()) {
            ordSheetDel.deleteRow(od + 1);
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    // 5. إضافة أو تحديث منتج بالمخزن
    if (action === "addProduct" || action === "updateProduct") {
      var pSheet = ss.getSheetByName("المنتجات");
      if (!pSheet) pSheet = ss.insertSheet("المنتجات");

      var barcode = payload.barcode || payload.oldBarcode;
      var pRows = pSheet.getDataRange().getValues();
      var foundRow = -1;

      for (var pr = 1; pr < pRows.length; pr++) {
        if (pRows[pr][0] && pRows[pr][0].toString().trim() === barcode.toString().trim()) {
          foundRow = pr + 1;
          break;
        }
      }

      var pRowVals = [
        payload.barcode || barcode,
        payload.name || "",
        Number(payload.qty) || 0,
        Number(payload.cost) || 0,
        Number(payload.price) || 0,
        new Date().toLocaleString("ar-LY")
      ];

      if (foundRow > 0) {
        pSheet.getRange(foundRow, 1, 1, pRowVals.length).setValues([pRowVals]);
      } else {
        pSheet.appendRow(pRowVals);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    // 6. حذف منتج من المخزن
    if (action === "deleteProduct") {
      var pSheetDel = ss.getSheetByName("المنتجات");
      if (pSheetDel && pSheetDel.getLastRow() > 1) {
        var pDataDel = pSheetDel.getDataRange().getValues();
        for (var pdi = 1; pdi < pDataDel.length; pdi++) {
          if (pDataDel[pdi][0] && pDataDel[pdi][0].toString().trim() === payload.barcode.toString().trim()) {
            pSheetDel.deleteRow(pdi + 1);
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    // 7. تحديث سعر منتج
    if (action === "updatePrice") {
      var pSheet2 = ss.getSheetByName("المنتجات");
      if (pSheet2 && pSheet2.getLastRow() > 1) {
        var pData2 = pSheet2.getDataRange().getValues();
        for (var pr2 = 1; pr2 < pData2.length; pr2++) {
          if (pData2[pr2][0] && pData2[pr2][0].toString().trim() === payload.barcode.toString().trim()) {
            pSheet2.getRange(pr2 + 1, 5).setValue(Number(payload.newPrice));
            pSheet2.getRange(pr2 + 1, 6).setValue(new Date().toLocaleString("ar-LY"));
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    // 8. توريد وتزويد كمية منتج
    if (action === "restockProduct") {
      var pSheet3 = ss.getSheetByName("المنتجات");
      if (pSheet3 && pSheet3.getLastRow() > 1) {
        var pData3 = pSheet3.getDataRange().getValues();
        for (var pr3 = 1; pr3 < pData3.length; pr3++) {
          if (pData3[pr3][0] && pData3[pr3][0].toString().trim() === payload.barcode.toString().trim()) {
            var curr = Number(pData3[pr3][2]) || 0;
            pSheet3.getRange(pr3 + 1, 3).setValue(curr + Number(payload.addedQty || 0));
            pSheet3.getRange(pr3 + 1, 6).setValue(new Date().toLocaleString("ar-LY"));
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    // 9. إضافة أو تحديث دين
    if (action === "addOrUpdateDebt") {
      var dSheet = ss.getSheetByName("الديون");
      if (!dSheet) dSheet = ss.insertSheet("الديون");

      var dRows = dSheet.getDataRange().getValues();
      var debtRowIdx = -1;
      var debtId = payload.id;

      for (var dr = 1; dr < dRows.length; dr++) {
        if (dRows[dr][0] && dRows[dr][0].toString().trim() === debtId.toString().trim()) {
          debtRowIdx = dr + 1;
          break;
        }
      }

      var dRowVals = [
        payload.id || ("DEBT-" + Date.now().toString().slice(-5)),
        payload.date || new Date().toLocaleDateString("ar-LY"),
        payload.type || "لي",
        payload.name || "",
        payload.phone || "",
        Number(payload.original) || 0,
        Number(payload.paid) || 0,
        Number(payload.remaining) || 0,
        payload.dueDate || "",
        payload.status || "مفتوح",
        payload.note || "",
        payload.updatedAt || new Date().toLocaleString("ar-LY")
      ];

      if (debtRowIdx > 0) {
        dSheet.getRange(debtRowIdx, 1, 1, dRowVals.length).setValues([dRowVals]);
      } else {
        dSheet.appendRow(dRowVals);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    // 10. حذف دين
    if (action === "deleteDebt") {
      var dSheetDel = ss.getSheetByName("الديون");
      if (dSheetDel && dSheetDel.getLastRow() > 1) {
        var dRowsDel = dSheetDel.getDataRange().getValues();
        for (var dri = 1; dri < dRowsDel.length; dri++) {
          if (dRowsDel[dri][0] && dRowsDel[dri][0].toString().trim() === payload.id.toString().trim()) {
            dSheetDel.deleteRow(dri + 1);
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, info: "Unhandled action" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function respondOutput(obj, callback) {
  var json = JSON.stringify(obj);
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + json + ")")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * دالة التهيئة التلقائية للملف 2 (قالب المتجر: المنتجات، الفواتير، الديون)
 * اضغط "تشغيل (Run)" لهذه الدالة لتجهيز وإنشاء الصفحات الثلاث وأعمدتها تلقائياً
 */
function setupStoreSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. ورقة المنتجات
  var prodSheet = ss.getSheetByName("المنتجات");
  if (!prodSheet) prodSheet = ss.insertSheet("المنتجات");
  var prodHeaders = ["الباركود", "اسم المنتج", "الكمية", "سعر التكلفة", "سعر البيع", "تاريخ التحديث"];
  prodSheet.getRange(1, 1, 1, prodHeaders.length).setValues([prodHeaders]);
  var pHRange = prodSheet.getRange(1, 1, 1, prodHeaders.length);
  pHRange.setBackground("#1e293b").setFontColor("#f8fafc").setFontWeight("bold").setHorizontalAlignment("center");
  prodSheet.setFrozenRows(1);
  prodSheet.setColumnWidth(1, 150);
  prodSheet.setColumnWidth(2, 220);
  prodSheet.setColumnWidth(3, 90);
  prodSheet.setColumnWidth(4, 110);
  prodSheet.setColumnWidth(5, 110);
  prodSheet.setColumnWidth(6, 170);

  // 2. ورقة الفواتير
  var ordSheet = ss.getSheetByName("الفواتير");
  if (!ordSheet) ordSheet = ss.insertSheet("الفواتير");
  var ordHeaders = [
    "رقم الفاتورة",
    "التاريخ والوقت",
    "تفاصيل المنتجات",
    "إجمالي المبيعات",
    "صافي الأرباح",
    "طريقة الدفع",
    "التوصيل",
    "الخصم",
    "الحالة",
    "اسم الزبون",
    "رقم الهاتف",
    "هاتف احتياطي",
    "المنطقة / العنوان"
  ];
  ordSheet.getRange(1, 1, 1, ordHeaders.length).setValues([ordHeaders]);
  var oHRange = ordSheet.getRange(1, 1, 1, ordHeaders.length);
  oHRange.setBackground("#1e293b").setFontColor("#f8fafc").setFontWeight("bold").setHorizontalAlignment("center");
  ordSheet.setFrozenRows(1);
  ordSheet.setColumnWidth(1, 130);
  ordSheet.setColumnWidth(2, 160);
  ordSheet.setColumnWidth(3, 260);
  ordSheet.setColumnWidth(4, 120);
  ordSheet.setColumnWidth(5, 120);
  ordSheet.setColumnWidth(6, 110);
  ordSheet.setColumnWidth(7, 90);
  ordSheet.setColumnWidth(8, 90);
  ordSheet.setColumnWidth(9, 120);
  ordSheet.setColumnWidth(10, 150);
  ordSheet.setColumnWidth(11, 130);
  ordSheet.setColumnWidth(12, 130);
  ordSheet.setColumnWidth(13, 180);

  // 3. ورقة الديون
  var debtSheet = ss.getSheetByName("الديون");
  if (!debtSheet) debtSheet = ss.insertSheet("الديون");
  var debtHeaders = [
    "رقم الدين",
    "التاريخ",
    "النوع",
    "الاسم",
    "الهاتف",
    "المبلغ الأصلي",
    "المدفوع",
    "المتبقي",
    "تاريخ الاستحقاق",
    "الحالة",
    "ملاحظات",
    "آخر تحديث"
  ];
  debtSheet.getRange(1, 1, 1, debtHeaders.length).setValues([debtHeaders]);
  var dHRange = debtSheet.getRange(1, 1, 1, debtHeaders.length);
  dHRange.setBackground("#1e293b").setFontColor("#f8fafc").setFontWeight("bold").setHorizontalAlignment("center");
  debtSheet.setFrozenRows(1);
  debtSheet.setColumnWidth(1, 120);
  debtSheet.setColumnWidth(2, 120);
  debtSheet.setColumnWidth(3, 80);
  debtSheet.setColumnWidth(4, 160);
  debtSheet.setColumnWidth(5, 130);
  debtSheet.setColumnWidth(6, 110);
  debtSheet.setColumnWidth(7, 110);
  debtSheet.setColumnWidth(8, 110);
  debtSheet.setColumnWidth(9, 130);
  debtSheet.setColumnWidth(10, 100);
  debtSheet.setColumnWidth(11, 200);
  debtSheet.setColumnWidth(12, 170);

  SpreadsheetApp.flush();
  Logger.log("✓ تم تهيئة صفحات المتجر الثلاث (المنتجات، الفواتير، الديون) بنجاح!");
}
`;
