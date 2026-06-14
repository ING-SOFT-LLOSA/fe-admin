"use client";

interface DialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void; // If not provided, acts as an alert (only single confirm button)
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "info" | "success" | "warning" | "danger";
}

export default function DialogModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  type = "info",
}: DialogModalProps) {
  if (!isOpen) return null;

  // Configure icon and colors based on dialog type
  let iconName = "info";
  let iconColorClass = "text-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400";
  let buttonColorClass = "bg-build-main hover:bg-build-main/90 text-white";

  if (type === "success") {
    iconName = "check_circle";
    iconColorClass = "text-green-500 bg-green-50 dark:bg-green-950/30 dark:text-green-400";
    buttonColorClass = "bg-green-600 hover:bg-green-700 text-white";
  } else if (type === "warning") {
    iconName = "warning";
    iconColorClass = "text-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 dark:text-yellow-400";
    buttonColorClass = "bg-yellow-600 hover:bg-yellow-700 text-white";
  } else if (type === "danger") {
    iconName = "error";
    iconColorClass = "text-red-500 bg-red-50 dark:bg-red-950/30 dark:text-red-400";
    buttonColorClass = "bg-red-600 hover:bg-red-700 text-white";
  }

  const handleConfirmClick = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a0e]/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#111827] shadow-2xl p-6 relative flex flex-col border border-slate-200 dark:border-white/10 animate-fade-in">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          type="button"
          aria-label="Cerrar"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="flex gap-4 items-start mt-2">
          {/* Status Icon */}
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconColorClass}`}>
            <span className="material-symbols-outlined text-[24px]">{iconName}</span>
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-white/60 leading-relaxed whitespace-pre-wrap">
              {message}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-5 mt-3 border-t border-slate-100 dark:border-white/5">
          {onConfirm && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-build-main dark:hover:text-white rounded-lg transition-colors"
              type="button"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirmClick}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${buttonColorClass}`}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
