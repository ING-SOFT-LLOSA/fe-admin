"use client";
import EmployeeLayout from "@/components/EmployeeLayout";

const contracts = [
  { id: 1, client: "Familia Gómez", project: "Los Pinos", apt: "Lote 12", state: "Generado", deadline: "30 Oct", resp: "Juan Empleado" },
  { id: 2, client: "Carlos Ruiz", project: "Torre A", apt: "402", state: "Pendiente de firma", deadline: "Hoy", resp: "Juan Empleado" },
  { id: 3, client: "Ana Soto", project: "Edificio Central", apt: "Of 205", state: "En revisión", deadline: "02 Nov", resp: "Juan Empleado" },
  { id: 4, client: "Luis Vargas", project: "Torre A", apt: "305", state: "Firmado", deadline: "-", resp: "Juan Empleado" },
  { id: 5, client: "Empresa XYZ", project: "Edificio Central", apt: "Of 101", state: "Legalizado", deadline: "-", resp: "Juan Empleado" },
];

const stateColors: Record<string, { bg: string; text: string }> = {
  "En revisión": { bg: "#FFF3E0", text: "#E65100" },
  "Generado": { bg: "#E3F2FD", text: "#1565C0" },
  "Pendiente de firma": { bg: "#ffdcbf", text: "#2d1600" },
  "Firmado": { bg: "#E8F5E9", text: "#2E7D32" },
  "Legalizado": { bg: "#c2e8ff", text: "#001e2b" },
  "Digitalizado": { bg: "#e2e2e4", text: "#41484c" },
  "Enviado": { bg: "#d1fae5", text: "#065f46" },
};

export default function EmployeeContractsPage() {
  return (
    <EmployeeLayout>
      <div className="flex justify-between items-start animate-slide-up">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-[#1a1c1d]">Mis Contratos</h2>
          <p className="text-[14px] text-[#41484c] mt-1">Gestión de contratos donde eres el responsable asignado.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mt-4 animate-slide-up delay-100">
        {contracts.map((c) => (
          <div key={c.id} className="card p-5 flex items-center gap-6">
            <div className="w-12 h-12 rounded-xl bg-[#f4f3f5] flex items-center justify-center shrink-0 border border-[#e2e2e4]">
              <span className="material-symbols-outlined text-[#72787c] text-[24px]">description</span>
            </div>
            
            <div className="flex-1 grid grid-cols-5 gap-4 items-center">
              <div>
                <p className="text-[11px] font-bold text-[#72787c] uppercase tracking-widest mb-1">Cliente</p>
                <p className="text-[14px] font-bold text-[#1a1c1d]">{c.client}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#72787c] uppercase tracking-widest mb-1">Unidad</p>
                <p className="text-[13px] font-medium text-[#41484c]">{c.project} - {c.apt}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#72787c] uppercase tracking-widest mb-1">Fecha Límite</p>
                <p className={`text-[13px] font-bold ${c.deadline === "Hoy" ? "text-[#ba1a1a]" : "text-[#41484c]"}`}>{c.deadline}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#72787c] uppercase tracking-widest mb-1">Estado</p>
                <span
                  className="px-2.5 py-1 text-[11px] font-bold rounded-full whitespace-nowrap inline-block"
                  style={{ backgroundColor: stateColors[c.state]?.bg, color: stateColors[c.state]?.text }}
                >
                  {c.state}
                </span>
              </div>
              <div className="flex justify-end gap-2">
                <button title="Ver contrato" className="p-2 text-[#72787c] hover:text-[#023143] hover:bg-[#e2e2e4] rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                </button>
                <button title="Subir documento" className="p-2 text-[#72787c] hover:text-[#2E7D32] hover:bg-[#E8F5E9] rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                </button>
                <button title="Marcar avance" className="p-2 text-[#72787c] hover:text-[#E65100] hover:bg-[#FFF3E0] rounded-lg transition-colors">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </EmployeeLayout>
  );
}
