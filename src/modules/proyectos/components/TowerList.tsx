"use client";

import { useEffect, useState } from "react";
import { fetchActivosPorProyecto, deleteActivo, createActivo, updateActivo } from "@/modules/inventario/services";
import type { ActivoResponseDTO, ActivoRequestDTO } from "@/modules/inventario/types";

type TowerListProps = {
  projectId: string;
};

export default function TowerList({ projectId }: TowerListProps) {
  const [activos, setActivos] = useState<ActivoResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isAdding, setIsAdding] = useState<number | null>(null); // pisoId
  const [isEditing, setIsEditing] = useState<ActivoResponseDTO | null>(null);
  const [form, setForm] = useState<ActivoRequestDTO>({
    nro: "", tipo: "Departamento", areaM2: 0, estadoComercial: "DISPONIBLE", precio: 0, descripcion: ""
  });

  const loadActivos = async () => {
    setLoading(true);
    try {
      const res = await fetchActivosPorProyecto(projectId);
      setActivos(res.content || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivos();
  }, [projectId]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este activo?")) return;
    try {
      await deleteActivo(id);
      loadActivos();
    } catch (e) {
      alert("Error al eliminar");
    }
  };

  const handleSaveActivo = async () => {
    try {
      if (isEditing) {
        await updateActivo(isEditing.id, form);
      } else if (isAdding !== null) {
        await createActivo(isAdding, form);
      }
      setIsEditing(null);
      setIsAdding(null);
      loadActivos();
    } catch (e) {
      alert("Error al guardar activo");
    }
  };

  // Agrupar por pisoId
  const pisosMap = activos.reduce((acc, curr) => {
    if (!acc[curr.pisoId]) acc[curr.pisoId] = [];
    acc[curr.pisoId].push(curr);
    return acc;
  }, {} as Record<number, ActivoResponseDTO[]>);

  const pisos = Object.keys(pisosMap).map(Number).sort((a, b) => a - b);

  if (loading) return <div className="p-6 text-center text-slate-500">Cargando estructura...</div>;

  return (
    <section className="rounded-xl border border-[#e2e2e4] bg-white p-6 shadow-[0_4px_20px_rgba(2,49,67,0.03)]">
      <div className="mb-5 flex justify-between items-center">
        <div>
          <h2 className="text-[20px] font-bold text-[#1a1c1d]">Estructura y Unidades</h2>
          <p className="mt-1 text-sm text-[#41484c]">Gestión de inventario por piso.</p>
        </div>
      </div>

      {pisos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#c1c7cc] bg-slate-50 p-6 text-center">
          <p className="text-sm font-medium text-[#72787c]">Este proyecto aun no tiene pisos registrados. Asigna un piso base para empezar.</p>
          <button 
            onClick={() => { setIsAdding(1); setForm({ nro: "", tipo: "Departamento", areaM2: 0, estadoComercial: "DISPONIBLE", precio: 0, descripcion: "" }); }}
            className="mt-3 bg-build-main text-white px-4 py-2 rounded-lg text-sm font-bold"
          >
            Añadir Piso 1
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {pisos.map((pisoId) => (
            <div key={pisoId} className="rounded-xl border border-[#e2e2e4] overflow-hidden">
              <div className="bg-[#f9f9fb] px-4 py-3 border-b border-[#e2e2e4] flex justify-between items-center">
                <h3 className="text-base font-bold text-[#1a1c1d]">Piso {pisoId}</h3>
                <button
                  onClick={() => {
                    setIsAdding(pisoId);
                    setForm({ nro: "", tipo: "Departamento", areaM2: 0, estadoComercial: "DISPONIBLE", precio: 0, descripcion: "" });
                  }}
                  className="bg-build-main text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm"
                >
                  + Añadir Unidad
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 text-xs font-bold text-slate-500">Nro</th>
                      <th className="px-4 py-2 text-xs font-bold text-slate-500">Tipo</th>
                      <th className="px-4 py-2 text-xs font-bold text-slate-500">Área (m2)</th>
                      <th className="px-4 py-2 text-xs font-bold text-slate-500">Precio</th>
                      <th className="px-4 py-2 text-xs font-bold text-slate-500">Estado</th>
                      <th className="px-4 py-2 text-xs font-bold text-slate-500 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {pisosMap[pisoId].map((activo) => (
                      <tr key={activo.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-bold text-build-main">{activo.nro}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{activo.tipo}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{activo.areaM2}</td>
                        <td className="px-4 py-3 text-sm font-medium text-build-accent">${activo.precio}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">
                            {activo.estadoComercial}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setIsEditing(activo);
                              setForm({
                                nro: activo.nro,
                                tipo: activo.tipo,
                                areaM2: activo.areaM2,
                                estadoComercial: activo.estadoComercial,
                                precio: activo.precio,
                                descripcion: activo.descripcion || ""
                              });
                            }}
                            className="text-build-main hover:bg-[#c2e8ff] p-1.5 rounded-md transition-colors mr-2"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(activo.id)}
                            className="text-[#ba1a1a] hover:bg-[#ffdad6] p-1.5 rounded-md transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Añadir/Editar Activo */}
      {(isAdding !== null || isEditing !== null) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050a0e]/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-6">
            <h3 className="text-xl font-bold text-build-main mb-4">
              {isEditing ? "Editar Unidad" : `Añadir Unidad a Piso ${isAdding}`}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Número</label>
                  <input
                    value={form.nro} onChange={e => setForm({...form, nro: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-build-main outline-none"
                    placeholder="Ej: 101"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Tipo</label>
                  <select
                    value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-build-main outline-none"
                  >
                    <option value="Departamento">Departamento</option>
                    <option value="Estacionamiento">Estacionamiento</option>
                    <option value="Deposito">Depósito</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Área (m2)</label>
                  <input
                    type="number" value={form.areaM2} onChange={e => setForm({...form, areaM2: parseFloat(e.target.value) || 0})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-build-main outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Precio</label>
                  <input
                    type="number" value={form.precio} onChange={e => setForm({...form, precio: parseFloat(e.target.value) || 0})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-build-main outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Estado Comercial</label>
                <select
                  value={form.estadoComercial} onChange={e => setForm({...form, estadoComercial: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-build-main outline-none"
                >
                  <option value="DISPONIBLE">DISPONIBLE</option>
                  <option value="SEPARADO">SEPARADO</option>
                  <option value="VENDIDO">VENDIDO</option>
                  <option value="BLOQUEADO">BLOQUEADO</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Descripción</label>
                <textarea
                  value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-build-main outline-none"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setIsEditing(null); setIsAdding(null); }}
                className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveActivo}
                className="bg-build-main text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
