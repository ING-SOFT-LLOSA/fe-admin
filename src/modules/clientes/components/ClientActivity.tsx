import { ClienteAssignment } from "@/types/user";

type ClientActivityProps = {
  readonly assignments: readonly ClienteAssignment[];
  readonly clientCreatedAt?: string;
};

interface ActivityEvent {
  date: string;
  label: string;
  icon: string;
  color: string; // dot color
}

function buildTimeline(assignments: readonly ClienteAssignment[], clientCreatedAt?: string): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  // Assignment events
  for (const a of assignments) {
    if (a.status === "Vigente") {
      events.push({
        date: a.assignedAt,
        label: `Se asignó ${a.unitLabel} en ${a.projectName}`,
        icon: "key",
        color: "bg-[#2E7D32]",
      });
    } else {
      events.push({
        date: a.assignedAt,
        label: `Se desvinculó ${a.unitLabel} en ${a.projectName}`,
        icon: "link_off",
        color: "bg-[#ba1a1a]",
      });
    }
  }

  // Client creation
  if (clientCreatedAt) {
    events.push({
      date: clientCreatedAt,
      label: "Cliente registrado en el sistema",
      icon: "person_add",
      color: "bg-build-main",
    });
  }

  // Sort newest first
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return events;
}

function formatRelativeDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 30) return `Hace ${diffDays} días`;
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `Hace ${months} ${months === 1 ? "mes" : "meses"}`;
  }
  const years = Math.floor(diffDays / 365);
  return `Hace ${years} ${years === 1 ? "año" : "años"}`;
}

function formatLocalTimestamp(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  
  // Determinar si la cadena de fecha contiene información de hora
  const hasTime = dateStr.includes("T") || dateStr.includes(":") || dateStr.length > 10;
  
  if (!hasTime) {
    return d.toLocaleDateString("es-PE");
  }

  return `${d.toLocaleDateString("es-PE")} ${d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function ClientActivity({ assignments, clientCreatedAt }: Readonly<ClientActivityProps>) {
  const timeline = buildTimeline(assignments, clientCreatedAt);

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
      <h3 className="text-base font-bold text-build-main dark:text-white flex items-center gap-2 mb-5">
        <span className="material-symbols-outlined text-arch-gold">history</span>
        <span>Actividad Reciente</span>
      </h3>

      {timeline.length === 0 ? (
        <div className="text-center py-6 text-slate-500 dark:text-white/50 bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-300 dark:border-white/10">
          <p className="text-sm">Sin actividad registrada.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-white/5" />
          <div className="space-y-5">
            {timeline.map((event, i) => (
              <div key={`${event.date}-${i}`} className="relative pl-8">
                {/* Timeline dot */}
                <div
                  className={`absolute left-[5px] top-1 w-3 h-3 rounded-full ring-4 ring-white dark:ring-[#1a1c1d] ${event.color}`}
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="material-symbols-outlined text-arch-gold text-[16px]">{event.icon}</span>
                    <p className="text-sm font-semibold text-build-main dark:text-white">{event.label}</p>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-white/40 mt-1">
                    {formatRelativeDate(event.date)} · {formatLocalTimestamp(event.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
