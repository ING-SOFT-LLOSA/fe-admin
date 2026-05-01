"use client";
import { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";

/* ── Mini sparkline (CSS bars) ──────────────────────── */
function Spark({ values, color }: { values: number[]; color: string }) {
  return (
    <div className="flex items-end gap-px h-7 opacity-60">
      {values.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm transition-all" style={{ height: `${v}%`, backgroundColor: color }} />
      ))}
    </div>
  );
}

/* ── Animated number ────────────────────────────────── */
function Counter({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const step = target / 40;
    let cur = 0;
    const t = setInterval(() => {
      cur = Math.min(cur + step, target);
      setVal(Math.floor(cur));
      if (cur >= target) clearInterval(t);
    }, 20);
    return () => clearInterval(t);
  }, [target]);
  return <>{val.toLocaleString()}</>;
}

/* ── Data ───────────────────────────────────────────── */
const kpis = [
  { label: "Clientes Activos",    val: 1248, trend: "+12%", up: true,  icon: "group",          bg: "#c2e8ff", ic: "#001e2b", spark: [40,55,50,70,65,80,75] },
  { label: "Separaciones",       val: 42,   trend: "+5%",  up: true,  icon: "real_estate_agent", bg: "#ffdcbf", ic: "#2d1600", spark: [30,45,40,60,55,65,70] },
  { label: "Contratos Ptes.", val: 18,   trend: "alto", up: false, icon: "pending_actions",  bg: "#ffdad6", ic: "#93000a", spark: [60,50,65,70,55,75,80] },
  { label: "Contratos Firmados",  val: 315,  trend: "+8%",  up: true,  icon: "verified",         bg: "#e9e0e1", ic: "#4b4546", spark: [50,60,55,75,70,80,85] },
  { label: "Proyectos Activos",   val: 6,    trend: "estable", up: true, icon: "architecture",   bg: "#d1fae5", ic: "#065f46", spark: [60,60,65,60,65,65,65] },
];

const alerts = [
  { icon: "warning",            color: "#ba1a1a", bg: "#ffdad6", title: "3 separaciones expiran en 48h",     action: "Revisar", priority: "Crítico" },
  { icon: "payments",           color: "#E65100", bg: "#FFF3E0", title: "Cliente JD no pagó 2da cuota",   action: "Seguimiento",  priority: "Alto"     },
  { icon: "record_voice_over",  color: "#1565C0", bg: "#E3F2FD", title: "7 clientes VIP sin contactar 30 días", action: "Contactar",   priority: "Medio"   },
];

const activity = [
  { icon: "contract",       color: "#023143", bg: "#c2e8ff", text: "Contrato firmado — Torre A Apt 402",    who: "Juan Doe",      time: "10:30 AM" },
  { icon: "payments",       color: "#2E7D32", bg: "#E8F5E9", text: "Separación pagada — Los Pinos Lote 12", who: "Maria Smith",   time: "Ayer" },
  { icon: "description",    color: "#E65100", bg: "#FFF3E0", text: "Faltan documentos — Edificio Of. 205", who: "Carlos Ruiz",   time: "24 Oct" },
  { icon: "event_available",color: "#023143", bg: "#e9e0e1", text: "Reunión confirmada — Firma Lote 12",  who: "Admin",         time: "23 Oct" },
  { icon: "person_add",     color: "#4b4546", bg: "#e2e2e4", text: "Nuevo cliente registrado — Elena Vargas", who: "Equipo Ventas",    time: "22 Oct" },
];

const projects = [
  { name: "Torre A Residencial",       pct: 75, color: "#023143" },
  { name: "Edificio Central",          pct: 40, color: "#442605" },
  { name: "Residencial Los Álamos",    pct: 60, color: "#023143" },
  { name: "Condominio Vista Mar",      pct: 5,  color: "#72787c" },
];

