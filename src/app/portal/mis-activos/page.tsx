"use client";

import Link from "next/link";
import { useState } from "react";

// Datos falsos para el comprador
const MOCK_ACTIVOS = [
  {
    id: "1",
    proyecto: "Residencial Los Pinos",
    nro: "201",
    tipo: "Departamento",
    estado: "En Construcción",
    avance: 65,
    hitosCompletados: 3,
    totalHitos: 5,
    precio: 150000,
    imagen: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80"
  },
  {
    id: "2",
    proyecto: "Torre Marina",
    nro: "E-15",
    tipo: "Estacionamiento",
    estado: "Entregado",
    avance: 100,
    hitosCompletados: 5,
    totalHitos: 5,
    precio: 15000,
    imagen: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=800&q=80"
  }
];

export default function MisActivosPage() {
  const [activos] = useState(MOCK_ACTIVOS);

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-build-main">Mis Propiedades</h1>
          <p className="text-slate-500 mt-2">Bienvenido a tu portal. Aquí puedes ver el estado de tus unidades.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {activos.map(activo => (
          <div key={activo.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-shadow group cursor-pointer">
            <div className="h-48 relative overflow-hidden bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={activo.imagen} 
                alt={activo.proyecto} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-build-main shadow-sm">
                {activo.tipo}
              </div>
            </div>
            
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{activo.proyecto}</p>
              <h2 className="text-2xl font-bold text-build-main mb-4">Unidad {activo.nro}</h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-500">Avance de obra</span>
                    <span className="text-build-accent">{activo.avance}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-build-accent h-full rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${activo.avance}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center py-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">task_alt</span>
                    <span className="text-sm font-medium text-slate-600">{activo.hitosCompletados} de {activo.totalHitos} hitos</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${activo.avance === 100 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {activo.estado}
                  </span>
                </div>
              </div>

              <button className="w-full mt-4 bg-slate-50 hover:bg-slate-100 text-build-main font-bold py-2.5 rounded-xl text-sm transition-colors flex justify-center items-center gap-2 border border-slate-200">
                Ver detalles
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
