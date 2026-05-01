"use client";
import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";

const categories = ["Todos", "Contratos", "Correos", "Recibos", "Documentos"] as const;
type Cat = typeof categories[number];

const templates = [
  { id: 1, cat: "Contratos",  icon: "description",   title: "Acuerdo de Compra",       desc: "Plantilla de contrato estándar para compra de inmueble.",   updated: "hace 2 días",   uses: 148, color: "#023143", bg: "#c2e8ff" },
  { id: 2, cat: "Contratos",  icon: "description",   title: "Acuerdo de Separación",     desc: "Contrato de reserva de unidad y depósito de separación.", updated: "hace 5 días",   uses: 92,  color: "#023143", bg: "#c2e8ff" },
  { id: 3, cat: "Contratos",  icon: "description",   title: "Contrato de Arrendamiento",          desc: "Plantilla de arrendamiento residencial con cláusulas legales.",    updated: "hace 1 semana",   uses: 34,  color: "#023143", bg: "#c2e8ff" },
  { id: 4, cat: "Correos",     icon: "mail",          title: "Correo de Bienvenida",            desc: "Correo de integración enviado a nuevos clientes.",  updated: "Hoy",        uses: 215, color: "#1565C0", bg: "#E3F2FD" },
  { id: 5, cat: "Correos",     icon: "mail",          title: "Solicitud de Documento",         desc: "Solicitar documentos pendientes al cliente.",        updated: "hace 3 días",   uses: 77,  color: "#1565C0", bg: "#E3F2FD" },
  { id: 6, cat: "Correos",     icon: "mail",          title: "Recordatorio de Pago",         desc: "Recordatorio automático para próximas cuotas.",     updated: "hace 1 semana",   uses: 183, color: "#1565C0", bg: "#E3F2FD" },
  { id: 7, cat: "Recibos",   icon: "receipt_long",  title: "Recibo de Separación",       desc: "Recibo oficial por pago de separación.",          updated: "Ayer",    uses: 91,  color: "#E65100", bg: "#FFF3E0" },
  { id: 8, cat: "Recibos",   icon: "receipt_long",  title: "Confirmación de Pago",     desc: "Recibo de confirmación de pago de cuota.",         updated: "hace 4 días",   uses: 64,  color: "#E65100", bg: "#FFF3E0" },
  { id: 9, cat: "Documentos",  icon: "folder",        title: "Hoja de Perfil del Cliente",     desc: "Información estándar del cliente y documento KYC.",     updated: "hace 2 semanas",  uses: 29,  color: "#4b4546", bg: "#e9e0e1" },
  { id: 10, cat: "Documentos", icon: "folder",        title: "Informe de Progreso de Obra",  desc: "Informe semanal de progreso e hitos de obra.",     updated: "hace 3 días",   uses: 41,  color: "#4b4546", bg: "#e9e0e1" },
];

