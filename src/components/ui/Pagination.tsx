"use client";

import { useMemo } from "react";

interface PaginationProps {
  readonly currentPage: number; // 0-indexed
  readonly totalPages: number;
  readonly totalElements: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange?: (pageSize: number) => void;
  readonly itemNamePlural?: string; // Ejemplo: "clientes", "expedientes", "unidades"
}

export default function Pagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
  itemNamePlural = "elementos",
}: Readonly<PaginationProps>) {
  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalElements);

  // Generar números de página a mostrar
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Siempre incluir la primera página
      pages.push(0);

      let start = Math.max(1, currentPage - 1);
      let end = Math.min(totalPages - 2, currentPage + 1);

      if (currentPage <= 1) {
        end = 3;
      }
      if (currentPage >= totalPages - 2) {
        start = totalPages - 4;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Siempre incluir la última página
      pages.push(totalPages - 1);
    }

    return pages;
  }, [currentPage, totalPages]);

  if (totalPages <= 1 && !onPageSizeChange) {
    if (totalElements === 0) return null;
    
    // Si solo hay una página pero no hay botones, mostramos al menos el resumen
    return (
      <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-6 py-4">
        <p className="text-[8px] text-slate-500 dark:text-white/50">
          Mostrando <span className="font-semibold text-slate-700 dark:text-white/80">{totalElements > 0 ? 1 : 0}</span> a{" "}
          <span className="font-semibold text-slate-700 dark:text-white/80">{totalElements}</span> de{" "}
          <span className="font-semibold text-slate-700 dark:text-white/80">{totalElements}</span> {itemNamePlural}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-6 py-4 w-full">
      
      {/* Resumen del conteo y tamaño de página opcional */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 dark:text-white/50 w-full sm:w-auto justify-between sm:justify-start">
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span>Mostrar</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 px-2 py-1 text-[10px] outline-none focus:border-arch-gold text-slate-700 dark:text-white transition-all cursor-pointer"
            >
              {[10, 15, 25, 50, 100].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span>registros</span>
          </div>
        )}
        
        {onPageSizeChange && <span className="hidden sm:inline border-l border-slate-200 dark:border-white/10 h-4 mx-1" />}
        
        <p>
          Mostrando <span className="font-semibold text-slate-700 dark:text-white/80">{totalElements > 0 ? startIndex + 1 : 0}</span> a{" "}
          <span className="font-semibold text-slate-700 dark:text-white/80">{endIndex}</span> de{" "}
          <span className="font-semibold text-slate-700 dark:text-white/80">{totalElements}</span> {itemNamePlural}
        </p>
      </div>

      {/* Navegación de páginas */}
      {totalPages > 1 && (
        <nav className="isolate inline-flex -space-x-px rounded-lg shadow-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10" aria-label="Paginación">
          {/* Botón Anterior */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
            className="relative inline-flex items-center rounded-l-lg px-2.5 py-1.5 text-slate-400 dark:text-white/30 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 border-r border-slate-200 dark:border-white/10"
            title="Página anterior"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>

          {/* Números de páginas con elipsis inteligentes */}
          {pageNumbers.map((pageNum, index, arr) => {
            const showDotsBefore = pageNum > 0 && arr[index - 1] !== pageNum - 1;
            const isActive = currentPage === pageNum;

            return (
              <div key={pageNum} className="flex items-center">
                {showDotsBefore && (
                  <span className="px-3 py-1.5 text-slate-400 dark:text-white/30 text-xs select-none">...</span>
                )}
                <button
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative inline-flex items-center px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? "z-10 bg-build-main text-white shadow-sm"
                      : "text-slate-600 dark:text-white/70 hover:bg-slate-50 dark:hover:bg-white/10"
                  } ${
                    index < arr.length - 1 ? "border-r border-slate-200 dark:border-white/10" : ""
                  }`}
                >
                  {pageNum + 1}
                </button>
              </div>
            );
          })}

          {/* Botón Siguiente */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            className="relative inline-flex items-center rounded-r-lg px-2.5 py-1.5 text-slate-400 dark:text-white/30 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            title="Página siguiente"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </nav>
      )}
    </div>
  );
}
