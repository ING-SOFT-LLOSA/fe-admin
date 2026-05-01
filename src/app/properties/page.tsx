import AdminLayout from "@/components/AdminLayout";

export default function PropertiesPage() {
  const units = [
    {project:"Torre Lumiere",tower:"North",floor:"04",dept:"402",area:"85.5",price:"$ 210,000",status:"Disponible",statusBg:"bg-[#E8F5E9] text-[#2E7D32]",client:"-",clientItalic:true},
    {project:"Torre Lumiere",tower:"North",floor:"04",dept:"403",area:"110.0",price:"$ 285,000",status:"Separado",statusBg:"bg-[#FFF3E0] text-[#E65100]",client:"Carlos Mendoza",clientItalic:false},
    {project:"Residencial Verano",tower:"Block A",floor:"01",dept:"101",area:"145.2",price:"$ 340,000",status:"En Contrato",statusBg:"bg-[#E3F2FD] text-[#1565C0]",client:"Familia Rojas",clientItalic:false},
    {project:"Edificio Prisma",tower:"Unique",floor:"12",dept:"1205",area:"65.0",price:"$ 155,000",status:"Vendido",statusBg:"bg-[#e2e2e4] text-[#1a1c1d]",client:"Andrea Solis",clientItalic:false},
    {project:"Torre Lumiere",tower:"South",floor:"08",dept:"801",area:"90.5",price:"$ 230,000",status:"Bloqueado",statusBg:"bg-[#FFEBEE] text-[#C62828]",client:"Internal Hold",clientItalic:true},
  ];

  return (
    <AdminLayout>
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-[36px] leading-[44px] font-bold tracking-[-0.02em] text-[#1a1c1d]">Propiedades y Unidades</h2>
          <p className="text-sm text-[#41484c] mt-1">Administra inventario, sigue el estado de unidades y asigna clientes.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-[#e2e2e4] rounded-xl text-[#1a1c1d] text-xs font-semibold hover:bg-[#eeeeef] transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">download</span>Exportar Lista
          </button>
          <button className="px-4 py-2 bg-[#023143] text-white rounded-xl text-xs font-semibold hover:bg-[#001b27] transition-colors flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>Nueva Unidad
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#e2e2e4] p-4 flex gap-4 items-end shadow-[0_4px_20px_rgba(2,49,67,0.02)]">
        {[
          {label:"Proyecto",options:["Todos los Proyectos","Torre Lumiere","Residencial Verano","Edificio Prisma"]},
          {label:"Torre / Bloque",options:["Todas las Torres","Torre A","Torre B"]},
          {label:"Estado",options:["Todos los Estados","Disponible","Separado","En Contrato","Vendido","Bloqueado"]},
        ].map(f => (
          <div key={f.label} className="flex-1">
            <label className="text-[12px] font-semibold text-[#41484c] mb-1 block">{f.label}</label>
            <select className="w-full h-10 bg-[#f9f9fb] border border-[#e2e2e4] rounded-xl text-sm px-3 focus:outline-none focus:border-[#023143]">
              {f.options.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div className="w-px h-10 bg-[#e2e2e4] mx-2" />
        <button className="h-10 px-4 text-[#023143] text-xs font-semibold hover:bg-[#eeeeef] rounded-xl transition-colors">Limpiar Filtros</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e2e2e4] shadow-[0_4px_20px_rgba(2,49,67,0.03)] overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e2e2e4] bg-[#f9f9fb]">
                {["Proyecto","Torre / Bloque","Piso","Nro Dpto","Área (m²)","Precio (USD)","Estado","Cliente Asignado","Acciones"].map(h => (
                  <th key={h} className="py-4 px-4 first:pl-6 last:pr-6 text-[12px] font-semibold text-[#023143] uppercase tracking-wider last:text-right">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm text-[#1a1c1d]">
              {units.map((u) => (
                <tr key={u.dept} className="border-b border-[#e2e2e4] hover:bg-[#f4f3f5]/50 transition-colors group">
                  <td className="py-4 pl-6 pr-4 font-medium">{u.project}</td>
                  <td className="py-4 px-4 text-[#41484c]">{u.tower}</td>
                  <td className="py-4 px-4">{u.floor}</td>
                  <td className="py-4 px-4 font-medium">{u.dept}</td>
                  <td className="py-4 px-4 text-[#41484c]">{u.area}</td>
                  <td className="py-4 px-4">{u.price}</td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase ${u.statusBg}`}>{u.status}</span>
                  </td>
                  <td className={`py-4 px-4 text-sm ${u.clientItalic ? "italic text-[#41484c]" : "font-medium"}`}>{u.client}</td>
                  <td className="py-4 px-4 pr-6 text-right">
                    <button className="text-[#41484c] hover:text-[#023143] transition-colors opacity-0 group-hover:opacity-100">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-[#e2e2e4] bg-[#f9f9fb] flex items-center justify-between mt-auto">
          <span className="text-xs text-[#41484c]">Mostrando 1 a 5 de 124 unidades</span>
          <div className="flex gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded border border-[#e2e2e4] text-[#41484c] disabled:opacity-50" disabled>
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-[#023143] text-white text-xs font-semibold">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-[#e2e2e4] text-[#1a1c1d] hover:bg-[#eeeeef] text-xs">2</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-[#e2e2e4] text-[#1a1c1d] hover:bg-[#eeeeef] text-xs">3</button>
            <button className="w-8 h-8 flex items-center justify-center rounded border border-[#e2e2e4] text-[#41484c] hover:bg-[#eeeeef]">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
