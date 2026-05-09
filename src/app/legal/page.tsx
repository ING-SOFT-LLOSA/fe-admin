"use client";
import React, { useState } from "react";
import AdminLayout from "@/components/AdminLayout";

const INITIAL_DOCS = [
  { id: "doc_1", name: "Minuta de Compraventa", type: "Minuta", date: "12 Oct 2023", size: "2.4 MB" },
  { id: "doc_2", name: "Recibo Adelanto", type: "Recibo", date: "14 Oct 2023", size: "1.1 MB" },
];

export default function ContractsPage() {
  // Navigation / Search State
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  // Docs State
  const [docs, setDocs] = useState(INITIAL_DOCS);

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  // Viewing State (Signed URL Simulation)
  const [isViewing, setIsViewing] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<any>(null);

  // Deleting State
  const [isDeleting, setIsDeleting] = useState(false);
  const [docToDelete, setDocToDelete] = useState<any>(null);

  function handleFileSelection(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");
    setUploadSuccess("");

    // Validation 1: Format
    if (file.type !== "application/pdf") {
      setUploadError("Error: Solo se permiten documentos en formato PDF para expedientes legales.");
      return;
    }

    // Validation 2: Size (Max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Error: El archivo excede el límite permitido de 10MB para almacenamiento S3.");
      return;
    }

    // Validation passed -> Simulate S3 upload
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      const newDoc = {
        id: `doc_${Date.now()}`,
        name: file.name,
        type: "Documento Legal",
        date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
        size: (file.size / (1024 * 1024)).toFixed(1) + " MB"
      };
      setDocs([newDoc, ...docs]);
      setUploadSuccess("Documento legal cargado y vinculado exitosamente al contenedor privado (S3).");

      setTimeout(() => setUploadSuccess(""), 4000);
    }, 2000);
  }

  function simulateViewSignedUrl(doc: any) {
    setViewingDoc(doc);
    setIsViewing(true);

    // Simulate API fetch delay to get Signed URL
    setTimeout(() => {
      setIsViewing(false);
      setViewingDoc(null);
      // In a real app we would open a new tab with the URL here.
      alert(`Simulación: Se abrió en una nueva pestaña usando la Signed URL segura de Amazon S3.\n\nDocumento: ${doc.name}\nExpira en: 5 minutos.`);
    }, 1500);
  }

  function openDeleteSafe(doc: any) {
    setDocToDelete(doc);
  }

  function confirmDelete() {
    setIsDeleting(true);
    setTimeout(() => {
      setIsDeleting(false);
      setDocs(docs.filter(d => d.id !== docToDelete.id));
      setDocToDelete(null);
    }, 1000);
  }

  return (
    <AdminLayout>
      {/* CU009 Page Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-[36px] leading-[44px] font-bold tracking-[-0.02em] text-[#001b27]">Expedientes Legales</h1>
          <p className="text-base text-[#41484c] mt-2">Centraliza y custodia documentos jurídicos. El acceso y descarga están protegidos por URLs firmadas.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 shadow-[0_4px_20px_rgba(2,49,67,0.05)] mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-bold text-[#72787c] uppercase tracking-wider block mb-1">Proyecto</label>
            <select className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] bg-[#f9f9fb] focus:outline-none focus:border-[#023143]">
              <option>Torre Aviana Residencial</option>
              <option>Parque Sur</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-[#72787c] uppercase tracking-wider block mb-1">Buscar Número de Unidad</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej. 1402"
                className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[#023143]"
              />
              <button
                onClick={() => setSelectedUnit("1402")}
                className="px-4 bg-[#023143] text-white rounded-lg text-sm font-bold hover:bg-[#001b27] transition-all"
              >
                Buscar
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedUnit ? (
        <div className="grid grid-cols-12 gap-6 animate-fade-in">
          {/* Main Detail Panel */}
          <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-[0_4px_20px_rgba(2,49,67,0.05)]">
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-[#E5E7EB]">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="px-2 py-1 bg-[#c2e8ff] text-[#001e2b] text-[12px] font-semibold rounded uppercase">Activo</span>
                    <span className="text-[12px] font-semibold text-[#72787c]">ID: CTR-2023-0842</span>
                  </div>
                  <h3 className="text-[28px] leading-[36px] font-semibold text-[#001b27]">Torre Aviana - Unidad {selectedUnit}</h3>
                  <p className="text-sm text-[#41484c]">Cliente asociado: Carlos Mendoza</p>
                </div>
              </div>

              {/* Uploader Section */}
              <div className="mb-8">
                <h4 className="text-[16px] font-bold text-[#1a1c1d] mb-4">Subir Nuevo Documento</h4>

                {/* Feedback States */}
                {uploadError && (
                  <div className="p-4 mb-4 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl flex items-center gap-3 text-[#ba1a1a] animate-fade-in">
                    <span className="material-symbols-outlined">error</span>
                    <p className="text-[13px] font-bold">{uploadError}</p>
                  </div>
                )}
                {uploadSuccess && (
                  <div className="p-4 mb-4 bg-[#d6f0e0] border border-[#27a85e]/20 rounded-xl flex items-center gap-3 text-[#1c663b] animate-fade-in">
                    <span className="material-symbols-outlined">check_circle</span>
                    <p className="text-[13px] font-bold">{uploadSuccess}</p>
                  </div>
                )}

                {isUploading ? (
                  <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-[#c1c7cc] rounded-xl bg-[#f9f9fb]">
                    <svg className="animate-spin w-8 h-8 text-[#023143] mb-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    <p className="text-[13px] font-bold text-[#1a1c1d]">Validando PDF y cifrando hacia Amazon S3...</p>
                  </div>
                ) : (
                  <div className="flex gap-4 items-center">
                    <label className="flex-1 border-2 border-dashed border-[#c1c7cc] bg-[#f9f9fb] hover:bg-[#e2e2e4] transition-colors rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer">
                      <div className="flex items-center gap-2 text-[#023143]">
                        <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                        <span className="text-[14px] font-bold">Seleccionar archivo PDF</span>
                      </div>
                      <span className="text-[11px] text-[#72787c] mt-1">Máximo 10MB</span>
                      <input type="file" accept=".pdf" className="hidden" onChange={handleFileSelection} />
                    </label>
                  </div>
                )}
              </div>

              {/* Documents Table */}
              <div>
                <h4 className="text-[16px] font-bold text-[#1a1c1d] mb-4">Expedientes Almacenados</h4>
                {docs.length === 0 ? (
                  <p className="text-[13px] text-[#72787c] italic text-center py-6">No hay documentos cargados en esta unidad.</p>
                ) : (
                  <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-[#f9f9fb] border-b border-[#E5E7EB]">
                        <tr>
                          <th className="px-4 py-3 text-[11px] font-bold text-[#72787c] uppercase">Documento</th>
                          <th className="px-4 py-3 text-[11px] font-bold text-[#72787c] uppercase">Fecha de Carga</th>
                          <th className="px-4 py-3 text-[11px] font-bold text-[#72787c] uppercase">Peso</th>
                          <th className="px-4 py-3 text-[11px] font-bold text-[#72787c] uppercase text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {docs.map(d => (
                          <tr key={d.id} className="hover:bg-[#f9f9fb] transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-[#cf222e]">picture_as_pdf</span>
                                <div>
                                  <p className="text-[13px] font-semibold text-[#1a1c1d]">{d.name}</p>
                                  <p className="text-[11px] text-[#72787c]">{d.type}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-[13px] text-[#41484c]">{d.date}</td>
                            <td className="px-4 py-3 text-[13px] text-[#41484c]">{d.size}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => simulateViewSignedUrl(d)}
                                  className="px-3 py-1.5 bg-[#c2e8ff] text-[#023143] rounded font-bold text-[12px] hover:bg-[#a6d8f5] transition-colors flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-[14px]">visibility</span> Ver
                                </button>
                                <button
                                  onClick={() => openDeleteSafe(d)}
                                  className="px-3 py-1.5 border border-[#E5E7EB] text-[#ba1a1a] rounded font-bold text-[12px] hover:bg-[#ffdad6] transition-colors flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-[14px]">delete</span> Eliminar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Info Side Panel */}
          <div className="col-span-12 xl:col-span-4">
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6 shadow-[0_4px_20px_rgba(2,49,67,0.05)] mb-6 sticky top-6">
              <h4 className="text-[16px] font-semibold text-[#001b27] mb-4 flex items-center gap-2 pb-4 border-b border-[#E5E7EB]">
                <span className="material-symbols-outlined text-[#3d6377]">security</span> Privacidad S3 Strict
              </h4>
              <p className="text-[13px] text-[#41484c] leading-relaxed mb-4">
                Los documentos nunca exponen URLs públicas. Cuando un cliente solicita un documento, el backend de Node.js se comunica con AWS STS para generar una <b>Signed URL limit-time</b>.
              </p>
              <div className="p-3 bg-[#f9f9fb] rounded-lg border border-[#E5E7EB] flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#72787c] mt-0.5">timer</span>
                <p className="text-[12px] text-[#72787c]">TTL (Time-to-Live) por defecto configurado a <b>300 segundos (5 min)</b>.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-[#E5E7EB] text-center">
          <div className="w-16 h-16 bg-[#f9f9fb] rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[#72787c] text-[32px]">folder_open</span>
          </div>
          <h3 className="text-[18px] font-bold text-[#1a1c1d]">No hay unidad seleccionada</h3>
          <p className="text-[14px] text-[#41484c] mt-2 max-w-md">Utiliza el buscador superior para encontrar un proyecto y localizar un piso/departamento, luego podrás visualizar y gestionar sus PDFs.</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#050a0e]/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative overflow-hidden">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-[#ffdad6] rounded-full flex items-center justify-center mb-4 text-[#ba1a1a]">
                <span className="material-symbols-outlined text-[28px]">warning</span>
              </div>
              <h3 className="text-[18px] font-bold text-[#1a1c1d] mb-2">¿Eliminar Documento?</h3>
              <p className="text-[13px] text-[#41484c] mb-6">
                Esta acción erradicará el archivo <b>"{docToDelete.name}"</b> irreversiblemente del bucket S3 de Amazon.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDocToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-[#f9f9fb] border border-[#E5E7EB] rounded-lg text-[13px] font-bold text-[#41484c] hover:bg-[#e2e2e4] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-[#ba1a1a] rounded-lg text-[13px] font-bold text-white hover:bg-[#93000a] transition-all flex justify-center items-center"
                >
                  {isDeleting ? (
                    <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : "Sí, destruir"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading S3 Modal overlay */}
      {isViewing && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="bg-white px-6 py-4 rounded-xl shadow-lg border border-[#E5E7EB] flex items-center gap-3">
            <svg className="animate-spin w-5 h-5 text-[#023143]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className="text-[14px] font-bold text-[#001b27]">Generando Signed URL desde AWS...</span>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}
