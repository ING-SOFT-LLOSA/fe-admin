"use client";
import { useState, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";

/* ── Types & constants ───────────────────────────────── */
type UpFile = { id: string; name: string; type: "photo"|"video"; preview: string; size: string; progress: number; done: boolean };
type Status = "draft"|"ready"|"sent"|"viewed";

const PROJECTS = ["Torre Aviana Residencial","Parque Sur","Edificio Central","Condominio Vista Mar"];
const STAGES   = ["Cimentación","Estructura","Fachadas","Acabados Interiores","Entrega"];
const FLOORS  = [
  { id:"p01", name:"Piso 01",       email:"proyecto-central@llosa.com",  initials:"01", color:"bg-[#023143] text-white"         },
  { id:"p02", name:"Piso 02",       email:"proyecto-central@llosa.com",  initials:"02", color:"bg-[#442605] text-[#ffdcbf]"    },
  { id:"p03", name:"Piso 03",       email:"proyecto-central@llosa.com",  initials:"03", color:"bg-[#c2e8ff] text-[#001b27]"    },
  { id:"p04", name:"Piso 04",       email:"proyecto-central@llosa.com",  initials:"04", color:"bg-[#e9e0e1] text-[#635d5e]"   },
];
const HISTORY: {id:number;title:string;project:string;status:Status;photos:number;vids:number;date:string}[] = [
  { id:1, title:"Torre Aviana – Semana 14",      project:"Torre Aviana",   status:"viewed", photos:3, vids:0, date:"20 Oct" },
  { id:2, title:"Parque Sur – Acabado Piso 5", project:"Parque Sur",     status:"sent",   photos:5, vids:1, date:"18 Oct" },
  { id:3, title:"Edificio Central – Fachada",   project:"Edificio Central",status:"draft", photos:2, vids:0, date:"15 Oct" },
];
const STATUS_STYLE: Record<Status,string> = {
  draft:"bg-[#e2e2e4] text-[#41484c]",
  ready:"bg-[#FFF3E0] text-[#E65100]",
  sent:"bg-[#c2e8ff] text-[#001e2b]",
  viewed:"bg-[#E8F5E9] text-[#2E7D32]",
};

let _uid = 0;
function uid() { return String(++_uid); }
function fmt(b:number){ if(b<1024) return b+"B"; if(b<1048576) return (b/1024).toFixed(1)+"KB"; return (b/1048576).toFixed(1)+"MB"; }

/* ── Toggle ──────────────────────────────────────────── */
function Toggle({on,onChange}:{on:boolean;onChange:()=>void}){
  return(
    <button onClick={onChange} className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${on?"bg-[#023143]":"bg-[#c1c7cc]"}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${on?"translate-x-5":"translate-x-0.5"}`}/>
    </button>
  );
}

/* ── Page ────────────────────────────────────────────── */
export default function ProgressPage() {
  const [files, setFiles]         = useState<UpFile[]>([]);
  const [title, setTitle]         = useState("");
  const [desc, setDesc]           = useState("");
  const [project, setProject]     = useState("");
  const [stage, setStage]         = useState("");
  const [clients, setClients]     = useState<string[]>([]);
  const [sendEmail, setSendEmail] = useState(true);
  const [drag, setDrag]           = useState(false);
  const [tab, setTab]             = useState<"all"|"photo"|"video">("all");
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sent, setSent]           = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(list:FileList|null){
    if(!list) return;
    Array.from(list).forEach(f=>{
      const isVid = f.type.startsWith("video/");
      const id = uid();
      const reader = new FileReader();
      reader.onload = e=>{
        const preview = isVid ? "" : (e.target?.result as string)||"";
        const up:UpFile = {id, name:f.name, type:isVid?"video":"photo", preview, size:fmt(f.size), progress:0, done:false};
        setFiles(prev=>[...prev,up]);
        let p=0;
        const t=setInterval(()=>{
          p=Math.min(p+Math.random()*25,100);
          setFiles(prev=>prev.map(x=>x.id===id?{...x,progress:Math.floor(p),done:p>=100}:x));
          if(p>=100) clearInterval(t);
        },120);
      };
      reader.readAsDataURL(f);
    });
  }

  const photos = files.filter(f=>f.type==="photo");
  const videos = files.filter(f=>f.type==="video");
  const shown  = tab==="all"?files:files.filter(f=>f.type===tab);
  const ready  = !!(title && project && clients.length>0 && files.some(f=>f.done));

  if(sent){
    return(
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center animate-scale-in">
          <div className="text-center max-w-xs">
            <div className="w-20 h-20 rounded-full bg-[#E8F5E9] flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-[44px] text-[#2E7D32]">check_circle</span>
            </div>
            <h2 className="text-[24px] font-bold text-[#1a1c1d] mb-2">¡Actualización Enviada!</h2>
            <p className="text-[13px] text-[#41484c] mb-1"><strong>"{title}"</strong> fue entregada a {clients.length} piso(s).</p>
            <p className="text-[12px] text-[#72787c] mb-8">{sendEmail?"Notificación por correo enviada.":"No se envió correo."}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={()=>{setSent(false);setFiles([]);setTitle("");setDesc("");setProject("");setStage("");setClients([]);}}
                className="px-5 py-2.5 bg-[#023143] text-white rounded-xl text-[13px] font-semibold hover:bg-[#001b27] transition-colors">
                Nueva Actualización
              </button>
              <button className="px-5 py-2.5 border border-[#e2e2e4] rounded-xl text-[13px] font-semibold text-[#41484c] hover:bg-[#f4f3f5] transition-colors">
                Ver Historial
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return(
    <AdminLayout>
      {/* ── Header ── */}
      <div className="flex justify-between items-start animate-slide-up">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-[28px] font-bold tracking-tight text-[#1a1c1d]">Actualización Visual de Progreso por Piso</h2>
            <p className="text-[13px] text-[#41484c] mt-0.5">Crea un reporte de obra y envíalo por proyecto y por piso.</p>
          </div>
          {ready && <span className="px-2.5 py-1 bg-[#FFF3E0] text-[#E65100] text-[10px] font-bold rounded-full uppercase tracking-wider animate-scale-in">Listo para enviar</span>}
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-[#e2e2e4] rounded-xl text-[13px] font-semibold text-[#41484c] hover:bg-[#f4f3f5] transition-colors flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[17px]">save</span>Guardar borrador
          </button>
          {ready && (
            <button onClick={()=>setShowPreview(true)} className="px-4 py-2 border border-[#023143] text-[#023143] rounded-xl text-[13px] font-semibold hover:bg-[#c2e8ff]/30 transition-colors flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[17px]">visibility</span>Vista previa
            </button>
          )}
          <button onClick={()=>ready&&setShowConfirm(true)} disabled={!ready}
            className="px-5 py-2 bg-[#023143] text-white rounded-xl text-[13px] font-semibold disabled:opacity-40 hover:bg-[#001b27] transition-colors flex items-center gap-1.5 shadow-sm">
            <span className="material-symbols-outlined text-[17px]">send</span>Enviar por piso
          </button>
        </div>
      </div>

      {/* ── 3-col grid ── */}
      <div className="grid grid-cols-12 gap-5 animate-slide-up delay-100">
        {/* Past updates */}
        <div className="col-span-3 card overflow-hidden self-start">
          <div className="px-4 py-3 border-b border-[#e2e2e4] bg-[#f9f9fb]">
            <p className="text-[12px] font-bold text-[#1a1c1d]">Historial de Actualizaciones</p>
          </div>
          <div className="divide-y divide-[#e2e2e4]">
            {HISTORY.map(h=>(
              <div key={h.id} className="px-4 py-3 hover:bg-[#f9f9fb] transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-[12px] font-semibold text-[#1a1c1d] leading-snug">{h.title}</p>
                  <span className={`shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${STATUS_STYLE[h.status]}`}>{h.status}</span>
                </div>
                <p className="text-[11px] text-[#72787c]">{h.project}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-[#72787c]">
                  <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">photo</span>{h.photos}</span>
                  {h.vids>0 && <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">videocam</span>{h.vids}</span>}
                  <span className="ml-auto">{h.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compose */}
        <div className="col-span-6 space-y-4">
          {/* Info */}
          <div className="card p-5 space-y-4">
            <h3 className="text-[13px] font-bold text-[#1a1c1d] flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#3d6377]">edit_note</span>Detalles de Actualización
            </h3>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Título de la actualización *"
              className="w-full border border-[#e2e2e4] rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#023143] focus:ring-2 focus:ring-[#023143]/10 transition-all"/>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={2} placeholder="Breve descripción de esta actualización de progreso..."
              className="w-full border border-[#e2e2e4] rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:border-[#023143] focus:ring-2 focus:ring-[#023143]/10 transition-all resize-none"/>
            <div className="grid grid-cols-2 gap-3">
              {[[project,setProject,PROJECTS,"Proyecto *"],[stage,setStage,STAGES,"Etapa / Hito"]].map(([val,setter,opts,label])=>(
                <div key={label as string}>
                  <label className="text-[10px] font-bold text-[#72787c] uppercase tracking-wider block mb-1">{label as string}</label>
                  <div className="relative">
                    <select value={val as string} onChange={e=>(setter as (v:string)=>void)(e.target.value)}
                      className="w-full appearance-none border border-[#e2e2e4] rounded-xl px-3 py-2.5 pr-8 text-[13px] bg-white focus:outline-none focus:border-[#023143]">
                      <option value="">Seleccionar...</option>
                      {(opts as string[]).map(o=><option key={o}>{o}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[#72787c] text-[16px] pointer-events-none">expand_more</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Media */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#3d6377]">photo_library</span>
              <h3 className="text-[13px] font-bold text-[#1a1c1d]">Archivos Multimedia</h3>
              {files.length>0 && <span className="ml-auto text-[11px] text-[#72787c]">{photos.length} fotos · {videos.length} videos</span>}
            </div>

            {/* Drop zone */}
            <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
              onDrop={e=>{e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files);}}
              onClick={()=>inputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl py-8 px-4 text-center cursor-pointer transition-all duration-200 ${drag?"border-[#023143] bg-[#c2e8ff]/20 scale-[1.01]":"border-[#e2e2e4] hover:border-[#023143]/40 hover:bg-[#f9f9fb]"}`}>
              <input ref={inputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={e=>addFiles(e.target.files)}/>
              <span className={`material-symbols-outlined text-[44px] mb-2 block transition-colors ${drag?"text-[#023143]":"text-[#c1c7cc]"}`}>cloud_upload</span>
              <p className="text-[13px] font-semibold text-[#1a1c1d]">{drag?"Suelta aquí":"Arrastra y suelta fotos y videos"}</p>
              <p className="text-[11px] text-[#72787c] mt-0.5">o haz clic para buscar · JPG, PNG, MP4, MOV</p>
            </div>

            {/* Gallery */}
            {files.length>0 && (
              <>
                <div className="flex gap-1 bg-[#f4f3f5] rounded-lg p-1 w-fit">
                  {(["all","photo","video"] as const).map(t=>(
                    <button key={t} onClick={()=>setTab(t)}
                      className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${tab===t?"bg-white text-[#1a1c1d] shadow-sm":"text-[#72787c] hover:text-[#1a1c1d]"}`}>
                      {t==="all"?`Todos (${files.length})`:t==="photo"?`Fotos (${photos.length})`:`Videos (${videos.length})`}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {shown.map(f=>(
                    <div key={f.id} className="relative group aspect-square rounded-xl overflow-hidden bg-[#f4f3f5] border border-[#e2e2e4]">
                      {f.type==="photo"&&f.preview
                        ? <img src={f.preview} alt={f.name} className="w-full h-full object-cover"/>
                        : <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-1">
                            <span className="material-symbols-outlined text-[28px] text-[#72787c]">{f.type==="video"?"play_circle":"image"}</span>
                            <span className="text-[9px] text-[#72787c] text-center truncate w-full px-1">{f.name}</span>
                          </div>
                      }
                      {!f.done && (
                        <div className="absolute inset-0 bg-[#001b27]/75 flex flex-col items-center justify-center gap-2">
                          <span className="text-white text-[12px] font-bold">{f.progress}%</span>
                          <div className="w-3/4 bg-white/20 rounded-full h-1 overflow-hidden">
                            <div className="bg-white h-full rounded-full transition-all" style={{width:`${f.progress}%`}}/>
                          </div>
                        </div>
                      )}
                      {f.done && (
                        <button onClick={()=>setFiles(prev=>prev.filter(x=>x.id!==f.id))}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                          <span className="material-symbols-outlined text-[12px]">close</span>
                        </button>
                      )}
                      {f.done && <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1 py-0.5 rounded bg-black/50 text-white">{f.type==="video"?"▶":"📷"}</span>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recipients */}
        <div className="col-span-3 space-y-4">
          <div className="card p-5 space-y-3">
            <h3 className="text-[13px] font-bold text-[#1a1c1d] flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#3d6377]">apartment</span>Pisos destinatarios *
            </h3>
            <button
              onClick={() => setClients(clients.length === FLOORS.length ? [] : FLOORS.map((f) => f.id))}
              className="w-full text-left px-3 py-2 rounded-lg border border-[#c1c7cc] text-[11px] font-semibold text-[#023143] hover:bg-[#f4f3f5]"
            >
              Marcar todos
            </button>
            {FLOORS.map(c=>(
              <button key={c.id} onClick={()=>setClients(prev=>prev.includes(c.id)?prev.filter(x=>x!==c.id):[...prev,c.id])}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all ${clients.includes(c.id)?"border-[#023143] bg-[#c2e8ff]/20":"border-[#e2e2e4] hover:border-[#023143]/30"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${c.color}`}>{c.initials}</div>
                <div className="text-left flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-[#1a1c1d] truncate">{c.name}</p>
                  <p className="text-[10px] text-[#72787c] truncate">{c.email}</p>
                </div>
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${clients.includes(c.id)?"border-[#023143] bg-[#023143]":"border-[#c1c7cc]"}`}>
                  {clients.includes(c.id) && <span className="material-symbols-outlined text-white text-[11px]">check</span>}
                </div>
              </button>
            ))}
            {clients.length>0 && <p className="text-[11px] text-[#3d6377] font-semibold pt-1">{clients.length} piso(s) seleccionado(s)</p>}
          </div>

          {/* Email toggle */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#3d6377]">mail</span>
                <span className="text-[13px] font-bold text-[#1a1c1d]">Notificación por Correo</span>
              </div>
              <Toggle on={sendEmail} onChange={()=>setSendEmail(!sendEmail)}/>
            </div>
            <p className="text-[11px] text-[#72787c]">{sendEmail?"Se enviará un correo al equipo del proyecto por cada piso seleccionado.":"No se enviará ningún correo."}</p>
          </div>

          {/* Summary */}
          {ready && (
            <div className="card p-5 border-[#023143]/30 bg-[#c2e8ff]/10 animate-scale-in">
              <p className="text-[12px] font-bold text-[#023143] mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">checklist</span>Resumen
              </p>
              <div className="space-y-1.5 text-[11px] text-[#41484c]">
                <p><span className="font-semibold text-[#1a1c1d]">Título:</span> {title}</p>
                <p><span className="font-semibold text-[#1a1c1d]">Proyecto:</span> {project}</p>
                {stage && <p><span className="font-semibold text-[#1a1c1d]">Etapa:</span> {stage}</p>}
                <p><span className="font-semibold text-[#1a1c1d]">Archivos:</span> {photos.filter(f=>f.done).length} fotos, {videos.filter(f=>f.done).length} videos</p>
                <p><span className="font-semibold text-[#1a1c1d]">Destinatarios:</span> {clients.length}</p>
                <p><span className="font-semibold text-[#1a1c1d]">Correo:</span> {sendEmail?"Sí":"No"}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Preview modal ── */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in" onClick={()=>setShowPreview(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="p-6 border-b border-[#e2e2e4] flex items-center justify-between bg-[#f9f9fb] rounded-t-2xl">
              <div>
                <p className="text-[10px] font-bold text-[#72787c] uppercase tracking-wider mb-1">Vista Previa del Cliente</p>
                <h3 className="text-[18px] font-bold text-[#1a1c1d]">{title||"Actualización sin título"}</h3>
                <p className="text-[12px] text-[#72787c] mt-0.5">{project}{stage?" · "+stage:""}</p>
              </div>
              <button onClick={()=>setShowPreview(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#72787c] hover:bg-[#e2e2e4] transition-colors">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="p-6 space-y-5">
              {desc && <p className="text-[13px] text-[#41484c] leading-relaxed bg-[#f9f9fb] rounded-xl p-4">{desc}</p>}
              {files.filter(f=>f.done).length>0 && (
                <div>
                  <p className="text-[11px] font-bold text-[#72787c] uppercase tracking-wider mb-3">Adjuntos</p>
                  <div className="grid grid-cols-3 gap-3">
                    {files.filter(f=>f.done).map(f=>(
                      <div key={f.id} className="aspect-square rounded-xl overflow-hidden bg-[#f4f3f5] border border-[#e2e2e4]">
                        {f.type==="photo"&&f.preview
                          ? <img src={f.preview} alt={f.name} className="w-full h-full object-cover"/>
                          : <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                              <span className="material-symbols-outlined text-[32px] text-[#72787c]">play_circle</span>
                              <span className="text-[10px] text-[#72787c]">{f.name}</span>
                            </div>
                        }
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 pt-2 border-t border-[#e2e2e4]">
                <span className="material-symbols-outlined text-[#72787c] text-[16px]">lock</span>
                <p className="text-[11px] text-[#72787c]">Los clientes pueden ver estos archivos pero no pueden editarlos ni descargarlos.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-[#c2e8ff] flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[#023143] text-[24px]">send</span>
            </div>
            <h3 className="text-[18px] font-bold text-[#1a1c1d] text-center mb-1">¿Enviar Actualización?</h3>
            <p className="text-[13px] text-[#41484c] text-center mb-5">
              <strong>"{title}"</strong> será enviada a <strong>{clients.length}</strong> piso(s).
              {sendEmail?" También se enviará una notificación por correo.":""}
            </p>
            <div className="flex gap-3">
              <button onClick={()=>setShowConfirm(false)} className="flex-1 py-2.5 border border-[#e2e2e4] rounded-xl text-[13px] font-semibold text-[#41484c] hover:bg-[#f4f3f5] transition-colors">Cancelar</button>
              <button onClick={()=>{setShowConfirm(false);setSent(true);}} className="flex-1 py-2.5 bg-[#023143] text-white rounded-xl text-[13px] font-semibold hover:bg-[#001b27] transition-colors">Confirmar y Enviar</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
