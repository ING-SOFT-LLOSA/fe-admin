import AdminLayout from "@/components/AdminLayout";

export default function ClientsPage() {
  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-[36px] leading-[44px] font-bold tracking-[-0.02em] text-[#1a1c1d]">Gestión de Clientes</h2>
          <p className="text-base text-[#41484c] mt-2">Administra registros de clientes, contactos y su historial de compras.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-[#e2e2e4] rounded-xl text-[#1a1c1d] text-xs font-semibold hover:bg-[#eeeeef] transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">download</span>Exportar Lista
          </button>
          <button className="px-4 py-2 bg-[#023143] text-white rounded-xl text-xs font-semibold hover:bg-[#001b27] transition-colors flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">add</span>Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#e2e2e4] p-4 flex gap-4 items-end shadow-[0_4px_20px_rgba(2,49,67,0.02)]">
        <div className="flex-1">
          <label className="text-[12px] font-semibold text-[#41484c] mb-1 block">Buscar</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#72787c] text-sm">search</span>
            <input type="text" placeholder="Buscar clientes..." className="w-full pl-9 pr-4 py-2 bg-[#f9f9fb] border border-[#e2e2e4] rounded-xl text-sm focus:outline-none focus:border-[#023143]" />
          </div>
        </div>
        <div className="flex-1">
          <label className="text-[12px] font-semibold text-[#41484c] mb-1 block">Estado</label>
          <select className="w-full h-10 bg-[#f9f9fb] border border-[#e2e2e4] rounded-xl text-sm px-3 focus:outline-none focus:border-[#023143]">
            <option>Todos los Estados</option>
            <option>Activo</option>
            <option>Inactivo</option>
            <option>VIP</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="text-[12px] font-semibold text-[#41484c] mb-1 block">Proyecto</label>
          <select className="w-full h-10 bg-[#f9f9fb] border border-[#e2e2e4] rounded-xl text-sm px-3 focus:outline-none focus:border-[#023143]">
            <option>Todos los Proyectos</option>
            <option>Torre Aviana</option>
            <option>Parque Sur</option>
            <option>Vistas del Golf</option>
          </select>
        </div>
        <button className="h-10 px-4 text-[#023143] text-xs font-semibold hover:bg-[#eeeeef] rounded-xl transition-colors">Limpiar</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e2e2e4] shadow-[0_4px_20px_rgba(2,49,67,0.03)] overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e2e2e4] bg-[#f9f9fb]">
                {["Cliente","DNI / RUC","Email","Teléfono","Proyecto","Estado","Acciones"].map(h => (
                  <th key={h} className="py-4 px-6 text-[12px] font-semibold text-[#023143] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm text-[#1a1c1d]">
              {[
                {initials:"CM",name:"Carlos Eduardo Mendoza",dni:"45892103",email:"c.mendoza@example.com",phone:"+51 987 654 321",project:"Torre Aviana - 1402",status:"Active",statusBg:"bg-[#E8F5E9] text-[#2E7D32]"},
                {initials:"MR",name:"Maria Fernanda Rojas",dni:"38471922",email:"m.rojas@example.com",phone:"+51 965 432 109",project:"Parque Sur - 501",status:"VIP",statusBg:"bg-[#c2e8ff] text-[#001e2b]"},
                {initials:"LD",name:"Luis Delgado Torres",dni:"52013847",email:"l.delgado@example.com",phone:"+51 941 238 765",project:"Torre Aviana - 1104",status:"Active",statusBg:"bg-[#E8F5E9] text-[#2E7D32]"},
                {initials:"EV",name:"Elena Vargas Castro",dni:"61204837",email:"e.vargas@example.com",phone:"+51 912 345 678",project:"Parque Sur - 802",status:"Inactive",statusBg:"bg-[#eeeeef] text-[#41484c]"},
              ].map((c) => (
                <tr key={c.dni} className="border-b border-[#e2e2e4] hover:bg-[#f4f3f5]/50 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#e9e0e1] flex items-center justify-center text-[#696364] text-xs font-bold">{c.initials}</div>
                      <span className="font-medium">{c.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-[#41484c]">{c.dni}</td>
                  <td className="py-4 px-6 text-[#3d6377]">{c.email}</td>
                  <td className="py-4 px-6 text-[#41484c]">{c.phone}</td>
                  <td className="py-4 px-6 text-[#41484c]">{c.project}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase ${c.statusBg}`}>{c.status}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
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
          <span className="text-xs text-[#41484c]">Mostrando 1 a 4 de 248 clientes</span>
          <div className="flex gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded border border-[#e2e2e4] text-[#41484c] hover:bg-[#eeeeef] disabled:opacity-50" disabled>
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
