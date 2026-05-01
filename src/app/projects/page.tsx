import AdminLayout from "@/components/AdminLayout";

const projects = [
  {
    name: "Residencial Los Álamos", location: "Miraflores, Lima",
    timeline: "Ene 2024 - Dic 2025", status: "En Construcción",
    statusBg: "bg-[#c2e8ff] text-[#244b5e]", depts: 45, floors: 15, progress: 60,
    progressBg: "bg-[#023143]",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBaMdtnBtNKx8EUmod5u0LLnn5Nd1-tp2RWS3bwYHlxuq4XlO2yjFECTNKCfq0tzr_ID3L78xKnaIG_jIrtxWHWjQkhtU_GbKqJnIswIGgEuDjdciq5EZy2EIWE6MZXd4A4w9-SanWCZTpCucTK8MM6nD3U8Ef7R2O4kje46zCE21rSCPI1NmqNnlOkN5MTUgOpdW0Ktn-fE08ScCipYR6jHcHeCStwfbR6wS3GpVLiG1QJ7d-NouyXIsp-smjfwSOCgjAolRSSpIpL"
  },
  {
    name: "Torre Empresarial San Isidro", location: "San Isidro, Lima",
    timeline: "Mar 2023 - Jun 2024", status: "Entregado",
    statusBg: "bg-[#e2e2e4] text-[#41484c]", depts: 120, floors: 24, progress: 100,
    progressBg: "bg-[#635d5e]",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAq9HoxKOpZTKeaSnrR8Tcdzk52Lvtz3YUAP9yWJujF1DN9_nZJfDTkcthKiXZrur3bbCuw4-rrAcgm_Ze9ckDUUaH1M8kY9wnFE5yAdfXLjpzT4HlfVqMlhEwoVy2WIBSPwOvPkJNURO5Ulm1u9x3zCc1PPhD8FjktNjmgY7A20R0tS2rcCJ0JHgVp-8O4EY_JjhNn_IYCrTj1mpGLGyQ01MdkyB774FBrRLfXsahxd0DGNAC7q7AWNG9j8w7f8JMM7Cy3S4qPQjmg"
  },
  {
    name: "Condominio Vista Mar", location: "Barranco, Lima",
    timeline: "Sep 2024 - Ago 2026", status: "En Planos",
    statusBg: "bg-[#e9e0e1] text-[#696364]", depts: 60, floors: 12, progress: 5,
    progressBg: "bg-[#696364]", img: null
  },
  {
    name: "Edificio Central", location: "Surco, Lima",
    timeline: "Feb 2024 - Nov 2025", status: "En Venta",
    statusBg: "bg-[#ffdcbf] text-[#623f1c]", depts: 30, floors: 10, progress: 40,
    progressBg: "bg-[#442605]",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAH7SbfKIqAa__c0i92xzDhu6WzGS8bMOYND30-4aM_lfgWPZ5ciwQPrP3R3vWGbZ4G9qOu6t7glUXhCxPqVFZICngVKNca0c20EsGIVfBhdQ_z8HcyOzRmCH3Irj9oCOHGx4sATA3qohdH2ILC_fqRlR6kPoAU2lPqoIWfxPp4Pjgei0PVxy7CokHiPEl5cOnP49IlMSnD-dgGGBsoVynYFB8DuvuHGlkiAs5X9SyWjjCn8ggrpvECCGND5N9jp0HcoFKkkPBwLRyt"
  },
];

const kpis = [
  {icon:"domain",label:"Proyectos Totales",val:24,bg:"bg-[#c2e8ff]",iconColor:"text-[#244b5e]"},
  {icon:"engineering",label:"En Construcción",val:8,bg:"bg-[#e9e0e1]",iconColor:"text-[#696364]"},
  {icon:"real_estate_agent",label:"En Venta",val:12,bg:"bg-[#ffdcbf]",iconColor:"text-[#623f1c]"},
  {icon:"check_circle",label:"Entregados",val:4,bg:"bg-[#e2e2e4]",iconColor:"text-[#41484c]"},
];

