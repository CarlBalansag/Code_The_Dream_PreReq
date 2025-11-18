"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, X, Info } from "lucide-react";

/**
 * Toast Notification Component
 * Displays temporary notification messages
 *
 * @param {string} message - Message to display
 * @param {string} type - Type of toast: 'success', 'error', or 'info'
 * @param {function} onClose - Function to close the toast
 */
export function Toast({ message, type = "success", onClose }) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    info: Info,
  };

  const Icon = icons[type] || icons.info;

  const bgColors = {
    success: "bg-[#1DB954]",
    error: "bg-red-500",
    info: "bg-gray-700",
  };

  const textColors = {
    success: "text-black",
    error: "text-white",
    info: "text-white",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`${bgColors[type]} ${textColors[type]} px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-[500px]`}
    >
      <Icon size={20} />
      <span className="font-medium flex-1">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 hover:opacity-70 transition-opacity"
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}

/**
 * Toast Container Component
 * Manages positioning of multiple toasts
 */
export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-24 right-4 z-[60] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