export default function TemplatesPage() {
  const [active, setActive] = useState<Cat>("All");
  const [search, setSearch] = useState("");
  const [previewId, setPreviewId] = useState<number | null>(null);

  const filtered = templates.filter(t =>
    (active === "Todos" || t.cat === active) &&
    (search === "" || t.title.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase()))
  );

  const preview = templates.find(t => t.id === previewId);

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex justify-between items-start animate-slide-up">
        <div>
          <h2 className="text-[30px] font-bold tracking-tight text-[#1a1c1d]">Plantillas</h2>
          <p className="text-[14px] text-[#41484c] mt-1">Administra y usa plantillas de documentos para contratos, correos y recibos.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-[#023143] text-white rounded-xl text-[13px] font-semibold hover:bg-[#001b27] transition-colors shadow-sm">
          <span className="material-symbols-outlined text-[17px]">add</span>Nueva Plantilla
        </button>
      </div>

      {/* Filter + Search */}
      <div className="flex items-center gap-4 animate-slide-up delay-50">
        <div className="flex bg-white border border-[#e2e2e4] rounded-xl p-1 gap-0.5">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setActive(c)}
              className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-150 ${
                active === c ? "bg-[#023143] text-white shadow-sm" : "text-[#41484c] hover:bg-[#f4f3f5]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#72787c] text-[17px]">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar plantillas..."
            className="w-full bg-white border border-[#e2e2e4] rounded-xl pl-9 pr-4 py-2 text-[13px] focus:outline-none focus:border-[#023143] transition-colors"
          />
        </div>
        <span className="ml-auto text-[12px] text-[#72787c] font-semibold">{filtered.length} plantillas</span>
      </div>

      {/* Grid + Preview */}
      <div className="flex gap-5 animate-slide-up delay-100">
        {/* Template grid */}
        <div className={`grid gap-4 ${previewId ? "grid-cols-2" : "grid-cols-3"} flex-1 content-start`}>
          {filtered.length === 0 && (
            <div className="col-span-3 py-16 text-center">
              <span className="material-symbols-outlined text-[48px] text-[#c1c7cc]">search_off</span>
              <p className="text-[14px] font-semibold text-[#72787c] mt-3">No se encontraron plantillas</p>
            </div>
          )}
          {filtered.map(t => (
            <div
              key={t.id}
              onClick={() => setPreviewId(previewId === t.id ? null : t.id)}
              className={`card p-5 cursor-pointer transition-all duration-200 ${previewId === t.id ? "border-[#023143] shadow-[0_0_0_2px_rgba(2,49,67,.15)]" : ""}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: t.bg }}>
                  <span className="material-symbols-outlined text-[20px]" style={{ color: t.color }}>{t.icon}</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: t.bg, color: t.color }}>{t.cat}</span>
              </div>
              <h3 className="text-[14px] font-bold text-[#1a1c1d] mb-1">{t.title}</h3>
              <p className="text-[12px] text-[#72787c] leading-relaxed mb-4 line-clamp-2">{t.desc}</p>
              <div className="flex items-center justify-between pt-3 border-t border-[#e2e2e4]">
                <div className="flex items-center gap-1 text-[11px] text-[#72787c]">
                  <span className="material-symbols-outlined text-[13px]">schedule</span>
                  {t.updated}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#72787c]">
                  <span className="material-symbols-outlined text-[13px]">bolt</span>
                  {t.uses} usos
                </div>
                <div className="flex gap-1">
                  <button onClick={e => { e.stopPropagation(); }} className="p-1.5 rounded-lg text-[#72787c] hover:text-[#023143] hover:bg-[#c2e8ff] transition-colors">
                    <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                  </button>
                  <button onClick={e => { e.stopPropagation(); }} className="p-1.5 rounded-lg text-[#72787c] hover:text-[#023143] hover:bg-[#c2e8ff] transition-colors">
                    <span className="material-symbols-outlined text-[15px]">edit</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Preview panel */}
        {preview && (
          <div className="w-72 shrink-0 card p-6 animate-slide-in-r self-start sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-bold text-[#1a1c1d]">Vista Previa</h3>
              <button onClick={() => setPreviewId(null)} className="w-6 h-6 flex items-center justify-center rounded-md text-[#72787c] hover:bg-[#e2e2e4] transition-colors">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: preview.bg }}>
              <span className="material-symbols-outlined text-[22px]" style={{ color: preview.color }}>{preview.icon}</span>
            </div>
            <h4 className="text-[15px] font-bold text-[#1a1c1d] mb-1">{preview.title}</h4>
            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-3" style={{ background: preview.bg, color: preview.color }}>{preview.cat}</span>
            <p className="text-[12px] text-[#41484c] leading-relaxed mb-4">{preview.desc}</p>
            <div className="space-y-2 text-[11px] text-[#72787c] mb-5">
              <div className="flex justify-between"><span>Última actualización</span><span className="font-semibold text-[#1a1c1d]">{preview.updated}</span></div>
              <div className="flex justify-between"><span>Usos totales</span><span className="font-semibold text-[#1a1c1d]">{preview.uses}</span></div>
            </div>
            {/* Document mockup */}
            <div className="bg-[#f9f9fb] border border-[#e2e2e4] rounded-lg p-3 mb-4 space-y-2">
              {[80,60,90,50,70,40].map((w,i) => (
                <div key={i} className="h-1.5 rounded-full bg-[#e2e2e4]" style={{ width: `${w}%` }} />
              ))}
            </div>
            <button className="w-full py-2.5 bg-[#023143] text-white rounded-xl text-[13px] font-semibold hover:bg-[#001b27] transition-colors">
              Usar Plantilla
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
