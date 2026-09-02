import React from "react";
import { ToastMessage } from "../types";

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      id="toastContainer"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-auto w-[90%] max-w-[380px]"
    >
      {toasts.map((toast) => {
        let style = "bg-[#064e3b] border-emerald-500 text-emerald-200";
        let icon = "fa-solid fa-circle-check text-emerald-400";
        if (toast.type === "error") {
          style = "bg-[#7f1d1d] border-red-500 text-red-200";
          icon = "fa-solid fa-circle-xmark text-red-400";
        } else if (toast.type === "info") {
          style = "bg-[#1e3a5f] border-blue-500 text-blue-200";
          icon = "fa-solid fa-circle-info text-blue-400";
        }

        return (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`cursor-pointer px-4 py-3 rounded-xl border text-xs font-bold text-center flex items-center justify-between shadow-2xl transition-all duration-300 animate-fadeInUp ${style}`}
          >
            <div className="flex items-center gap-2">
              <i className={`${icon} text-sm`}></i>
              <span>{toast.message}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="text-xs opacity-60 hover:opacity-100 px-1"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};
