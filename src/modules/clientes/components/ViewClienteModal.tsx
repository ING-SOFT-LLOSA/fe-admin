"use client";

import type { ClienteRow } from "@/types/user";

type ViewClienteModalProps = {
  open: boolean;
  cliente: ClienteRow | null;
  onClose: () => void;
};

export default function ViewClienteModal({ open, cliente, onClose }: ViewClienteModalProps) {
  if (!open || !cliente) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a0e]/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up relative">
        {/* Header decoration */}
        <div className="h-24 bg-build-main relative">
          <div className="absolute -bottom-8 left-8 w-16 h-16 rounded-full bg-build-bg border-4 border-white flex items-center justify-center text-build-main text-xl font-bold shadow-sm">
            {cliente.initials}
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="pt-10 px-8 pb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-[20px] font-bold text-build-main">{cliente.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${cliente.statusBg}`}
                >
                  {cliente.status}
                </span>
                <span className="text-[12px] text-slate-500 font-medium">
                  {cliente.tipoUsuario === "EMPLEADO" ? cliente.rol : "Cliente"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Correo electrónico
              </label>
              <div className="text-sm font-semibold text-build-main flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-build-accent">mail</span>
                {cliente.email}
              </div>
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Teléfono
              </label>
              <div className="text-sm font-semibold text-build-main flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-build-accent">call</span>
                {cliente.phone}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Documento (DNI/RUC)
              </label>
              <div className="text-sm font-semibold text-build-main flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-build-accent">badge</span>
                {cliente.dni}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Propiedades vinculadas
              </label>
              <div className="text-sm font-semibold text-build-main flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-build-accent">apartment</span>
                {cliente.project}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-100 text-build-main rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
