import AdminLayout from "@/components/AdminLayout";

/* Explicit type: both icon and dot are optional ──────── */
type CalEvent = {
  label: string;
  bg: string;
  text: string;
  icon?: string;   // Material Symbols icon name (takes priority over dot)
  dot?: string;    // Tailwind color class for the indicator dot
};

type CalDay = {
  day: number;
  grey?: boolean;
  today?: boolean;
  events: CalEvent[];
};

const calDays: CalDay[] = [
  {day:30,grey:true,events:[]},
  {day:1,events:[]},
  {day:2,events:[{label:"Reunión Cliente - Torres",bg:"bg-[#c2e8ff]",dot:"bg-[#001e2b]",text:"text-[#001e2b]"}]},
  {day:3,events:[]},
  {day:4,events:[{label:"Firma: Miraflores 402",bg:"bg-[#e9e0e1]",dot:"bg-[#1e1b1c]",text:"text-[#1e1b1c]"}]},
  {day:5,grey:true,events:[]},
  {day:6,grey:true,events:[]},
  {day:7,events:[{label:"Inicio Proyecto: Torre Q",bg:"bg-[#ffdcbf]",dot:"bg-[#2d1600]",text:"text-[#2d1600]"}]},
  {day:8,today:true,events:[{label:"Entrega Doc - Municipalidad",bg:"bg-[#eeeeef]",icon:"description",text:"text-[#41484c]"},{label:"Revisión Interna",bg:"bg-[#c2e8ff]",dot:"bg-[#001e2b]",text:"text-[#001e2b]"}]},
  {day:9,events:[]},{day:10,events:[]},{day:11,events:[]},
  {day:12,grey:true,events:[]},{day:13,grey:true,events:[]},
  {day:14,events:[]},{day:15,events:[]},{day:16,events:[]},{day:17,events:[]},{day:18,events:[]},
  {day:19,grey:true,events:[]},{day:20,grey:true,events:[]},
];

