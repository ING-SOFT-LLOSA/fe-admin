"use client";
import EmployeeLayout from "@/components/EmployeeLayout";

const advances = [
  { id: 1, title: "Vaciado de losa 4to piso", project: "Torre A", stage: "Estructura", date: "Hoy", state: "Borrador" },
  { id: 2, title: "Instalación de drywall interiores", project: "Torre A", stage: "Acabados", date: "Ayer", state: "Listo para enviar" },
  { id: 3, title: "Excavación profunda terminada", project: "Edificio Central", stage: "Cimentación", date: "15 Oct", state: "Enviado" },
  { id: 4, title: "Pintura fachada oeste", project: "Los Pinos", stage: "Acabados Exteriores", date: "10 Oct", state: "Visto por cliente" },
];

const stateColors: Record<string, { bg: string; text: string }> = {
  "Borrador": { bg: "#e2e2e4", text: "#41484c" },
  "Listo para enviar": { bg: "#ffdcbf", text: "#2d1600" },
  "Enviado": { bg: "#c2e8ff", text: "#001e2b" },
  "Visto por cliente": { bg: "#E8F5E9", text: "#2E7D32" },
};

export default function EmployeeProgressPage() {
  return (
    <EmployeeLayout>
      <div className="flex justify-between items-start animate-slide-up">
        <div>
          <h2 className="text-[28px] font-bold tracking-tight text-[#1a1c1d]">Avances de Obra</h2>
          <p className="text-[14px] text-[#41484c] mt-1">Sube fotos y videos para enviar al portal de tus clientes.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mt-4 animate-slide-up delay-100">
        {/* Formulario de Subida */}
        <div className="col-span-1 card p-6">
          <h3 className="text-[16px] font-bold text-[#1a1c1d] mb-4">Nuevo Avance</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-[#72787c] uppercase tracking-widest mb-1.5">Título del avance</label>
              <input type="text" placeholder="Ej. Vaciado de cimientos" className="w-full px-3 py-2 border border-[#e2e2e4] rounded-lg text-[13px] focus:outline-none focus:border-[#023143] focus:ring-1 focus:ring-[#023143]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#72787c] uppercase tracking-widest mb-1.5">Proyecto</label>
                <select className="w-full px-3 py-2 border border-[#e2e2e4] rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#023143]">
                  <option>Seleccionar...</option>
                  <option>Torre A</option>
                  <option>Edificio Central</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#72787c] uppercase tracking-widest mb-1.5">Etapa / Hito</label>
                <select className="w-full px-3 py-2 border border-[#e2e2e4] rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#023143]">
                  <option>Estructura</option>
                  <option>Acabados</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#72787c] uppercase tracking-widest mb-1.5">Descripción</label>
              <textarea rows={3} placeholder="Detalles técnicos u observaciones..." className="w-full px-3 py-2 border border-[#e2e2e4] rounded-lg text-[13px] focus:outline-none focus:border-[#023143] focus:ring-1 focus:ring-[#023143] resize-none" />
            </div>
            
            {/* Upload Area */}
            <div>
              <label className="block text-[11px] font-bold text-[#72787c] uppercase tracking-widest mb-1.5">Archivos multimedia</label>
              <div className="border-2 border-dashed border-[#c1c7cc] bg-[#f9f9fb] rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#f4f3f5] transition-colors group">
                <span className="material-symbols-outlined text-[32px] text-[#72787c] group-hover:text-[#023143] transition-colors">cloud_upload</span>
                <p className="text-[13px] font-bold text-[#1a1c1d] mt-2">Haz clic para subir</p>
                <p className="text-[11px] text-[#72787c] mt-0.5">Fotos (JPG/PNG) o Videos (MP4)</p>
              </div>
            </div>

            <button className="w-full py-2.5 bg-[#023143] text-white font-bold text-[13px] rounded-lg hover:bg-[#001b27] transition-colors mt-2">
              Guardar Borrador
            </button>
          </div>
        </div>

        {/* Lista de Avances */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[16px] font-bold text-[#1a1c1d]">Historial de Avances</h3>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-[#f4f3f5] border border-[#e2e2e4] rounded-full text-[11px] font-bold text-[#41484c]">Todos</span>
              <span className="px-3 py-1 text-[#72787c] hover:bg-[#f4f3f5] rounded-full text-[11px] font-bold transition-colors cursor-pointer">Borradores</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {advances.map((a) => (
              <div key={a.id} className="card p-4 flex gap-4 items-center">
                <div className="w-20 h-16 bg-[#e2e2e4] rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                  <span className="material-symbols-outlined text-[#72787c]">image</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-[14px] font-bold text-[#1a1c1d]">{a.title}</p>
                    <span
                      className="px-2 py-0.5 text-[10px] font-bold rounded-full whitespace-nowrap"
                      style={{ backgroundColor: stateColors[a.state]?.bg, color: stateColors[a.state]?.text }}
                    >
                      {a.state}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#41484c] mt-0.5">{a.project} • {a.stage}</p>
                  <p className="text-[10px] font-bold text-[#72787c] mt-1.5 uppercase tracking-widest">{a.date}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0 border-l border-[#e2e2e4] pl-4">
                  {a.state === "Borrador" || a.state === "Listo para enviar" ? (
                    <>
                      <button className="text-[12px] font-bold text-[#023143] hover:underline text-left">Editar</button>
                      <button className="text-[12px] font-bold text-[#2E7D32] hover:underline text-left">Enviar a clientes</button>
                    </>
                  ) : (
                    <button className="text-[12px] font-bold text-[#72787c] hover:text-[#1a1c1d] hover:underline text-left">Ver detalle</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