export default function DashboardPage() {
  return (
    <AdminLayout>
      {/* ── Header ── */}
      <div className="flex justify-between items-start animate-slide-up">
        <div>
          <p className="text-[12px] font-semibold text-[#72787c] uppercase tracking-widest mb-1">
            {new Date().toLocaleDateString("es-ES", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
          <h2 className="text-[30px] font-bold tracking-tight text-[#1a1c1d]">Resumen del Dashboard</h2>
          <p className="text-[14px] text-[#41484c] mt-1">Aquí tienes el resumen administrativo de hoy.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-[#e2e2e4] rounded-xl text-[13px] font-semibold text-[#41484c] hover:bg-[#f4f3f5] transition-colors">
            <span className="material-symbols-outlined text-[17px]">download</span>Exportar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#023143] text-white rounded-xl text-[13px] font-semibold hover:bg-[#001b27] transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[17px]">add</span>Nuevo
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-5 gap-4">
        {kpis.map((k, i) => (
          <div key={k.label} className={`card p-5 animate-slide-up delay-${i === 0 ? "50" : i === 1 ? "100" : i === 2 ? "150" : i === 3 ? "200" : "300"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: k.bg }}>
                <span className="material-symbols-outlined text-[17px]" style={{ color: k.ic }}>{k.icon}</span>
              </div>
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${k.up ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#ffdad6] text-[#93000a]"}`}>
                {k.trend}
              </span>
            </div>
            <div className="text-[26px] font-bold text-[#1a1c1d] leading-none mb-0.5">
              <Counter target={k.val} />
            </div>
            <p className="text-[11px] text-[#72787c] font-medium mb-3">{k.label}</p>
            <Spark values={k.spark} color={k.ic} />
          </div>
        ))}
      </div>

      {/* ── Intelligence Alerts ── */}
      <div className="bg-[#001b27] rounded-2xl p-5 animate-slide-up delay-200">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#c2e8ff] text-[18px]">psychology</span>
          <span className="text-[11px] font-bold text-[#c2e8ff] uppercase tracking-widest">Alertas de Inteligencia</span>
          <span className="ml-auto text-[10px] bg-[#ba1a1a] text-white font-bold px-2 py-0.5 rounded-full animate-pulse-soft">3 activas</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {alerts.map((a) => (
            <div key={a.title} className="rounded-xl p-4 flex flex-col gap-2" style={{ background: a.bg + "22", border: `1px solid ${a.bg}44` }}>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 shrink-0" style={{ background: a.bg }}>
                  <span className="material-symbols-outlined text-[15px]" style={{ color: a.color }}>{a.icon}</span>
                </div>
                <p className="text-[12px] font-semibold text-white leading-snug">{a.title}</p>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: a.bg + "44", color: a.bg }}>{a.priority}</span>
                <button className="text-[11px] font-semibold text-white/70 hover:text-white transition-colors flex items-center gap-1">
                  {a.action} <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Activity + Projects ── */}
      <div className="grid grid-cols-3 gap-5 animate-slide-up delay-300">
        {/* Activity timeline */}
        <div className="col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[16px] font-bold text-[#1a1c1d]">Actividad Reciente</h3>
            <button className="text-[12px] font-semibold text-[#3d6377] hover:text-[#023143] transition-colors">Ver todo →</button>
          </div>
          <div className="space-y-4">
            {activity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: a.bg }}>
                  <span className="material-symbols-outlined text-[15px]" style={{ color: a.color }}>{a.icon}</span>
                </div>
                <div className="flex-1 min-w-0 py-0.5">
                  <p className="text-[13px] font-medium text-[#1a1c1d] leading-snug">{a.text}</p>
                  <p className="text-[11px] text-[#72787c] mt-0.5">{a.who}</p>
                </div>
                <span className="text-[11px] text-[#72787c] shrink-0 mt-0.5">{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Project health */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[16px] font-bold text-[#1a1c1d]">Salud de Proyectos</h3>
            <span className="text-[11px] font-semibold text-[#72787c]">{projects.length} activos</span>
          </div>
          <div className="space-y-5">
            {projects.map((p) => (
              <div key={p.name}>
                <div className="flex justify-between items-center mb-1.5">
                  <p className="text-[12px] font-semibold text-[#1a1c1d] truncate pr-2">{p.name}</p>
                  <span className="text-[12px] font-bold shrink-0" style={{ color: p.color }}>{p.pct}%</span>
                </div>
                <div className="w-full bg-[#f4f3f5] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${p.pct}%`, background: p.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-[#e2e2e4]">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-[22px] font-bold text-[#023143]">6</p>
                <p className="text-[10px] text-[#72787c] font-semibold">Activos</p>
              </div>
              <div className="text-center">
                <p className="text-[22px] font-bold text-[#2E7D32]">4</p>
                <p className="text-[10px] text-[#72787c] font-semibold">Entregados</p>
              </div>
              <div className="text-center">
                <p className="text-[22px] font-bold text-[#E65100]">2</p>
                <p className="text-[10px] text-[#72787c] font-semibold">En riesgo</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