export default function SchedulePage() {
  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[28px] leading-[36px] font-semibold text-[#1a1c1d]">Calendario Administrativo</h2>
          <p className="text-sm text-[#72787c] mt-1">Administra eventos, hitos de proyectos y reuniones con clientes.</p>
        </div>
        <button className="bg-[#023143] text-white text-[12px] font-semibold px-6 py-2.5 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity shadow-[0_4px_20px_rgba(2,49,67,0.15)]">
          <span className="material-symbols-outlined text-[18px]">add</span>Nuevo Evento
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#c1c7cc] rounded-xl p-4 flex flex-wrap items-center gap-4 shadow-[0_4px_20px_rgba(2,49,67,0.02)]">
        <div className="flex items-center gap-2 text-[#72787c] text-[12px] font-semibold uppercase tracking-widest mr-2">
          <span className="material-symbols-outlined text-[18px]">filter_list</span>Filtros
        </div>
        {["Todos los Clientes","Todos los Proyectos","Empleado Asignado","Tipo de Evento"].map(f => (
          <button key={f} className="min-w-[180px] bg-[#f9f9fb] border border-[#e2e2e4] hover:border-[#c1c7cc] text-[#1a1c1d] text-sm rounded-lg px-4 py-2 flex items-center justify-between transition-colors">
            <span>{f}</span>
            <span className="material-symbols-outlined text-[#72787c]">expand_more</span>
          </button>
        ))}
        <button className="ml-auto text-[#023143] text-[12px] font-semibold hover:underline">Limpiar Filtros</button>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar */}
        <div className="lg:col-span-9 bg-white border border-[#e2e2e4] rounded-xl shadow-[0_4px_20px_rgba(2,49,67,0.03)] overflow-hidden flex flex-col">
          {/* Calendar Header */}
          <div className="px-6 py-4 border-b border-[#e2e2e4] flex items-center justify-between bg-[#f9f9fb]">
            <div className="flex items-center gap-4">
              <h3 className="text-[20px] font-semibold text-[#1a1c1d]">Octubre 2024</h3>
              <div className="flex items-center gap-1 bg-[#f9f9fb] border border-[#e2e2e4] rounded-lg p-0.5">
                <button className="p-1 rounded hover:bg-[#e2e2e4] text-[#72787c] transition-colors"><span className="material-symbols-outlined">chevron_left</span></button>
                <button className="px-3 py-1 text-[12px] font-semibold text-[#1a1c1d] hover:bg-[#e2e2e4] rounded transition-colors">Hoy</button>
                <button className="p-1 rounded hover:bg-[#e2e2e4] text-[#72787c] transition-colors"><span className="material-symbols-outlined">chevron_right</span></button>
              </div>
            </div>
            <div className="flex bg-[#f9f9fb] border border-[#e2e2e4] rounded-lg p-0.5">
              <button className="px-4 py-1.5 text-[12px] font-semibold bg-white text-[#1a1c1d] shadow-sm rounded-md transition-all">Mes</button>
              <button className="px-4 py-1.5 text-[12px] font-semibold text-[#72787c] hover:text-[#1a1c1d] rounded-md transition-all">Semana</button>
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 grid grid-cols-7 border-l border-[#e2e2e4]">
            {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(d => (
              <div key={d} className="py-3 text-center border-r border-b border-[#e2e2e4] bg-[#f9f9fb]">
                <span className="text-[12px] font-semibold text-[#72787c] uppercase">{d}</span>
              </div>
            ))}
            {calDays.map((cell) => (
              <div key={cell.day} className={`min-h-[120px] border-b border-r border-[#e2e2e4] p-2 flex flex-col gap-1 ${cell.grey ? "bg-[#f9f9fb]/30" : "cursor-pointer hover:bg-[#f4f3f5] transition-colors"}`}>
                <span className={`text-sm pl-1 ${cell.today ? "w-7 h-7 flex items-center justify-center bg-[#023143] text-white rounded-full font-semibold" : cell.grey ? "text-[#72787c]" : "text-[#1a1c1d]"}`}>
                  {cell.day}
                </span>
                {cell.events.map((ev, i) => (
                  <div key={i} className={`${ev.bg} rounded px-2 py-1 flex items-center gap-1 mt-0.5`}>
                    {ev.icon
                      ? <span className={`material-symbols-outlined text-[12px] ${ev.text}`}>{ev.icon}</span>
                      : <span className={`w-1.5 h-1.5 rounded-full ${ev.dot}`} />
                    }
                    <span className={`text-[11px] font-semibold truncate ${ev.text}`}>{ev.label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Side Panel */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Agenda */}
          <div className="bg-white border border-[#e2e2e4] rounded-xl p-6 shadow-[0_4px_20px_rgba(2,49,67,0.03)]">
            <h3 className="text-[20px] font-semibold text-[#1a1c1d] mb-6">Agenda - 8 Oct</h3>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="w-12 text-right pt-0.5">
                  <span className="text-[12px] font-semibold text-[#72787c] block">09:00</span>
                  <span className="text-[10px] text-[#72787c] block">AM</span>
                </div>
                <div className="flex-1 bg-[#f9f9fb] border border-[#c1c7cc] rounded-lg p-3 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#023143]" />
                  <h4 className="text-[12px] font-semibold text-[#1a1c1d] mb-1">Entrega Doc - Municipalidad</h4>
                  <p className="text-[13px] text-[#72787c] mb-2">Solicitudes de permisos para Torre Q.</p>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px] text-[#72787c]">location_on</span>
                    <span className="text-[12px] text-[#72787c]">Oficina Municipal</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 text-right pt-0.5">
                  <span className="text-[12px] font-semibold text-[#72787c] block">02:30</span>
                  <span className="text-[10px] text-[#72787c] block">PM</span>
                </div>
                <div className="flex-1 bg-[#c2e8ff] border border-[#a5cce3] rounded-lg p-3 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#023143]" />
                  <h4 className="text-[12px] font-semibold text-[#001e2b] mb-1">Revisión Interna</h4>
                  <p className="text-[13px] text-[#001e2b]/80 mb-2">Alineación de presupuesto trimestral.</p>
                  <div className="flex -space-x-2">
                    {[
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuA-jXd9xk28McoNdWaPD4iGE638qX1vvLlqJzxvihjKNqgW0IwZbCMdJHwCMjMUlleNIVHMENNnWVlR_yaWIcZVFAv5aeplEhIkZRCdMu7p4XP8g1WGdXe7zPiy_bOpskvp1iPv_SOPD7I2jq_OzY82WmUrKQXZRddzYodKSxXr60nuqfya-hvi-YwZzo3priAj6Ntv6LKthNHY7_scpx1hVp7mBqsQMGAudh_327xHkh0kMHWwLMVatYSSCIiTV8apLkxOgG3DuhQ1",
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuAkzy2QEf3OYfokmTxaeJuOBkVX_AJdmyOWiJdfwXgexitEgAwontcs30sY2xBFuNR1vCs4P3ODc8L0VvN8_HqgUChfih6ZZFYbA8ejsRJiI85SaPnYUa1VaT2wHp5mzvQiqfC3e3ZKfXl6P2QhjjKFpSmSqKVPITyR2cBwfnEepLVbOk5hC1eM2lkOOrTIZpgCnZ9aPIjWbz5grJt3Ly6MYDvqXmzwr56WdHIpgBI1z6AyU0UrhdAw264bBjxAnLGUjNMlVDHdp7FF"
                    ].map((src, i) => (
                      <img key={i} src={src} alt="Participant" className="w-6 h-6 rounded-full border border-white object-cover" />
                    ))}
                    <div className="w-6 h-6 rounded-full border border-white bg-white/50 flex items-center justify-center text-[10px] text-[#001e2b] font-semibold">+2</div>
                  </div>
                </div>
              </div>
            </div>
            <button className="w-full mt-6 py-2 border border-[#c1c7cc] text-[#1a1c1d] text-[12px] font-semibold rounded-lg hover:bg-[#f9f9fb] transition-colors">Ver Agenda Completa</button>
          </div>

          {/* Legend */}
          <div className="bg-white border border-[#e2e2e4] rounded-xl p-6 shadow-[0_4px_20px_rgba(2,49,67,0.03)]">
            <h3 className="text-[20px] font-semibold text-[#1a1c1d] mb-4">Leyenda de Eventos</h3>
            <div className="flex flex-col gap-3">
              {[
                {bg:"bg-[#c2e8ff] border-[#a5cce3]",label:"Reuniones de Clientes"},
                {bg:"bg-[#e9e0e1] border-[#cdc4c5]",label:"Fechas de Firma"},
                {bg:"bg-[#ffdcbf] border-[#f0bd8f]",label:"Inicios de Proyecto"},
                {bg:"bg-[#f9f9fb] border-[#c1c7cc]",label:"Entregas y Admin"},
              ].map(l => (
                <div key={l.label} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded ${l.bg} border`} />
                  <span className="text-sm text-[#1a1c1d]">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
