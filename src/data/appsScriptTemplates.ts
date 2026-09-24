// Apps Script Code Templates & Instructions for RTG-SESTEM
// Note: Words referencing "Google Sheet" are not displayed in public UI;
// In UI, it is presented as "الخادم السحابي الذكي" & "محرك المزامنة السحابية".

export const MASTER_SUBSCRIPTIONS_SCRIPT_CODE = `/**
 * ====================================================================
 * منظومة RTG-SYSTEM — كود الخادم المركزي للمشتركين والتراخيص والإعدادات
 * النسخة: 4.5 (Two-Tier Auth, Auto-Setup Menu, & Official RTG Theme)
 * ====================================================================
 * 
 * الميزات المتقدمة المدمجة:
 * 1. زر وقائمة [⚙️ منظومة RTG] في أعلى شيت الخادم المركزي للتهيئة بنقرة واحدة.
 * 2. التحقق الذكي المزدوج (Two-Tier Authentication):
 *    - إذا كانت كلمة المرور للمالك: يسجل الدخول كـ (Admin) بكامل الصلاحيات.
 *    - إذا كانت كلمة المرور لموظف: ينتقل الخادم المركزي تلقائياً لفحص ورقة [Users]
 *      في رابط الخادم الخاص بالمتجر، ويدخل الموظف بصلاحياته المحددة واسم وظيفته!
 * 3. تطبيق هوية وألوان RTG الرسمية (#c5834e و #1e293b و #a6632f) تلقائياً لكافة الأوراق.
 * 
 * الأوراق (الصفحات) التي يديرها هذا السكربت تلقائياً داخل جدول جوجل:
 * 1. [المشتركون]: لحفظ وتحديث كافة المتاجر، الحسابات، كلمات المرور، والتراخيص.
 * 2. [الإعدادات وبيانات المنظومة]: لحفظ رابط الخادم السحابي، كلمة سر الماستر أدمن، وكود النظام.
 * 3. [باقات وأسعار الاشتراكات]: لحفظ وتعديل أسعار وباقات الاشتراكات (1 شهر، 3 أشهر، 6 أشهر، سنوي...).
 * 4. [التواصل_الاجتماعي]: لحفظ روابط وسائل التواصل والدعم الفني.
 * 
 * طريقة التثبيت السريعة:
 * 1. افتح جدول بيانات جوجل جديد أو جدول المشتركين الحالي.
 * 2. من القائمة: الإضافات (Extensions) -> Apps Script.
 * 3. احذف أي كود والصق هذا الكود كاملاً، ثم اضغط حفظ (Save).
 * 4. من شريط الأدوات العلوي في الشيت ستجد قائمة [⚙️ منظومة RTG] -> اضغط "تهيئة صفحات وألوان الخادم المركزي (نقرة واحدة)".
 * 5. اضغط "نشر (Deploy)" -> "نشر جديد (New deployment)".
 * 6. اختر "تطبيق ويب (Web app)":
 *    - الوصف: RTG-SYSTEM Master Server v4.5
 *    - تنفيذ كـ (Execute as): أنا (Me)
 *    - مَن يملك حق الوصول (Who has access): أي شخص (Anyone)  [ضروري جداً]
 * 7. اضغط Deploy وانسخ الرابط الناتج وضعه في خانة "رابط الخادم السحابي المركزي" بلوحة الإدارة.
 */

/**
 * دالة onOpen تعمل تلقائياً بمجرد فتح الشيت
 * وتضيف زر وقائمة "⚙️ منظومة RTG" في أعلى الصفحة مباشرة
 */
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('⚙️ منظومة RTG')
      .addItem('🚀 تهيئة صفحات وألوان الخادم المركزي (نقرة واحدة)', 'setupMasterSheet')
      .addSeparator()
      .addItem('🎨 تطبيق ثيم وألوان RTG البرونزية', 'setupMasterSheet')
      .addItem('📊 فحص المشتركين والتراخيص السحابية', 'checkMasterStatus')
      .addItem('ℹ️ عن منظومة RTG SYSTEM', 'showAboutMaster')
      .addToUi();

    SpreadsheetApp.getActiveSpreadsheet().toast(
      "انقر على قائمة [⚙️ منظومة RTG] في الشريط العلوي لتهيئة أوراق الخادم المركزي بالألوان الرسمية!",
      "منظومة RTG SYSTEM",
      7
    );
  } catch (e) {
    Logger.log("onOpen menu error: " + e);
  }
}

function doGet(e) {
  try {
    var params = e.parameter || {};
    var action = params.action || "checkLicense";
    var callback = params.callback;

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. فحص ترخيص المتجر والدخول المزدوج (المالك والموظفين Two-Tier Auth)
    if (action === "checkLicense") {
      var sheetSub = getOrCreateSheet(ss, "المشتركون");
      var data = sheetSub.getDataRange().getValues();

      var key = (params.key || "").toString().trim();
      var username = (params.username || params.email || "").toString().trim();
      var password = (params.password || "").toString().trim();

      // مصطلح البحث (قد يكون كود المتجر أو اسم المستخدم أو اسم المتجر)
      var searchTerm = (username || key || "").toLowerCase().trim();
      var searchNoSpaces = searchTerm.replace(/\\s+/g, "");

      var foundStore = null;

      for (var i = 1; i < data.length; i++) {
        var rowCode = (data[i][0] || "").toString().trim();
        var rowUser = (data[i][1] || "").toString().trim();
        var rowPass = (data[i][2] || "").toString().trim();
        var rowName = (data[i][3] || "").toString().trim();

        var rowUserNorm = rowUser.toLowerCase().replace(/\\s+/g, "");
        var rowCodeNorm = rowCode.toLowerCase();
        var rowNameNorm = rowName.toLowerCase();

        // مطابقة ذكية ومرنة لاسم المتجر أو الكود أو اليوزر
        var matchCode = rowCode && (rowCodeNorm === searchTerm || rowCodeNorm === key.toLowerCase());
        var matchUser = rowUser && (
          rowUser.toLowerCase() === searchTerm ||
          rowUserNorm === searchNoSpaces ||
          (searchTerm.length >= 3 && rowUser.toLowerCase().indexOf(searchTerm) === 0) ||
          (rowUser.length >= 3 && searchTerm.indexOf(rowUser.toLowerCase()) === 0)
        );
        var matchName = rowName && (rowNameNorm === searchTerm || rowNameNorm.indexOf(searchTerm) >= 0);

        if (matchCode || matchUser || matchName) {
          foundStore = {
            storeCode: data[i][0] ? data[i][0].toString().trim() : "",
            username: data[i][1] ? data[i][1].toString().trim() : "",
            password: data[i][2] ? data[i][2].toString().trim() : "",
            storeName: data[i][3] ? data[i][3].toString().trim() : "متجر RTG-SYSTEM",
            phone: data[i][4] ? data[i][4].toString().trim() : "",
            cloudUrl: data[i][5] ? data[i][5].toString().trim() : "",
            startDate: formatDate(data[i][6]),
            endDate: formatDate(data[i][7]),
            plan: data[i][8] ? data[i][8].toString().trim() : "شهري",
            status: data[i][9] ? data[i][9].toString().trim() : "نشط",
            notes: data[i][10] ? data[i][10].toString().trim() : ""
          };
          break;
        }
      }

      if (!foundStore) {
        return respondOutput({
          valid: false,
          message: "بيانات المتجر غير مسجلة بالنظام (يرجى التحقق من اسم المستخدم أو كود المتجر)"
        }, callback);
      }

      var today = new Date();
      today.setHours(0, 0, 0, 0);
      var endD = new Date(foundStore.endDate);
      endD.setHours(23, 59, 59, 999);

      var diffTime = endD.getTime() - today.getTime();
      var daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (foundStore.status === "معلق" || foundStore.status === "ملغى") {
        return respondOutput({
          valid: false,
          message: "تم إيقاف حساب هذا المتجر مؤقتاً. يرجى التواصل مع الإدارة للتفعيل."
        }, callback);
      }

      if (daysRemaining < 0) {
        return respondOutput({
          valid: false,
          expired: true,
          endDate: foundStore.endDate,
          message: "انتهت فترة اشتراك متجرك في (" + foundStore.endDate + "). يرجى تجديد الاشتراك للمتابعة."
        }, callback);
      }

      // ====================================================
      // المستوى الأول: فحص كلمة مرور المالك (Full Admin Access)
      // ====================================================
      if (password && foundStore.password && foundStore.password === password) {
        return respondOutput({
          valid: true,
          role: "admin",
          isOwner: true,
          userTitle: "المالك / المدير العام",
          permissions: ["pos", "orders", "inventory", "dashboard", "debts"],
          storeCode: foundStore.storeCode,
          storeName: foundStore.storeName,
          username: foundStore.username,
          cloudUrl: foundStore.cloudUrl,
          scriptUrl: foundStore.cloudUrl,
          endDate: foundStore.endDate,
          daysRemaining: daysRemaining,
          plan: foundStore.plan,
          message: "تم التحقق من حساب المالك بنجاح ✓ (كامل الصلاحيات 100%)"
        }, callback);
      }

      // ====================================================
      // المستوى الثاني: كلمة المرور لم تطابق المالك!
      // التحقق التلقائي من حسابات الموظفين عبر رابط الخادم الخاص بالمتجر (ورقة Users)
      // ====================================================
      if (foundStore.cloudUrl && password) {
        try {
          var storeEndpoint = foundStore.cloudUrl.trim();
          var sep = storeEndpoint.indexOf('?') >= 0 ? '&' : '?';
          var checkEmpUrl = storeEndpoint + sep +
            'action=login&username=' + encodeURIComponent(foundStore.username) +
            '&userTitle=' + encodeURIComponent(username) +
            '&password=' + encodeURIComponent(password);

          var resp = UrlFetchApp.fetch(checkEmpUrl, {
            muteHttpExceptions: true,
            validateHttpsCertificates: false
          });

          var respText = resp.getContentText();
          var empJson = null;
          try {
            empJson = JSON.parse(respText);
          } catch(pe) {
            var m = respText.match(/^[a-zA-Z0-9_]+\\((.*)\\);?$/);
            if (m) {
              empJson = JSON.parse(m[1]);
            }
          }

          if (empJson && empJson.success && empJson.user) {
            var empUser = empJson.user;
            var perms = empUser.permissions || ["pos"];
            if (typeof perms === "string") {
              try { perms = JSON.parse(perms); } catch(e) { perms = ["pos"]; }
            }

            return respondOutput({
              valid: true,
              role: "employee",
              isOwner: false,
              user: empUser,
              userTitle: empUser.userTitle || "موظف مبيعات",
              permissions: perms,
              storeCode: foundStore.storeCode,
              storeName: foundStore.storeName,
              username: foundStore.username,
              cloudUrl: foundStore.cloudUrl,
              scriptUrl: foundStore.cloudUrl,
              endDate: foundStore.endDate,
              daysRemaining: daysRemaining,
              plan: foundStore.plan,
              message: "✓ مرحباً بك يا " + (empUser.userTitle || "موظف") + " في متجر " + foundStore.storeName
            }, callback);
          } else if (empJson && empJson.message && empJson.message.indexOf("معلق") >= 0) {
            return respondOutput({
              valid: false,
              message: empJson.message
            }, callback);
          }
        } catch (fetchErr) {
          Logger.log("UrlFetchApp employee check exception: " + fetchErr);
        }
      }

      // إذا لم تطابق المالك أو الموظف، نعيد رابط الخادم الخاص لتمكين فحص العميل المباشر
      return respondOutput({
        valid: false,
        storeFound: true,
        storeCode: foundStore.storeCode,
        storeName: foundStore.storeName,
        username: foundStore.username,
        cloudUrl: foundStore.cloudUrl,
        message: "كلمة المرور غير صحيحة (يرجى التأكد من كلمة مرور المالك أو الموظف)"
      }, callback);
    }

    // 2. جلب جميع المشتركين للوحة الإدارة
    if (action === "getAllStores") {
      var sheetStores = getOrCreateSheet(ss, "المشتركون");
      var storeData = sheetStores.getDataRange().getValues();
      var stores = [];

      for (var j = 1; j < storeData.length; j++) {
        if (storeData[j][0]) {
          stores.push({
            id: "STORE-" + j,
            storeCode: storeData[j][0].toString(),
            username: storeData[j][1] ? storeData[j][1].toString() : "",
            password: storeData[j][2] ? storeData[j][2].toString() : "",
            storeName: storeData[j][3] ? storeData[j][3].toString() : "",
            phone: storeData[j][4] ? storeData[j][4].toString() : "",
            cloudUrl: storeData[j][5] ? storeData[j][5].toString() : "",
            startDate: formatDate(storeData[j][6]),
            endDate: formatDate(storeData[j][7]),
            plan: storeData[j][8] ? storeData[j][8].toString() : "شهري",
            status: storeData[j][9] ? storeData[j][9].toString() : "نشط",
            notes: storeData[j][10] ? storeData[j][10].toString() : ""
          });
        }
      }
      return respondOutput({ success: true, stores: stores }, callback);
    }

    // 3. جلب إعدادات المنظومة والباقات المركزية (صفحة الإعدادات وباقات الاشتراكات)
    if (action === "getMasterConfig" || action === "getSettings") {
      var settings = readSettingsSheet(ss);
      var plans = readPlansSheet(ss);
      var socialLinks = readSocialSheet(ss);
      return respondOutput({
        success: true,
        status: "online",
        settings: settings,
        plans: plans,
        socialLinks: socialLinks,
        system: "RTG-SYSTEM Central Cloud v4"
      }, callback);
    }

    // 4. جلب روابط التواصل الاجتماعي
    if (action === "getSocialLinks") {
      var social = readSocialSheet(ss);
      return respondOutput({ success: true, socialLinks: social }, callback);
    }

    // 5. جلب باقات الاشتراكات فقط
    if (action === "getPlans") {
      var allPlans = readPlansSheet(ss);
      return respondOutput({ success: true, plans: allPlans }, callback);
    }

    // التحقق المباشر من كلمة مرور الأدمن ومطابقتها مركزياً من جوجل شيت
    if (action === "verifyAdminPassword" || action === "checkAdminPassword") {
      var passToCheck = (params.password || params.adminPassword || "").toString().trim();
      var currentSettings = readSettingsSheet(ss);
      var currentPass = (currentSettings.adminPassword || "rtg@admin2025").toString().trim();
      var isMatch = Boolean(passToCheck && passToCheck === currentPass);
      return respondOutput({
        success: true,
        matched: isMatch,
        adminPassword: currentPass,
        settings: currentSettings
      }, callback);
    }

    // 5. حفظ وتحديث الإعدادات ورابط الخادم عبر GET (للتوافق المباشر)
    if (action === "updateSettings" || action === "saveSettings") {
      var newUrl = params.masterScriptUrl || params.url;
      var newPass = params.adminPassword || params.password;
      var newCode = params.systemCode || params.storeCode;
      var newName = params.systemName;
      var newPhone = params.supportPhone;

      var updates = {};
      if (newUrl) updates["masterScriptUrl"] = newUrl;
      if (newPass) updates["adminPassword"] = newPass;
      if (newCode) updates["systemCode"] = newCode;
      if (newName) updates["systemName"] = newName;
      if (newPhone) updates["supportPhone"] = newPhone;

      writeSettingsSheet(ss, updates);
      return respondOutput({
        success: true,
        message: "تم حفظ الإعدادات في جوجل شيت بنجاح ✓",
        settings: readSettingsSheet(ss)
      }, callback);
    }

    // 6. حذف متجر من المشتركين
    if (action === "deleteStore") {
      var codeToDelete = (params.storeCode || "").toString().trim().toUpperCase();
      var sheetDel = getOrCreateSheet(ss, "المشتركون");
      var dData = sheetDel.getDataRange().getValues();
      if (codeToDelete) {
        for (var dIdx = 1; dIdx < dData.length; dIdx++) {
          if (dData[dIdx][0] && dData[dIdx][0].toString().trim().toUpperCase() === codeToDelete) {
            sheetDel.deleteRow(dIdx + 1);
            return respondOutput({ success: true, message: "تم حذف المشترك بنجاح" }, callback);
          }
        }
      }
      return respondOutput({ success: false, message: "لم يتم العثور على المتجر" }, callback);
    }

    // الافتراضي: فحص الاتصال بالخادم
    return respondOutput({
      status: "online",
      system: "RTG-SYSTEM Central Cloud v4",
      timestamp: new Date().toISOString()
    }, callback);

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

    // 1. إضافة أو تعديل مشترك
    if (action === "addOrUpdateStore") {
      var sheetSub = getOrCreateSheet(ss, "المشتركون");
      var subData = sheetSub.getDataRange().getValues();
      var storeCode = (payload.storeCode || "").toString().trim().toUpperCase();
      var foundRow = -1;

      for (var i = 1; i < subData.length; i++) {
        if (subData[i][0] && subData[i][0].toString().trim().toUpperCase() === storeCode) {
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
        sheetSub.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
      } else {
        sheetSub.appendRow(rowValues);
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "تم حفظ بيانات المتجر بنجاح في قاعدة البيانات"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. حذف مشترك
    if (action === "deleteStore") {
      var sCode = (payload.storeCode || "").toString().trim().toUpperCase();
      var sheetDel = getOrCreateSheet(ss, "المشتركون");
      var delData = sheetDel.getDataRange().getValues();
      var deleted = false;
      for (var r = 1; r < delData.length; r++) {
        if (delData[r][0] && delData[r][0].toString().trim().toUpperCase() === sCode) {
          sheetDel.deleteRow(r + 1);
          deleted = true;
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: deleted }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. حفظ إعدادات المنظومة (رابط الخادم السحابي، كلمة سر الماستر أدمن، كود النظام)
    if (action === "saveSettings" || action === "updateSettings") {
      var settingsObj = payload.settings || payload;
      writeSettingsSheet(ss, settingsObj);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "تم حفظ وتحديث الإعدادات بنجاح في جوجل شيت"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. حفظ باقات وأسعار الاشتراكات
    if (action === "savePlans") {
      var plansArr = payload.plans || [];
      writePlansSheet(ss, plansArr);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "تم حفظ وتحديث باقات وأسعار الاشتراكات بنجاح"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 5. حفظ روابط التواصل الاجتماعي (واتساب، إنستغرام، تيك توك، فيسبوك)
    if (action === "saveSocialLinks") {
      var socialLinksObj = payload.socialLinks || payload;
      writeSocialSheet(ss, socialLinksObj);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "تم حفظ وتحديث روابط التواصل الاجتماعي بنجاح في جوجل شيت ✓",
        socialLinks: readSocialSheet(ss)
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ----------------------------------------------------
// دوال قراءة وكتابة ورقة [الإعدادات وبيانات المنظومة]
// ----------------------------------------------------
function readSettingsSheet(ss) {
  var sheet = getOrCreateSheet(ss, "الإعدادات وبيانات المنظومة");
  var data = sheet.getDataRange().getValues();
  var settings = {
    masterScriptUrl: "",
    adminPassword: "rtg@admin2025",
    systemCode: "RTG-SYSTEM-2025",
    systemName: "RTG-SYSTEM",
    supportPhone: "0912345678",
    updatedAt: ""
  };

  for (var i = 1; i < data.length; i++) {
    var key = (data[i][0] || "").toString().trim();
    var val = (data[i][1] || "").toString().trim();
    if (key) {
      settings[key] = val;
    }
  }
  return settings;
}

function writeSettingsSheet(ss, updates) {
  var sheet = getOrCreateSheet(ss, "الإعدادات وبيانات المنظومة");
  var data = sheet.getDataRange().getValues();
  var keyMap = {};

  for (var i = 1; i < data.length; i++) {
    var k = (data[i][0] || "").toString().trim();
    if (k) keyMap[k] = i + 1;
  }

  var now = new Date().toISOString();
  updates["updatedAt"] = now;

  for (var key in updates) {
    if (updates.hasOwnProperty(key)) {
      var val = updates[key];
      if (typeof val === "object") val = JSON.stringify(val);
      if (keyMap[key]) {
        sheet.getRange(keyMap[key], 2).setValue(val);
        sheet.getRange(keyMap[key], 4).setValue(now);
      } else {
        sheet.appendRow([key, val, getSettingDesc(key), now]);
      }
    }
  }
}

function getSettingDesc(key) {
  var descs = {
    "masterScriptUrl": "رابط الخادم السحابي المركزي للمنظومة",
    "adminPassword": "كلمة سر الماستر أدمن المركزية",
    "systemCode": "كود النظام والترخيص الرئيسي للمتجر",
    "systemName": "اسم المنظومة الرسمي",
    "supportPhone": "هاتف الدعم الفني وخدمة العملاء",
    "updatedAt": "تاريخ آخر تعديل"
  };
  return descs[key] || "إعداد منظومة";
}

// ----------------------------------------------------
// دوال قراءة وكتابة ورقة [باقات وأسعار الاشتراكات]
// ----------------------------------------------------
function readPlansSheet(ss) {
  var sheet = getOrCreateSheet(ss, "باقات وأسعار الاشتراكات");
  var data = sheet.getDataRange().getValues();
  var plans = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      var featsRaw = (data[i][6] || "").toString();
      var feats = featsRaw.split("|").map(function(f) { return f.trim(); }).filter(Boolean);
      plans.push({
        id: data[i][0].toString(),
        name: data[i][1] ? data[i][1].toString() : "",
        months: Number(data[i][2]) || 1,
        price: Number(data[i][3]) || 0,
        originalPrice: data[i][4] ? Number(data[i][4]) : undefined,
        badge: data[i][5] ? data[i][5].toString() : "",
        features: feats,
        description: data[i][7] ? data[i][7].toString() : ""
      });
    }
  }

  // إذا كانت فارغة نعيد الباقات الافتراضية
  if (plans.length === 0) {
    return getDefaultPlans();
  }
  return plans;
}

function writePlansSheet(ss, plans) {
  var sheet = getOrCreateSheet(ss, "باقات وأسعار الاشتراكات");
  sheet.clearContents();

  var headers = [
    "معرف الباقة",
    "اسم الباقة",
    "المدة بالشهور",
    "السعر (د.ل)",
    "السعر قبل الخصم",
    "الشارة",
    "المميزات (مفصولة بـ |)",
    "الوصف"
  ];
  sheet.appendRow(headers);

  styleHeaderRow(sheet, headers.length);

  for (var i = 0; i < plans.length; i++) {
    var p = plans[i];
    var featsStr = Array.isArray(p.features) ? p.features.join(" | ") : (p.features || "");
    sheet.appendRow([
      p.id || ("plan-" + (i + 1)),
      p.name || "",
      p.months || 1,
      p.price || 0,
      p.originalPrice || "",
      p.badge || "",
      featsStr,
      p.description || ""
    ]);
  }
}

function getDefaultPlans() {
  return [
    {
      id: "plan-1m",
      name: "باقة 1 شهر (تجربة سريعة)",
      months: 1,
      price: 45,
      badge: "مرونة شهرية",
      features: [
        "نظام كاشير بيع مباشر وفوري",
        "إدارة المخزون والتنبيه عند نفاد الكميات",
        "إصدار وطباعة فواتير حرارية وبلوتوث",
        "مزامنة سحابية مستمرة مع خادمك الخاص",
        "دعم فني وتحديثات مستمرة"
      ]
    },
    {
      id: "plan-3m",
      name: "باقة 3 أشهر (الأكثر طلباً)",
      months: 3,
      price: 115,
      originalPrice: 135,
      badge: "الأكثر طلباً 🚀",
      popular: true,
      features: [
        "كافة مميزات المنظومة المتكاملة",
        "إدارة الديون وسجل المرتجعات",
        "تقارير أرباح ومبيعات ورسوم بيانية",
        "مزامنة سحابية فائقة السرعة 24/7",
        "توفير 20 دينار مقارنة بالشهري",
        "دعم فني ذو أولوية عالية"
      ]
    },
    {
      id: "plan-6m",
      name: "باقة 6 أشهر (توفير عالي)",
      months: 6,
      price: 210,
      originalPrice: 270,
      badge: "توفير 60 د.ل",
      features: [
        "كافة مميزات المنظومة بدون أي قيود",
        "ربط خادم سحابي مستقل مشفر للمتجر",
        "نسخ احتياطي تلقائي للبيانات وحمايتها",
        "إمكانية الدخول من أكثر من جهاز في نفس الوقت",
        "دعم فني مباشر ومساعدة في التهيئة"
      ]
    },
    {
      id: "plan-12m",
      name: "باقة سنوية 12 شهر (الأوفر)",
      months: 12,
      price: 350,
      originalPrice: 540,
      badge: "الأوفر والأفضل قيمة 💎",
      features: [
        "اشتراك سنوي كامل بأقل تكلفة شهرية",
        "تجهيز وربط خادم جوجل شيت مجاناً",
        "تحديثات حصرية متميزة على مدار العام",
        "تقارير سنوية شاملة للمبيعات والأرباح",
        "دعم فني VIP على مدار الساعة 24/7"
      ]
    }
  ];
}

// ----------------------------------------------------
// دوال قراءة وكتابة ورقة [التواصل_الاجتماعي]
// ----------------------------------------------------
function readSocialSheet(ss) {
  var sheet = getOrCreateSheet(ss, "التواصل_الاجتماعي");
  var defaultLinks = {
    whatsapp: "https://wa.me/218934590635",
    instagram: "https://instagram.com",
    tiktok: "https://tiktok.com",
    facebook: "https://www.facebook.com/profile.php?id=100063457567880"
  };

  if (sheet.getLastRow() < 2) {
    writeSocialSheet(ss, defaultLinks);
    return defaultLinks;
  }

  var data = sheet.getDataRange().getValues();
  var links = {};
  for (var i = 1; i < data.length; i++) {
    var platform = (data[i][0] || "").toString().toLowerCase().trim();
    var url = (data[i][1] || "").toString().trim();
    if (platform.indexOf("whatsapp") !== -1 || platform.indexOf("واتساب") !== -1) {
      links.whatsapp = url;
    } else if (platform.indexOf("instagram") !== -1 || platform.indexOf("إنستغرام") !== -1 || platform.indexOf("انستغرام") !== -1) {
      links.instagram = url;
    } else if (platform.indexOf("tiktok") !== -1 || platform.indexOf("تيك توك") !== -1) {
      links.tiktok = url;
    } else if (platform.indexOf("facebook") !== -1 || platform.indexOf("فيسبوك") !== -1) {
      links.facebook = url;
    }
  }

  return {
    whatsapp: links.whatsapp || defaultLinks.whatsapp,
    instagram: links.instagram || defaultLinks.instagram,
    tiktok: links.tiktok || defaultLinks.tiktok,
    facebook: links.facebook || defaultLinks.facebook
  };
}

function writeSocialSheet(ss, links) {
  var sheet = getOrCreateSheet(ss, "التواصل_الاجتماعي");
  sheet.clear();
  sheet.appendRow(["المنصة", "رابط الحساب", "تاريخ آخر تعديل"]);
  styleMasterRtgHeader(sheet, 3, "#162033");
  var now = new Date().toLocaleString();
  sheet.appendRow(["واتساب (WhatsApp)", links.whatsapp || "", now]);
  sheet.appendRow(["إنستغرام (Instagram)", links.instagram || "", now]);
  sheet.appendRow(["تيك توك (TikTok)", links.tiktok || "", now]);
  sheet.appendRow(["فيسبوك (Facebook)", links.facebook || "", now]);
}

// ----------------------------------------------------
// أدوات المساعدة وتطبيق ألوان وهوية RTG
// ----------------------------------------------------
function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function styleMasterRtgHeader(sheet, numCols, bgColor) {
  var bg = bgColor || "#c5834e";
  var headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange
    .setBackground(bg)
    .setFontColor("#ffffff")
    .setFontSize(11)
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");

  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);
  sheet.setRightToLeft(true);

  try {
    sheet.setTabColor(bg);
  } catch (e) {}

  try {
    headerRange.setBorder(true, true, true, true, true, true, "#8a4f21", SpreadsheetApp.BorderStyle.SOLID);
  } catch (e) {}

  try {
    if (!sheet.getFilter()) {
      headerRange.createFilter();
    }
  } catch (e) {}
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
 * دالة التهيئة التلقائية للملف المركزي (المشتركون، الإعدادات، باقات الاشتراكات، والتواصل)
 * تدعم تطبيق هوية وألوان RTG الرسمية (#c5834e) وعرض تنبيه تأكيد تفصيلي
 */
function setupMasterSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. ورقة المشتركون (اللون البرونزي النحاسي #c5834e)
  var sheetSubs = getOrCreateSheet(ss, "المشتركون");
  var subHeaders = [
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
  sheetSubs.getRange(1, 1, 1, subHeaders.length).setValues([subHeaders]);
  styleMasterRtgHeader(sheetSubs, subHeaders.length, "#c5834e");
  sheetSubs.setColumnWidth(1, 130);
  sheetSubs.setColumnWidth(2, 140);
  sheetSubs.setColumnWidth(3, 120);
  sheetSubs.setColumnWidth(4, 190);
  sheetSubs.setColumnWidth(5, 130);
  sheetSubs.setColumnWidth(6, 260);
  sheetSubs.setColumnWidth(7, 120);
  sheetSubs.setColumnWidth(8, 120);
  sheetSubs.setColumnWidth(9, 110);
  sheetSubs.setColumnWidth(10, 110);
  sheetSubs.setColumnWidth(11, 200);

  // إضافة متجر تجريبي / أساسي إذا كانت الورقة فارغة
  if (sheetSubs.getLastRow() <= 1) {
    sheetSubs.appendRow([
      "RTG-101",
      "محمد 2005",
      "20052005",
      "متجر RTG System",
      "0910000000",
      "",
      "2025-01-01",
      "2026-12-31",
      "سنوي",
      "نشط",
      "المتجر الرئيسي لمنظومة RTG"
    ]);
  }

  // 2. ورقة الإعدادات وبيانات المنظومة (اللون الكحلي الداكن #1e293b)
  var sheetSettings = getOrCreateSheet(ss, "الإعدادات وبيانات المنظومة");
  var setHeaders = ["المفتاح (Key)", "القيمة (Value)", "الوصف (Description)", "تاريخ التحديث"];
  sheetSettings.getRange(1, 1, 1, setHeaders.length).setValues([setHeaders]);
  styleMasterRtgHeader(sheetSettings, setHeaders.length, "#1e293b");
  sheetSettings.setColumnWidth(1, 180);
  sheetSettings.setColumnWidth(2, 320);
  sheetSettings.setColumnWidth(3, 260);
  sheetSettings.setColumnWidth(4, 180);

  if (sheetSettings.getLastRow() <= 1) {
    var now = new Date().toISOString();
    var defaultSettings = [
      ["masterScriptUrl", "", "رابط الخادم السحابي المركزي للمنظومة", now],
      ["adminPassword", "rtg@admin2025", "كلمة سر الماستر أدمن المركزية", now],
      ["systemCode", "RTG-SYSTEM-2025", "كود النظام والترخيص الرئيسي للمتجر", now],
      ["systemName", "RTG-SYSTEM", "اسم المنظومة الرسمي", now],
      ["supportPhone", "0912345678", "هاتف الدعم الفني وخدمة العملاء", now]
    ];
    sheetSettings.getRange(2, 1, defaultSettings.length, 4).setValues(defaultSettings);
  }

  // 3. ورقة باقات وأسعار الاشتراكات (اللون النحاسي الداكن #a6632f)
  var sheetPlans = getOrCreateSheet(ss, "باقات وأسعار الاشتراكات");
  var planHeaders = [
    "معرف الباقة",
    "اسم الباقة",
    "المدة بالشهور",
    "السعر (د.ل)",
    "السعر قبل الخصم",
    "الشارة",
    "المميزات (مفصولة بـ |)",
    "الوصف"
  ];
  sheetPlans.getRange(1, 1, 1, planHeaders.length).setValues([planHeaders]);
  styleMasterRtgHeader(sheetPlans, planHeaders.length, "#a6632f");
  sheetPlans.setColumnWidth(1, 110);
  sheetPlans.setColumnWidth(2, 180);
  sheetPlans.setColumnWidth(3, 110);
  sheetPlans.setColumnWidth(4, 110);
  sheetPlans.setColumnWidth(5, 120);
  sheetPlans.setColumnWidth(6, 140);
  sheetPlans.setColumnWidth(7, 300);
  sheetPlans.setColumnWidth(8, 200);

  if (sheetPlans.getLastRow() <= 1) {
    writePlansSheet(ss, getDefaultPlans());
  }

  // 4. ورقة التواصل الاجتماعي
  var sheetSocial = getOrCreateSheet(ss, "التواصل_الاجتماعي");
  if (sheetSocial.getLastRow() <= 1) {
    writeSocialSheet(ss, readSocialSheet(ss));
  } else {
    styleMasterRtgHeader(sheetSocial, 3, "#162033");
  }

  // حذف الصفحات الافتراضية الفارغة مثل Sheet1 أو ورقة 1
  try {
    var allSheets = ss.getSheets();
    if (allSheets.length > 4) {
      for (var sIdx = 0; sIdx < allSheets.length; sIdx++) {
        var sName = allSheets[sIdx].getName();
        if (sName === "Sheet1" || sName === "ورقة 1" || sName === "ورقة1") {
          ss.deleteSheet(allSheets[sIdx]);
          break;
        }
      }
    }
  } catch (e) {}

  SpreadsheetApp.flush();

  try {
    var ui = SpreadsheetApp.getUi();
    var alertLines = [
      "✓ تم تهيئة أوراق الخادم المركزي وتطبيق ألوان وهوية RTG الرسمية (#c5834e):",
      "",
      "1. [المشتركون] — حسابات المتاجر، التراخيص، الصلاحيات، وربط روابط الخوادم (لون برونزي)",
      "2. [الإعدادات وبيانات المنظومة] — إعدادات النظام وكلمة سر الماستر أدمن (لون كحلي)",
      "3. [باقات وأسعار الاشتراكات] — باقات الاشتراك والأسعار بالدينار الليبي (لون نحاسي داكن)",
      "4. [التواصل_الاجتماعي] — روابط منصات التواصل والدعم الفني (لون كحلي داكن)",
      "",
      "⚡ ميزة Two-Tier Auth مفعلة:",
      "عند دخول الموظف بكلمة مروره، سيقوم الخادم المركزي تلقائياً بالانتقال لرابط الخادم الخاص بالمتجر والتحقق من ورقة Users وتطبيق صلاحياته بدقة 100%!",
      "",
      "📌 خطوة النشر والربط بالمنظومة:",
      "1. اضغط على زر [نشر (Deploy)] في أعلى الشاشة -> [نشر جديد (New deployment)].",
      "2. اختر نوع [تطبيق ويب (Web app)].",
      "3. اختر (Who has access / من يملك الوصول): [أي شخص (Anyone)].",
      "4. اضغط Deploy وانسخ الرابط وضع في خانة رابط الخادم المركزي بلوحة تحكم RTG."
    ];
    ui.alert(
      "🌟 تم إعداد الخادم المركزي لمنظومة RTG بنجاح 🌟",
      alertLines.join("\\n"),
      ui.ButtonSet.OK
    );
  } catch (e) {
    ss.toast("✓ تم تهيئة أوراق الخادم المركزي وتطبيق ألوان RTG بنجاح!", "منظومة RTG", 6);
  }
}

function checkMasterStatus() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetSubs = ss.getSheetByName("المشتركون");
  var sheetSettings = ss.getSheetByName("الإعدادات وبيانات المنظومة");
  var sheetPlans = ss.getSheetByName("باقات وأسعار الاشتراكات");

  var sCount = sheetSubs ? Math.max(0, sheetSubs.getLastRow() - 1) : 0;
  var setCount = sheetSettings ? Math.max(0, sheetSettings.getLastRow() - 1) : 0;
  var pCount = sheetPlans ? Math.max(0, sheetPlans.getLastRow() - 1) : 0;

  var msgLines = [
    "📊 إحصائيات الخادم المركزي لمنظومة RTG:",
    "",
    "• إجمالي المتاجر المشتركة: " + sCount,
    "• بنود الإعدادات المركزية: " + setCount,
    "• باقات الاشتراك المعتمدة: " + pCount,
    "",
    "✓ ميزة فحص الموظفين التلقائي (Two-Tier Auth) مفعلة 100%",
    "✓ ثيم وهوية RTG الرسمية مطبقة بنجاح!"
  ];
  try {
    SpreadsheetApp.getUi().alert("📊 فحص الخادم المركزي", msgLines.join("\\n"), SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    ss.toast(msgLines.join("\\n"), "منظومة RTG", 6);
  }
}

function showAboutMaster() {
  var infoLines = [
    "✨ منظومة RTG-SYSTEM — الخادم السحابي المركزي v4.5 ✨",
    "",
    "نظام إدارة التراخيص والمشتركين والتحقق الثنائي للملاك والموظفين (Two-Tier Authentication)",
    "الهوية البصرية: ثيم RTG البرونزي الرسمي (#c5834e)",
    "",
    "جميع الحقوق محفوظة لمنظومة RTG SYSTEM"
  ];
  try {
    SpreadsheetApp.getUi().alert("ℹ️ عن الخادم المركزي", infoLines.join("\\n"), SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    SpreadsheetApp.getActiveSpreadsheet().toast(infoLines.join("\\n"), "منظومة RTG", 6);
  }
}
`;

