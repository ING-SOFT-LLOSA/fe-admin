"use client";

import { useId, useState } from "react";

import type { DocumentRecord } from "@/modules/shared/workspace/types";

type DocumentDefinition = {
  type: string;
  label: string;
  kind?: "pdf" | "url";
};

type DocumentManagerProps = {
  title: string;
  description?: string;
  module: DocumentRecord["module"];
  scope: DocumentRecord["scope"];
  documents: DocumentRecord[];
  definitions: DocumentDefinition[];
  onChange: (nextDocuments: DocumentRecord[]) => void;
};

function formatDate(date: string) {
  if (!date) return "Sin fecha";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function makeFileSizeLabel(bytes: number) {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function openMockDocument(document: DocumentRecord) {
  const lines = [
    `<h1 style="font-family:Outfit,Arial,sans-serif;">${document.title}</h1>`,
    `<p>Tipo: ${document.type}</p>`,
    `<p>Version: ${document.version}</p>`,
    `<p>Fecha: ${document.date || "Sin fecha"}</p>`,
    `<p>Visible al cliente: ${document.visibleToClient ? "Si" : "No"}</p>`,
    `<p>Archivo: ${document.file?.fileName ?? "Sin archivo persistido"}</p>`,
    `<p>Notas: ${document.notes || "Sin notas"}</p>`,
  ];
  const blob = new Blob([`<html><body>${lines.join("")}</body></html>`], {
    type: "text/html",
  });
  window.open(URL.createObjectURL(blob), "_blank", "noopener,noreferrer");
}

export default function DocumentManager({
  title,
  description,
  module,
  scope,
  documents,
  definitions,
  onChange,
}: DocumentManagerProps) {
  const inputId = useId();
  const [selectedType, setSelectedType] = useState(definitions[0]?.type ?? "");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0] ?? "");
  const [visibleToClient, setVisibleToClient] = useState(true);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingUrl, setPendingUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const selectedDefinition =
    definitions.find((definition) => definition.type === selectedType) ?? definitions[0];
  const acceptsFile = selectedDefinition?.kind !== "url";

  function resetForm() {
    setNotes("");
    setDate(new Date().toISOString().split("T")[0] ?? "");
    setVisibleToClient(true);
    setPendingFile(null);
    setPendingUrl("");
    setEditingId(null);
    setError("");
  }

  function handleFileSelection(file: File | null) {
    if (!file) return;
    setError("");
    if (file.type !== "application/pdf") {
      setError("Solo se permiten archivos PDF en esta vista.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("El archivo supera el limite de 10 MB.");
      return;
    }
    setPendingFile(file);
  }

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    handleFileSelection(event.dataTransfer.files?.[0] ?? null);
  }

  function saveDocument() {
    if (!selectedDefinition) return;
    setError("");

    if (selectedDefinition.kind === "url") {
      if (!pendingUrl.trim()) {
        setError("Ingresa una URL valida para este documento.");
        return;
      }
      try {
        new URL(pendingUrl.trim());
      } catch {
        setError("La URL no tiene un formato valido.");
        return;
      }
    } else if (!pendingFile && !editingId) {
      setError("Debes adjuntar un archivo PDF.");
      return;
    }

    const current = editingId ? documents.find((document) => document.id === editingId) : null;
    const nextRecord: DocumentRecord = {
      id: current?.id ?? `${module}-${selectedDefinition.type}-${Date.now()}`,
      scope,
      module,
      type: selectedDefinition.type as DocumentRecord["type"],
      title: selectedDefinition.label,
      kind: selectedDefinition.kind ?? "pdf",
      externalUrl: selectedDefinition.kind === "url" ? pendingUrl.trim() : undefined,
      version: current ? current.version + 1 : 1,
      visibleToClient,
      notes,
      date,
      file:
        selectedDefinition.kind === "url"
          ? null
          : pendingFile
            ? {
                fileName: pendingFile.name,
                fileSizeLabel: makeFileSizeLabel(pendingFile.size),
                uploadedAt: date,
              }
            : current?.file ?? null,
    };

    const nextDocuments = editingId
      ? documents.map((document) => (document.id === editingId ? nextRecord : document))
      : [nextRecord, ...documents];
    onChange(nextDocuments);
    resetForm();
  }

  function handleReplace(document: DocumentRecord) {
    setEditingId(document.id);
    setSelectedType(String(document.type));
    setNotes(document.notes);
    setDate(document.date);
    setVisibleToClient(document.visibleToClient);
    setPendingUrl(document.externalUrl ?? "");
    setPendingFile(null);
    setError("");
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4">
        <h3 className="text-[18px] font-bold text-build-main">{title}</h3>
        {description ? <p className="text-sm text-slate-500">{description}</p> : null}
      </div>

      <div className="mt-5 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Tipo de documento
              </label>
              <select
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
              >
                {definitions.map((definition) => (
                  <option key={definition.type} value={definition.type}>
                    {definition.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Fecha del documento
              </label>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
              />
            </div>

            {acceptsFile ? (
              <label
                htmlFor={inputId}
                onDrop={handleDrop}
                onDragOver={(event) => event.preventDefault()}
                className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-5 text-center transition-colors transition-colors hover:border-build-accent hover:bg-slate-100"
              >
                <span className="material-symbols-outlined text-[28px] text-build-main">
                  upload_file
                </span>
                <p className="mt-2 text-sm font-bold text-build-main">
                  Arrastra un PDF o haz click para adjuntarlo
                </p>
                <p className="mt-1 text-[11px] text-slate-500">Maximo 10 MB</p>
                {pendingFile ? (
                  <p className="mt-3 text-[12px] font-semibold text-build-main">
                    {pendingFile.name} · {makeFileSizeLabel(pendingFile.size)}
                  </p>
                ) : null}
                <input
                  id={inputId}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(event) => handleFileSelection(event.target.files?.[0] ?? null)}
                />
              </label>
            ) : (
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  URL externa
                </label>
                <input
                  type="url"
                  value={pendingUrl}
                  onChange={(event) => setPendingUrl(event.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Nota interna
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-all focus:border-build-accent focus:ring-1 focus:ring-build-accent"
                placeholder="Observaciones para el equipo Llosa"
              />
            </div>

            <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold text-build-main">Visible para cliente</p>
                <p className="text-[11px] text-slate-500">
                  Si se apaga, solo sera visible en backoffice
                </p>
              </div>
              <input
                type="checkbox"
                checked={visibleToClient}
                onChange={(event) => setVisibleToClient(event.target.checked)}
                className="h-4 w-4 accent-build-accent"
              />
            </label>

            {error ? (
              <div className="rounded-xl border border-[#ba1a1a]/20 bg-[#ffdad6]/60 px-3 py-2 text-[12px] font-bold text-[#ba1a1a]">
                {error}
              </div>
            ) : null}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveDocument}
                className="flex-1 rounded-xl bg-build-main px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-build-main/90"
              >
                {editingId ? "Reemplazar version" : "Guardar documento"}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:bg-white"
                >
                  Cancelar
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Documento
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Fecha
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Version
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Visibilidad
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                    Aun no hay documentos cargados en esta seccion.
                  </td>
                </tr>
              ) : (
                documents.map((document) => (
                  <tr key={document.id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-build-main">{document.title}</span>
                        <span className="text-[12px] text-slate-500">
                          {document.file?.fileName ?? document.externalUrl ?? "Sin archivo"}
                        </span>
                        {document.notes ? (
                          <span className="text-[12px] text-slate-500">{document.notes}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">{formatDate(document.date)}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-build-main">v{document.version}</td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          onChange(
                            documents.map((current) =>
                              current.id === document.id
                                ? { ...current, visibleToClient: !current.visibleToClient }
                                : current,
                            ),
                          )
                        }
                        className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${
                          document.visibleToClient
                            ? "bg-[#d6f0e0] text-[#1c663b]"
                            : "bg-[#eeeeef] text-slate-500"
                        }`}
                      >
                        {document.visibleToClient ? "Visible" : "Oculto"}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openMockDocument(document)}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-[12px] font-bold text-build-main hover:bg-slate-100"
                        >
                          Ver
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReplace(document)}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-[12px] font-bold text-slate-500 hover:bg-slate-100"
                        >
                          Reemplazar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
