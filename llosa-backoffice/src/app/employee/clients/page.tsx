"use client";
import EmployeeLayout from "@/components/EmployeeLayout";

const clients = [
  { id: 1, name: "Carlos Ruiz", project: "Torre A", apt: "402", state: "Firma pendiente", lastInteraction: "Hace 2 días", nextAction: "Llamar para confirmar firma" },
  { id: 2, name: "Familia Gómez", project: "Los Pinos", apt: "Lote 12", state: "Separación pagada", lastInteraction: "Ayer", nextAction: "Enviar borrador de contrato" },
  { id: 3, name: "Ana Soto", project: "Edificio Central", apt: "Of 205", state: "Interesado", lastInteraction: "Hace 5 días", nextAction: "Solicitar DNI/RUC" },
  { id: 4, name: "Luis Vargas", project: "Torre A", apt: "305", state: "En seguimiento de obra", lastInteraction: "Hace 1 mes", nextAction: "Enviar fotos de avance" },
  { id: 5, name: "Empresa XYZ", project: "Edificio Central", apt: "Of 101", state: "Contrato generado", lastInteraction: "Hace 3 días", nextAction: "Esperar revisión legal" },
];

const stateColors: Record<string, { bg: string; text: string }> = {
  "Interesado": { bg: "#e2e2e4", text: "#41484c" },
  "Separación pagada": { bg: "#E8F5E9", text: "#2E7D32" },
  "Contrato en revisión": { bg: "#FFF3E0", text: "#E65100" },
  "Contrato generado": { bg: "#E3F2FD", text: "#1565C0" },
  "Firma pendiente": { bg: "#ffdcbf", text: "#2d1600" },
  "En seguimiento de obra": { bg: "#c2e8ff", text: "#001e2b" },
};

export default function EmployeeClientsPage() {
  return (
    <EmployeeLayout>
      <div className="flex justify-between items-start animate-slide-up">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-[#1a1c1d]">Mis Clientes</h2>
          <p className="text-[14px] text-[#41484c] mt-1">Directorio de clientes que tienes asignados.</p>
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#72787c] text-[18px]">search</span>
          <input
            type="text"
            placeholder="Buscar cliente..."
            className="w-64 pl-10 pr-4 py-2 border border-[#e2e2e4] rounded-xl text-[13px] text-[#1a1c1d] focus:outline-none focus:border-[#023143] focus:ring-1 focus:ring-[#023143]"
          />
        </div>
      </div>

      <div className="card mt-2 overflow-hidden animate-slide-up delay-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#e2e2e4] bg-[#f9f9fb]">
              <th className="py-4 px-6 text-[11px] font-bold text-[#72787c] uppercase tracking-wider">Cliente</th>
              <th className="py-4 px-6 text-[11px] font-bold text-[#72787c] uppercase tracking-wider">Proyecto</th>
              <th className="py-4 px-6 text-[11px] font-bold text-[#72787c] uppercase tracking-wider">Departamento</th>
              <th className="py-4 px-6 text-[11px] font-bold text-[#72787c] uppercase tracking-wider">Estado</th>
              <th className="py-4 px-6 text-[11px] font-bold text-[#72787c] uppercase tracking-wider">Última Interacción</th>
              <th className="py-4 px-6 text-[11px] font-bold text-[#72787c] uppercase tracking-wider">Próxima Acción</th>
              <th className="py-4 px-6 text-[11px] font-bold text-[#72787c] uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e2e4]">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-[#f4f3f5] transition-colors group">
                <td className="py-4 px-6">
                  <p className="text-[14px] font-bold text-[#1a1c1d]">{c.name}</p>
                </td>
                <td className="py-4 px-6 text-[13px] text-[#41484c] font-medium">{c.project}</td>
                <td className="py-4 px-6 text-[13px] text-[#41484c] font-medium">{c.apt}</td>
                <td className="py-4 px-6">
                  <span
                    className="px-2.5 py-1 text-[11px] font-bold rounded-full whitespace-nowrap"
                    style={{ backgroundColor: stateColors[c.state]?.bg, color: stateColors[c.state]?.text }}
                  >
                    {c.state}
                  </span>
                </td>
                <td className="py-4 px-6 text-[13px] text-[#72787c]">{c.lastInteraction}</td>
                <td className="py-4 px-6 text-[13px] text-[#41484c] font-medium">{c.nextAction}</td>
                <td className="py-4 px-6 text-right">
                  <button className="p-2 text-[#72787c] hover:text-[#023143] hover:bg-[#e2e2e4] rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </EmployeeLayout>
  );
}