export const STORE_ENGINE_SCRIPT_CODE = `/**
 * ====================================================================
 * منظومة RTG-SESTEM — كود محرك المتجر الخاص (النسخة المتطورة 3.5)
 * ====================================================================
 * الأوراق الأربعة: [المنتجات] - [الفواتير] - [الديون] - [Users]
 * الهوية والألوان: متوافقة 100% مع ألوان وهوية منظومة RTG الرسمية (#c5834e)
 * ====================================================================
 * 
 * 🚀 طريقة التثبيت والتهيئة بنقرة واحدة:
 * 1. افتح جدول Google Sheet جديد لمتجر المشترك.
 * 2. من القائمة العلوية: الإضافات (Extensions) -> Apps Script.
 * 3. احذف أي كود موجود والصق هذا الكود كاملاً، ثم اضغط حفظ (Save 💾).
 * 4. ارجع لجدول الشيت وحدّث الصفحة (Reload) — ستجد في الشريط العلوي زراً/قائمة باسم:
 *    [ ⚙️ منظومة RTG ]
 * 5. اضغط على [ ⚙️ منظومة RTG ] ثم اختر:
 *    "🚀 تهيئة صفحات وألوان متجر RTG (نقرة واحدة)"
 *    -> سيتم فوراً إنشاء وتنسيق الأوراق الأربعة بألوان وهوية المنظومة الرسمية!
 * 
 * 6. نشر التطبيق والربط:
 *    - اضغط على "نشر (Deploy)" في الزاوية العلوية -> "نشر جديد (New deployment)".
 *    - اختر "تطبيق ويب (Web app)".
 *    - الوصف: RTG Store Engine v3.5
 *    - تنفيذ كـ (Execute as): أنا (Me)
 *    - مَن يملك حق الوصول (Who has access): أي شخص (Anyone)  [ضروري جداً]
 *    - اضغط Deploy وانسخ الرابط الناتج وضعه في خانة "رابط الخادم الخاص" للمتجر.
 */

/**
 * دالة onOpen تعمل تلقائياً بمجرد فتح الشيت
 * وتضيف زر وقائمة "⚙️ منظومة RTG" في أعلى الصفحة مباشرة
 */
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('⚙️ منظومة RTG')
      .addItem('🚀 تهيئة صفحات وألوان متجر RTG (نقرة واحدة)', 'setupStoreSheets')
      .addSeparator()
      .addItem('🎨 تطبيق ثيم وألوان RTG البرونزية', 'setupStoreSheets')
      .addItem('📊 فحص جاهزية أوراق العمل والبيانات', 'checkStoreStatus')
      .addItem('ℹ️ عن منظومة RTG SYSTEM', 'showAboutRtg')
      .addToUi();

    SpreadsheetApp.getActiveSpreadsheet().toast(
      "انقر على قائمة [⚙️ منظومة RTG] في الشريط العلوي لتهيئة الصفحات بالألوان الرسمية!",
      "منظومة RTG SYSTEM",
      7
    );
  } catch (e) {
    Logger.log("onOpen menu error: " + e);
  }
}

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

      // د. قراءة المستخدمين والصلاحيات (Users)
      var userSheet = ss.getSheetByName("Users") || ss.getSheetByName("المستخدمين والصلاحيات");
      var users = [];
      if (userSheet && userSheet.getLastRow() > 1) {
        var uData = userSheet.getDataRange().getValues();
        for (var u = 1; u < uData.length; u++) {
          var uTitle = (uData[u][1] || "").toString().trim();
          if (uTitle) {
            var rawPerms = uData[u][3] ? uData[u][3].toString() : "[]";
            var parsedPerms = [];
            try {
              parsedPerms = JSON.parse(rawPerms);
            } catch (e) {
              parsedPerms = rawPerms.split(",").map(function(s) { return s.trim(); });
            }
            users.push({
              id: "USR-" + u,
              username: (uData[u][0] || "").toString().trim(),
              userTitle: uTitle,
              password: (uData[u][2] || "").toString().trim(),
              permissions: Array.isArray(parsedPerms) ? parsedPerms : ["pos"],
              status: (uData[u][4] || "نشط").toString().trim(),
              createdAt: uData[u][5] ? uData[u][5].toString() : "",
              lastLogin: uData[u][6] ? uData[u][6].toString() : ""
            });
          }
        }
      }

      var result = {
        success: true,
        products: products,
        orders: orders,
        debts: debts,
        users: users,
        syncedAt: new Date().toISOString()
      };

      return respondOutput(result, callback);
    }

    // 2. التحقق من تسجيل الدخول (المالك والموظفون)
    if (action === "login" || action === "login_user" || action === "verifyEmployee") {
      var inUser = (params.username || params.email || params.key || "").toString().trim().toLowerCase();
      var inTitle = (params.userTitle || params.title || "").toString().trim().toLowerCase();
      var inPass = (params.password || "").toString().trim();
      var inUserNorm = inUser.replace(/\\s+/g, "");

      var uSheet = ss.getSheetByName("Users") || ss.getSheetByName("المستخدمين والصلاحيات");

      if (uSheet && uSheet.getLastRow() > 1) {
        var uRows = uSheet.getDataRange().getValues();
        for (var ui = 1; ui < uRows.length; ui++) {
          var rowUser = (uRows[ui][0] || "").toString().trim();
          var rowTitle = (uRows[ui][1] || "").toString().trim();
          var rowPass = (uRows[ui][2] || "").toString().trim();
          var rowStatus = (uRows[ui][4] || "نشط").toString().trim();

          var rowUserNorm = rowUser.toLowerCase().replace(/\\s+/g, "");
          var rowTitleNorm = rowTitle.toLowerCase();

          // التحقق من تطابق كلمة المرور أولاً
          var passMatches = (inPass && rowPass === inPass);

          // التحقق من تطابق المعرف:
          // 1. اسم المتجر / المستخدم الموحد
          // 2. أو اسم الموظف المباشر / صفته (مثل: كاشير 1، أحمد، مسؤولة المبيعات)
          // 3. أو إذا تم إرسال كلمة المرور مباشرة مع عنوان الموظف
          var userMatches = !inUser ||
            rowUser.toLowerCase() === inUser ||
            rowUserNorm === inUserNorm ||
            rowTitleNorm === inUser ||
            (inTitle && rowTitleNorm === inTitle) ||
            (inUser.length >= 3 && rowUser.toLowerCase().indexOf(inUser) === 0) ||
            (rowUser.length >= 3 && inUser.indexOf(rowUser.toLowerCase()) === 0) ||
            rowTitleNorm.indexOf(inUser) !== -1 ||
            inUser.indexOf(rowTitleNorm) !== -1;

          if (passMatches && userMatches) {
            // التحقق من حالة الحساب: إذا كان معلقاً يتم الرفض
            if (rowStatus === "معلق" || rowStatus.indexOf("معلق") !== -1) {
              return respondOutput({
                success: false,
                valid: false,
                message: "تم تعليق حساب هذا الموظف مؤقتاً، يرجى مراجعة إدارة المتجر للتفعيل"
              }, callback);
            }

            var pStr = uRows[ui][3] ? uRows[ui][3].toString() : "[]";
            var permArr = [];
            try {
              permArr = JSON.parse(pStr);
            } catch (ex) {
              permArr = pStr.split(",").map(function(s) { return s.trim(); });
            }

            // تحديث تاريخ آخر تسجيل دخول في العمود 7
            var nowStr = new Date().toLocaleString("ar-LY");
            try {
              uSheet.getRange(ui + 1, 7).setValue(nowStr);
            } catch (err) {}

            return respondOutput({
              success: true,
              valid: true,
              role: "employee",
              isOwner: false,
              user: {
                id: "USR-" + ui,
                username: rowUser,
                userTitle: rowTitle,
                permissions: Array.isArray(permArr) && permArr.length > 0 ? permArr : ["pos"],
                status: rowStatus,
                lastLogin: nowStr
              },
              permissions: Array.isArray(permArr) && permArr.length > 0 ? permArr : ["pos"],
              userTitle: rowTitle,
              message: "✓ تم تسجيل دخول الموظف بنجاح"
            }, callback);
          }
        }
      }

      return respondOutput({
        success: false,
        valid: false,
        message: "بيانات الدخول غير صحيحة (تأكد من اسم المستخدم أو اسم الموظف وكلمة المرور)"
      }, callback);
    }

    // 3. جلب كافة الموظفين والصلاحيات (getUsers و get_users)
    if (action === "getUsers" || action === "get_users") {
      var uSheetList = ss.getSheetByName("Users") || ss.getSheetByName("المستخدمين والصلاحيات");
      var usersList = [];
      if (uSheetList && uSheetList.getLastRow() > 1) {
        var uld = uSheetList.getDataRange().getValues();
        for (var uli = 1; uli < uld.length; uli++) {
          var ut = (uld[uli][1] || "").toString().trim();
          if (ut) {
            var rawP = uld[uli][3] ? uld[uli][3].toString() : "[]";
            var parsedP = [];
            try {
              parsedP = JSON.parse(rawP);
            } catch (e) {
              parsedP = rawP.split(",").map(function(s) { return s.trim(); });
            }
            usersList.push({
              id: "USR-" + uli,
              username: (uld[uli][0] || "").toString().trim(),
              userTitle: ut,
              password: (uld[uli][2] || "").toString().trim(),
              permissions: Array.isArray(parsedP) && parsedP.length > 0 ? parsedP : ["pos"],
              status: (uld[uli][4] || "نشط").toString().trim(),
              createdAt: uld[uli][5] ? uld[uli][5].toString() : "",
              lastLogin: uld[uli][6] ? uld[uli][6].toString() : ""
            });
          }
        }
      }
      return respondOutput({ success: true, users: usersList }, callback);
    }

    // 4. إضافة أو تحديث موظف عبر GET (توافق كامل مع متصفحات الويب)
    if (action === "addUser" || action === "updateUser" || action === "save_user_permissions" || action === "saveUser") {
      var uSheetSaveGet = ss.getSheetByName("Users") || ss.getSheetByName("المستخدمين والصلاحيات");
      if (!uSheetSaveGet) {
        uSheetSaveGet = ss.insertSheet("Users");
        var uhGet = [
          "اسم المستخدم الموحد",
          "اسم الموظف / الصفة",
          "كلمة المرور",
          "الصلاحيات الممنوحة",
          "الحالة",
          "تاريخ الإنشاء",
          "آخر تسجيل دخول"
        ];
        uSheetSaveGet.getRange(1, 1, 1, uhGet.length).setValues([uhGet]);
        styleRtgHeader(uSheetSaveGet, uhGet.length, "#c5834e");
      }

      var uTitleSearchGet = (params.userTitle || "").toString().trim();
      var uRowsDataGet = uSheetSaveGet.getDataRange().getValues();
      var targetRowGet = -1;

      for (var urg = 1; urg < uRowsDataGet.length; urg++) {
        var rTitleG = (uRowsDataGet[urg][1] || "").toString().trim();
        if (rTitleG.toLowerCase() === uTitleSearchGet.toLowerCase()) {
          targetRowGet = urg + 1;
          break;
        }
      }

      var permsValGet = params.permissions || '["pos"]';
      var nowStrGet = new Date().toLocaleString("ar-LY");
      var uRowValsGet = [
        params.username || "",
        params.userTitle || "",
        params.password || "",
        permsValGet,
        params.status || "نشط",
        params.createdAt || nowStrGet,
        params.lastLogin || ""
      ];

      if (targetRowGet > 0) {
        var origCreatedG = uSheetSaveGet.getRange(targetRowGet, 6).getValue();
        if (origCreatedG) uRowValsGet[5] = origCreatedG;
        uSheetSaveGet.getRange(targetRowGet, 1, 1, uRowValsGet.length).setValues([uRowValsGet]);
      } else {
        uSheetSaveGet.appendRow(uRowValsGet);
      }

      return respondOutput({ success: true, message: "تم حفظ بيانات الموظف وصلاحياته بنجاح" }, callback);
    }

    // 5. حذف موظف عبر GET
    if (action === "deleteUser" || action === "delete_user") {
      var uSheetDelGet = ss.getSheetByName("Users") || ss.getSheetByName("المستخدمين والصلاحيات");
      if (uSheetDelGet && uSheetDelGet.getLastRow() > 1) {
        var uDelDataGet = uSheetDelGet.getDataRange().getValues();
        var delTitleGet = (params.userTitle || "").toString().trim().toLowerCase();
        var delUserGet = (params.username || "").toString().trim().toLowerCase();
        var delIdGet = (params.id || "").toString().trim();

        for (var udiG = 1; udiG < uDelDataGet.length; udiG++) {
          var rowTitG = (uDelDataGet[udiG][1] || "").toString().trim().toLowerCase();
          var rowUsrG = (uDelDataGet[udiG][0] || "").toString().trim().toLowerCase();
          var rowIdG = "USR-" + udiG;

          if ((delTitleGet && rowTitG === delTitleGet) || (delIdGet && rowIdG === delIdGet)) {
            uSheetDelGet.deleteRow(udiG + 1);
            return respondOutput({ success: true, message: "تم حذف الموظف بنجاح" }, callback);
          }
        }
      }
      return respondOutput({ success: false, message: "لم يتم العثور على الموظف المطلوب حذفه" }, callback);
    }

    // 6. حذف منتج عبر GET
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
    var payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (errJson) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    var action = payload.action || (e && e.parameter ? e.parameter.action : "");

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
        payload.customerArea || payload.cArea || "",
        payload.cashierName || ""
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

      // البحث عن المنتج بالكود القديم إن كان تحديثاً، لمنع تكرار السلعة عند تعديل الباركود
      var searchBarcode = (action === "updateProduct" && payload.oldBarcode)
        ? payload.oldBarcode
        : (payload.oldBarcode || payload.barcode);

      var pRows = pSheet.getDataRange().getValues();
      var foundRow = -1;

      // أولاً: البحث بالباركود القديم أو الحالي
      for (var pr = 1; pr < pRows.length; pr++) {
        if (pRows[pr][0] && pRows[pr][0].toString().trim() === searchBarcode.toString().trim()) {
          foundRow = pr + 1;
          break;
        }
      }

      // ثانياً: إن لم يُعثر عليه وكان هناك اسم، نبحث بالاسم لتحديث الباركود لنفس المنتج بدلاً من تكراره
      if (foundRow === -1 && payload.name) {
        for (var pr2 = 1; pr2 < pRows.length; pr2++) {
          if (pRows[pr2][1] && pRows[pr2][1].toString().trim().toLowerCase() === payload.name.toString().trim().toLowerCase()) {
            foundRow = pr2 + 1;
            break;
          }
        }
      }

      var pRowVals = [
        payload.barcode || searchBarcode,
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

    // 11. إضافة أو تعديل مستخدم / موظف وتحديد صلاحياته (addUser, updateUser, save_user_permissions)
    if (action === "addUser" || action === "updateUser" || action === "save_user_permissions" || action === "saveUser") {
      var uSheetSave = ss.getSheetByName("Users") || ss.getSheetByName("المستخدمين والصلاحيات");
      if (!uSheetSave) {
        uSheetSave = ss.insertSheet("Users");
        var uh = [
          "اسم المستخدم الموحد",
          "اسم الموظف / الصفة",
          "كلمة المرور",
          "الصلاحيات الممنوحة",
          "الحالة",
          "تاريخ الإنشاء",
          "آخر تسجيل دخول"
        ];
        uSheetSave.getRange(1, 1, 1, uh.length).setValues([uh]);
        styleRtgHeader(uSheetSave, uh.length, "#c5834e");
      }

      var uTitleSearch = (payload.userTitle || "").toString().trim().toLowerCase();
      var uIdSearch = (payload.id || "").toString().trim();
      var uRowsData = uSheetSave.getDataRange().getValues();
      var targetRow = -1;

      for (var ur = 1; ur < uRowsData.length; ur++) {
        var rTitle = (uRowsData[ur][1] || "").toString().trim().toLowerCase();
        var rowId = "USR-" + ur;
        if ((uTitleSearch && rTitle === uTitleSearch) || (uIdSearch && rowId === uIdSearch)) {
          targetRow = ur + 1;
          break;
        }
      }

      var permsVal = typeof payload.permissions === "string" ? payload.permissions : JSON.stringify(payload.permissions || ["pos"]);
      var nowStr = new Date().toLocaleString("ar-LY");
      var uRowVals = [
        payload.username || "",
        payload.userTitle || "",
        payload.password || "",
        permsVal,
        payload.status || "نشط",
        payload.createdAt || nowStr,
        payload.lastLogin || ""
      ];

      if (targetRow > 0) {
        var origCreated = uSheetSave.getRange(targetRow, 6).getValue();
        if (origCreated) uRowVals[5] = origCreated;
        uSheetSave.getRange(targetRow, 1, 1, uRowVals.length).setValues([uRowVals]);
      } else {
        uSheetSave.appendRow(uRowVals);
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: targetRow > 0 ? "تم تحديث بيانات وصلاحيات الموظف بنجاح" : "تمت إضافة الموظف الجديد وتثبيت صلاحياته بنجاح"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 12. حذف موظف نهائياً (deleteUser, delete_user)
    if (action === "deleteUser" || action === "delete_user") {
      var uSheetDel = ss.getSheetByName("Users") || ss.getSheetByName("المستخدمين والصلاحيات");
      var deleted = false;
      if (uSheetDel && uSheetDel.getLastRow() > 1) {
        var uDelData = uSheetDel.getDataRange().getValues();
        var delTitle = (payload.userTitle || "").toString().trim().toLowerCase();
        var delId = (payload.id || "").toString().trim();
        var delUser = (payload.username || "").toString().trim().toLowerCase();

        for (var udi = 1; udi < uDelData.length; udi++) {
          var rowTit = (uDelData[udi][1] || "").toString().trim().toLowerCase();
          var rowUsr = (uDelData[udi][0] || "").toString().trim().toLowerCase();
          var rId = "USR-" + udi;

          if ((delTitle && rowTit === delTitle) || (delId && rId === delId) || (delUser && delTitle && rowUsr === delUser && rowTit === delTitle)) {
            uSheetDel.deleteRow(udi + 1);
            deleted = true;
            break;
          }
        }
      }

      if (deleted) {
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: "تم حذف الموظف بنجاح" }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ success: false, message: "لم يتم العثور على الموظف المطلوب حذفه في ورقة Users" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 13. تسجيل الدخول عبر POST
    if (action === "login" || action === "login_user" || action === "verifyEmployee") {
      var pUser = (payload.username || payload.email || payload.key || "").toString().trim().toLowerCase();
      var pTitle = (payload.userTitle || "").toString().trim().toLowerCase();
      var pPass = (payload.password || "").toString().trim();
      var pUserNorm = pUser.replace(/\\s+/g, "");

      var uSheetLogin = ss.getSheetByName("Users") || ss.getSheetByName("المستخدمين والصلاحيات");
      if (uSheetLogin && uSheetLogin.getLastRow() > 1) {
        var uLRows = uSheetLogin.getDataRange().getValues();
        for (var uli2 = 1; uli2 < uLRows.length; uli2++) {
          var rUser = (uLRows[uli2][0] || "").toString().trim();
          var rTitle2 = (uLRows[uli2][1] || "").toString().trim();
          var rPass = (uLRows[uli2][2] || "").toString().trim();
          var rStatus = (uLRows[uli2][4] || "نشط").toString().trim();

          var rUserNorm = rUser.toLowerCase().replace(/\\s+/g, "");
          var rTitleNorm2 = rTitle2.toLowerCase();

          var passOk = (pPass && rPass === pPass);
          var userOk = !pUser ||
            rUser.toLowerCase() === pUser ||
            rUserNorm === pUserNorm ||
            rTitleNorm2 === pUser ||
            (pTitle && rTitleNorm2 === pTitle) ||
            rTitleNorm2.indexOf(pUser) !== -1 ||
            pUser.indexOf(rTitleNorm2) !== -1;

          if (passOk && userOk) {
            if (rStatus === "معلق" || rStatus.indexOf("معلق") !== -1) {
              return ContentService.createTextOutput(JSON.stringify({
                success: false,
                valid: false,
                message: "تم تعليق حساب هذا الموظف مؤقتاً، يرجى مراجعة إدارة المتجر"
              })).setMimeType(ContentService.MimeType.JSON);
            }

            var permRaw = uLRows[uli2][3] ? uLRows[uli2][3].toString() : "[]";
            var parsedPermList = [];
            try {
              parsedPermList = JSON.parse(permRaw);
            } catch (errP) {
              parsedPermList = permRaw.split(",").map(function(s) { return s.trim(); });
            }

            var nowLoginStr = new Date().toLocaleString("ar-LY");
            try { uSheetLogin.getRange(uli2 + 1, 7).setValue(nowLoginStr); } catch (eLog) {}

            return ContentService.createTextOutput(JSON.stringify({
              success: true,
              valid: true,
              role: "employee",
              user: {
                id: "USR-" + uli2,
                username: rUser,
                userTitle: rTitle2,
                permissions: Array.isArray(parsedPermList) && parsedPermList.length > 0 ? parsedPermList : ["pos"],
                status: rStatus,
                lastLogin: nowLoginStr
              },
              permissions: Array.isArray(parsedPermList) && parsedPermList.length > 0 ? parsedPermList : ["pos"],
              userTitle: rTitle2
            })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        valid: false,
        message: "بيانات الدخول غير صحيحة"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 14. جلب الموظفين عبر POST
    if (action === "getUsers" || action === "get_users") {
      var uSheetPost = ss.getSheetByName("Users") || ss.getSheetByName("المستخدمين والصلاحيات");
      var uPostList = [];
      if (uSheetPost && uSheetPost.getLastRow() > 1) {
        var uPostData = uSheetPost.getDataRange().getValues();
        for (var upi = 1; upi < uPostData.length; upi++) {
          var uPostTitle = (uPostData[upi][1] || "").toString().trim();
          if (uPostTitle) {
            var prP = uPostData[upi][3] ? uPostData[upi][3].toString() : "[]";
            var parsedListP = [];
            try { parsedListP = JSON.parse(prP); } catch (ep) { parsedListP = prP.split(",").map(function(s) { return s.trim(); }); }
            uPostList.push({
              id: "USR-" + upi,
              username: (uPostData[upi][0] || "").toString().trim(),
              userTitle: uPostTitle,
              password: (uPostData[upi][2] || "").toString().trim(),
              permissions: Array.isArray(parsedListP) && parsedListP.length > 0 ? parsedListP : ["pos"],
              status: (uPostData[upi][4] || "نشط").toString().trim(),
              createdAt: uPostData[upi][5] ? uPostData[upi][5].toString() : "",
              lastLogin: uPostData[upi][6] ? uPostData[upi][6].toString() : ""
            });
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, users: uPostList }))
        .setMimeType(ContentService.MimeType.JSON);
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
 * دالة مساعدة لتطبيق ثيم وألوان وهوية منظومة RTG على صف العناوين
 * اللون الأساسي: #c5834e (البرونزي النحاسي الفاخر لمنظومة RTG)
 */
function styleRtgHeader(sheet, colCount, bgColor) {
  var bg = bgColor || "#c5834e";
  var headerRange = sheet.getRange(1, 1, 1, colCount);
  headerRange
    .setBackground(bg)
    .setFontColor("#ffffff")
    .setFontSize(11)
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  
  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);
  sheet.setRightToLeft(true);

  try {
    headerRange.setBorder(true, true, true, true, true, true, "#8a4f21", SpreadsheetApp.BorderStyle.SOLID);
  } catch (e) {}

  try {
    if (!sheet.getFilter()) {
      headerRange.createFilter();
    }
  } catch (e) {}
}

/**
 * ====================================================================
 * دالة التهيئة التلقائية للمتجر (setupStoreSheets)
 * تنشئ الأوراق الأربعة وتطبق ألوان وهوية منظومة RTG بنقرة واحدة:
 * 1. [المنتجات]
 * 2. [الفواتير]
 * 3. [الديون]
 * 4. [Users] (المستخدمين والصلاحيات)
 * ====================================================================
 */
function setupStoreSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. ورقة المنتجات (Products) — ثيم نحاسي برونزي #c5834e
  var prodSheet = ss.getSheetByName("المنتجات");
  if (!prodSheet) prodSheet = ss.insertSheet("المنتجات");
  prodSheet.setTabColor("#c5834e");
  var prodHeaders = [
    "الباركود",
    "اسم المنتج",
    "الكمية",
    "سعر التكلفة",
    "سعر البيع",
    "تاريخ التحديث"
  ];
  prodSheet.getRange(1, 1, 1, prodHeaders.length).setValues([prodHeaders]);
  styleRtgHeader(prodSheet, prodHeaders.length, "#c5834e");
  prodSheet.setColumnWidth(1, 150);
  prodSheet.setColumnWidth(2, 240);
  prodSheet.setColumnWidth(3, 100);
  prodSheet.setColumnWidth(4, 120);
  prodSheet.setColumnWidth(5, 120);
  prodSheet.setColumnWidth(6, 170);

  // 2. ورقة الفواتير (Orders) — ثيم كحلي داكن فاخر #1e293b
  var ordSheet = ss.getSheetByName("الفواتير");
  if (!ordSheet) ordSheet = ss.insertSheet("الفواتير");
  ordSheet.setTabColor("#1e293b");
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
    "المنطقة / العنوان",
    "اسم الكاشير/الموظف"
  ];
  ordSheet.getRange(1, 1, 1, ordHeaders.length).setValues([ordHeaders]);
  styleRtgHeader(ordSheet, ordHeaders.length, "#1e293b");
  ordSheet.setColumnWidth(1, 140);
  ordSheet.setColumnWidth(2, 170);
  ordSheet.setColumnWidth(3, 280);
  ordSheet.setColumnWidth(4, 130);
  ordSheet.setColumnWidth(5, 130);
  ordSheet.setColumnWidth(6, 110);
  ordSheet.setColumnWidth(7, 90);
  ordSheet.setColumnWidth(8, 90);
  ordSheet.setColumnWidth(9, 120);
  ordSheet.setColumnWidth(10, 160);
  ordSheet.setColumnWidth(11, 140);
  ordSheet.setColumnWidth(12, 140);
  ordSheet.setColumnWidth(13, 190);
  ordSheet.setColumnWidth(14, 160);

  // 3. ورقة الديون (Debts) — ثيم نحاسي داكن #a6632f
  var debtSheet = ss.getSheetByName("الديون");
  if (!debtSheet) debtSheet = ss.insertSheet("الديون");
  debtSheet.setTabColor("#a6632f");
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
  styleRtgHeader(debtSheet, debtHeaders.length, "#a6632f");
  debtSheet.setColumnWidth(1, 130);
  debtSheet.setColumnWidth(2, 130);
  debtSheet.setColumnWidth(3, 90);
  debtSheet.setColumnWidth(4, 170);
  debtSheet.setColumnWidth(5, 140);
  debtSheet.setColumnWidth(6, 120);
  debtSheet.setColumnWidth(7, 120);
  debtSheet.setColumnWidth(8, 120);
  debtSheet.setColumnWidth(9, 140);
  debtSheet.setColumnWidth(10, 110);
  debtSheet.setColumnWidth(11, 220);
  debtSheet.setColumnWidth(12, 170);

  // 4. ورقة المستخدمين والصلاحيات (Users) — ثيم برونزي ملكي #c5834e
  var usersSheet = ss.getSheetByName("Users") || ss.getSheetByName("المستخدمين والصلاحيات");
  if (!usersSheet) usersSheet = ss.insertSheet("Users");
  usersSheet.setTabColor("#c5834e");
  var userHeaders = [
    "اسم المستخدم الموحد",
    "اسم الموظف / الصفة",
    "كلمة المرور",
    "الصلاحيات الممنوحة",
    "الحالة",
    "تاريخ الإنشاء",
    "آخر تسجيل دخول"
  ];
  usersSheet.getRange(1, 1, 1, userHeaders.length).setValues([userHeaders]);
  styleRtgHeader(usersSheet, userHeaders.length, "#c5834e");
  usersSheet.setColumnWidth(1, 170);
  usersSheet.setColumnWidth(2, 190);
  usersSheet.setColumnWidth(3, 140);
  usersSheet.setColumnWidth(4, 260);
  usersSheet.setColumnWidth(5, 110);
  usersSheet.setColumnWidth(6, 160);
  usersSheet.setColumnWidth(7, 160);

  // إضافة سطر توضيحي افتراضي للموظفين إن كانت الورقة جديدة
  if (usersSheet.getLastRow() <= 1) {
    usersSheet.appendRow([
      "store_user",
      "كاشير ومسؤول مبيعات",
      "123456",
      '["pos","orders"]',
      "نشط",
      new Date().toLocaleDateString("ar-LY"),
      ""
    ]);
    var sampleRange = usersSheet.getRange(2, 1, 1, 7);
    sampleRange.setHorizontalAlignment("center").setVerticalAlignment("middle");
  }

  // حذف الورقة الفارغة الافتراضية "ورقة 1" أو "Sheet1" لتنظيم الملف
  var defaultNames = ["ورقة 1", "ورقة1", "Sheet1", "Sheet 1"];
  for (var i = 0; i < defaultNames.length; i++) {
    var defSh = ss.getSheetByName(defaultNames[i]);
    if (defSh && ss.getSheets().length > 4 && defSh.getLastRow() <= 1 && defSh.getLastColumn() <= 1) {
      try { ss.deleteSheet(defSh); } catch (e) {}
    }
  }

  // حفظ كافة التغييرات وإظهار إشعار التأكيد
  SpreadsheetApp.flush();

  try {
    var ui = SpreadsheetApp.getUi();
    var alertLines = [
      "✓ تم إنشاء وتنسيق الأوراق الأربعة بألوان وهوية منظومة RTG الرسمية (#c5834e):",
      "",
      "1. [المنتجات] — الباركود، الأسعار، المخزن والكميات (لون برونزي)",
      "2. [الفواتير] — سجل المبيعات والزبائن وحساب الأرباح (لون كحلي داكن)",
      "3. [الديون] — سجل الديون والمعاملات والمدفوعات (لون نحاسي داكن)",
      "4. [Users] — حسابات الموظفين وكلمات المرور والصلاحيات (لون برونزي)",
      "",
      "📌 الخطوة الأخيرة للنشر والربط بالمنظومة:",
      "1. اضغط على زر [نشر (Deploy)] في أعلى الشاشة -> [نشر جديد (New deployment)].",
      "2. اختر نوع [تطبيق ويب (Web app)].",
      "3. اضغط على (Who has access / من يملك الوصول) واختر: [أي شخص (Anyone)].",
      "4. اضغط Deploy وانسخ الرابط الناتج وضعه في خانة رابط الخادم في لوحة تحكم RTG."
    ];
    ui.alert(
      "🌟 تم إعداد متجر RTG وتطبيق الهوية بنجاح 🌟",
      alertLines.join("\\n"),
      ui.ButtonSet.OK
    );
  } catch (e) {
    ss.toast("✓ تم تهيئة صفحات وتنسيق متجر RTG بنجاح!", "منظومة RTG", 6);
  }
}

/**
 * فحص حالة وتوفر أوراق العمل وإحصائيات المتجر
 */
function checkStoreStatus() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var prodSheet = ss.getSheetByName("المنتجات");
  var ordSheet = ss.getSheetByName("الفواتير");
  var debtSheet = ss.getSheetByName("الديون");
  var userSheet = ss.getSheetByName("Users") || ss.getSheetByName("المستخدمين والصلاحيات");

  var pCount = prodSheet ? Math.max(0, prodSheet.getLastRow() - 1) : "ورقة غير موجودة";
  var oCount = ordSheet ? Math.max(0, ordSheet.getLastRow() - 1) : "ورقة غير موجودة";
  var dCount = debtSheet ? Math.max(0, debtSheet.getLastRow() - 1) : "ورقة غير موجودة";
  var uCount = userSheet ? Math.max(0, userSheet.getLastRow() - 1) : "ورقة غير موجودة";

  var msgLines = [
    "📊 إحصائيات وجاهزية بيانات المتجر:",
    "",
    "• عدد المنتجات: " + pCount,
    "• عدد الفواتير: " + oCount,
    "• قيود الديون: " + dCount,
    "• حسابات الموظفين: " + uCount,
    "",
    "الهوية البصرية وألوان RTG: مطبقة بنجاح ✓",
    "المنظومة جاهزة للربط والعمل السحابي المتكامل!"
  ];
  var msg = msgLines.join("\\n");

  try {
    SpreadsheetApp.getUi().alert("📊 فحص جاهزية المتجر", msg, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    ss.toast(msg, "منظومة RTG", 6);
  }
}

/**
 * معلومات النظام والمطور
 */
function showAboutRtg() {
  var infoLines = [
    "✨ منظومة RTG-SESTEM المتطورة ✨",
    "",
    "محرك المتجر السحابي v3.5 (Google Sheets Cloud Engine)",
    "إدارة المبيعات، المخزون، الفواتير، الديون، والصلاحيات الذكية (RBAC)",
    "الهوية البصرية: ثيم RTG البرونزي الرسمي (#c5834e)",
    "",
    "جميع الحقوق محفوظة لمنظومة RTG SYSTEM"
  ];
  var info = infoLines.join("\\n");
  try {
    SpreadsheetApp.getUi().alert("ℹ️ عن منظومة RTG", info, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    SpreadsheetApp.getActiveSpreadsheet().toast(info, "منظومة RTG", 6);
  }
}
`;
