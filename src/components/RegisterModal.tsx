import React, { useState } from "react";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [plan, setPlan] = useState("مجاني - شهر (0 د.ل)");
  const [note, setNote] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!shopName.trim() || !ownerName.trim() || !email.trim() || !phone.trim()) {
      showToast("يرجى ملء جميع الحقول المطلوبة (*)", "error");
      return;
    }

    const message =
      "📋 *طلب تسجيل متجر جديد في RTG-SESTEM*\n" +
      "━━━━━━━━━━━━━━━━━━━━\n" +
      "🏪 اسم المتجر: " +
      shopName.trim() +
      "\n" +
      "👤 صاحب المتجر: " +
      ownerName.trim() +
      "\n" +
      "📧 الإيميل: " +
      email.trim() +
      "\n" +
      "📱 واتساب: " +
      phone.trim() +
      "\n" +
      "🏙️ المدينة: " +
      (city.trim() || "غير محدد") +
      "\n" +
      "📦 الباقة: " +
      plan +
      "\n" +
      (note.trim() ? "📝 ملاحظة: " + note.trim() + "\n" : "") +
      "━━━━━━━━━━━━━━━━━━━━\n" +
      "⏰ تاريخ الطلب: " +
      new Date().toLocaleString("ar-LY") +
      "\n" +
      "🔗 المصدر: منظومة RTG-SESTEM";

    const whatsappUrl = `https://wa.me/218934590635?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    showToast("✓ تم تجهيز الطلب وتحويلك إلى واتساب", "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#121418]/90 backdrop-blur-md z-[57] flex items-center justify-center p-4 animate-fadeInUp">
      <div className="bg-[#121418] rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-[#2c323f] text-center space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="w-16 h-16 bg-[#c5834e]/15 rounded-2xl flex items-center justify-center mx-auto border-2 border-[#c5834e]/30">
          <i className="fa-solid fa-store text-2xl text-[#c5834e]"></i>
        </div>
        <div>
          <h2 className="text-lg font-black text-white">تسجيل متجر جديد</h2>
          <p className="text-[11px] text-slate-400 mt-1">
            أدخل بياناتك وسيتم إرسالها عبر واتساب لإنشاء حسابك وتفعيل المفتاح
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-right">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">اسم المتجر *</label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="مثال: متجر الجيمنج السريع"
              className="w-full px-3 py-2.5 bg-[#181c22] border border-[#2c323f] rounded-xl text-white text-sm outline-none focus:border-[#c5834e]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">اسم صاحب المتجر *</label>
              <input
                type="text"
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="الاسم الثلاثي"
                className="w-full px-3 py-2.5 bg-[#181c22] border border-[#2c323f] rounded-xl text-white text-sm outline-none focus:border-[#c5834e]"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">رقم الواتساب *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912345678"
                className="w-full px-3 py-2.5 bg-[#181c22] border border-[#2c323f] rounded-xl text-white text-sm outline-none focus:border-[#c5834e]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">البريد الإلكتروني *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                className="w-full px-3 py-2.5 bg-[#181c22] border border-[#2c323f] rounded-xl text-white text-sm outline-none focus:border-[#c5834e]"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">المدينة (اختياري)</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="طرابلس، بنغازي، مصراتة..."
                className="w-full px-3 py-2.5 bg-[#181c22] border border-[#2c323f] rounded-xl text-white text-sm outline-none focus:border-[#c5834e]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">اختر الباقة</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#181c22] border border-[#2c323f] rounded-xl text-white text-sm outline-none focus:border-[#c5834e]"
            >
              <option value="مجاني - شهر (0 د.ل)">⚡ مجاني — أول شهر (0 د.ل)</option>
              <option value="شهرين (75 د.ل)">🚀 شهرين (75 د.ل) — الأكثر طلباً</option>
              <option value="سنوي (250 د.ل)">💎 سنوي (250 د.ل) — الأوفر</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-bold mb-1">ملاحظة إضافية (اختياري)</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="أي استفسار أو تفاصيل إضافية عن المتجر..."
              className="w-full px-3 py-2 bg-[#181c22] border border-[#2c323f] rounded-xl text-white text-sm outline-none focus:border-[#c5834e] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <i className="fa-brands fa-whatsapp"></i> إرسال الطلب
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-[#181c22] hover:bg-[#20252e] text-slate-300 border border-[#2c323f] font-bold py-3 rounded-xl transition-all text-sm cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