export default function ProjectsPage() {
  return (
    <AdminLayout>
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[36px] leading-[44px] font-bold tracking-[-0.02em] text-[#1a1c1d]">Portafolio de Proyectos</h1>
          <p className="text-base text-[#41484c] mt-2">Administra proyectos, sigue el avance de obra y supervisa los cronogramas.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-4 py-2 border border-[#c1c7cc] rounded-lg text-xs font-semibold text-[#1a1c1d] hover:bg-[#e2e2e4] transition-colors">
            <span className="material-symbols-outlined text-sm">apartment</span>Plantilla de edificio
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-[#c1c7cc] rounded-lg text-xs font-semibold text-[#1a1c1d] hover:bg-[#e2e2e4] transition-colors">
            <span className="material-symbols-outlined text-sm">send</span>Enviar por Piso
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#023143] text-white rounded-lg text-xs font-semibold hover:bg-[#001b27] transition-colors shadow-sm">
            <span className="material-symbols-outlined text-sm">add</span>Nuevo Proyecto
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-6">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-[#c1c7cc] p-6 shadow-[0_4px_20px_rgba(2,49,67,0.02)]">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-full ${k.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined text-sm ${k.iconColor}`}>{k.icon}</span>
              </div>
              <span className="text-[12px] font-semibold text-[#41484c]">{k.label}</span>
            </div>
            <div className="text-[28px] font-semibold text-[#1a1c1d]">{k.val}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-[#c1c7cc] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(2,49,67,0.02)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f9f9fb] border-b border-[#e2e2e4]">
              {["Proyecto","Cronograma","Estado","Pisos","Dptos","Progreso","Acciones"].map(h => (
                <th key={h} className={`py-4 px-6 text-[12px] font-semibold text-[#023143] uppercase tracking-wider ${h==="Acciones"?"text-right w-24":h==="Proyecto"?"w-1/3":""}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e2e4]">
            {projects.map(p => (
              <tr key={p.name} className="hover:bg-[#f9f9fb] transition-colors group">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-4 cursor-pointer">
                    <div className="w-12 h-12 rounded-lg bg-[#e2e2e4] overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {p.img
                        ? <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                        : <span className="material-symbols-outlined text-[#72787c]">architecture</span>
                      }
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[#1a1c1d] group-hover:text-[#023143] transition-colors">{p.name}</h3>
                      <div className="flex items-center gap-1 text-[#41484c] text-xs mt-1">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        <span>{p.location}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-[#1a1c1d]">{p.timeline}</td>
                <td className="py-4 px-6">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase ${p.statusBg}`}>{p.status}</span>
                </td>
                <td className="py-4 px-6 text-base font-semibold text-[#1a1c1d]">{p.floors}</td>
                <td className="py-4 px-6 text-base font-semibold text-[#1a1c1d]">{p.depts}</td>
                <td className="py-4 px-6 w-1/4">
                  <div className="flex items-center gap-3">
                    <div className="w-full bg-[#e2e2e4] rounded-full h-1.5 overflow-hidden">
                      <div className={`${p.progressBg} h-1.5 rounded-full`} style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className="text-[12px] font-semibold text-[#41484c] w-8">{p.progress}%</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-[#72787c] hover:text-[#023143] hover:bg-[#c2e8ff] rounded-md transition-colors">
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button className="p-2 text-[#72787c] hover:text-[#1a1c1d] hover:bg-[#e2e2e4] rounded-md transition-colors">
                      <span className="material-symbols-outlined text-sm">more_vert</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-6 py-4 border-t border-[#e2e2e4] bg-[#f9f9fb] flex justify-between items-center">
          <span className="text-sm text-[#41484c]">Mostrando 1 a 4 de 24 proyectos</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-[#c1c7cc] rounded bg-white text-[#72787c] hover:bg-[#e2e2e4] transition-colors disabled:opacity-50" disabled>Ant</button>
            <button className="px-3 py-1 border border-[#c1c7cc] rounded bg-[#023143] text-white">1</button>
            <button className="px-3 py-1 border border-[#c1c7cc] rounded bg-white text-[#1a1c1d] hover:bg-[#e2e2e4] transition-colors">2</button>
            <button className="px-3 py-1 border border-[#c1c7cc] rounded bg-white text-[#1a1c1d] hover:bg-[#e2e2e4] transition-colors">3</button>
            <button className="px-3 py-1 border border-[#c1c7cc] rounded bg-white text-[#72787c] hover:bg-[#e2e2e4] transition-colors">Sig</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
