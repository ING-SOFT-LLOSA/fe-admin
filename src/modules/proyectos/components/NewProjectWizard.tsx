"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import GeneralDataForm from "./GeneralDataForm";
import InventoryConfigurator from "./InventoryConfigurator";
import LoadingOverlay from "./LoadingOverlay";
import {
  InventoryConfig,
  ProjectFormData,
} from "@/modules/proyectos/utils/wizard-logic";
import {
  createProject,
  createInventory,
} from "@/modules/proyectos/utils/api-client";

type Step = "GENERAL" | "INVENTORY";

export default function NewProjectWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("GENERAL");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [generalData, setGeneralData] = useState<ProjectFormData>({
    nombre: "",
    descripcion: "",
    precertificacionEdgeLeed: false,
    linkRecorridoVirtual: "",
    departamento: "",
    distrito: "",
    direccion: "",
    fechaInicio: "",
    fechaFin: "",
  });

  const [inventoryConfig, setInventoryConfig] = useState<InventoryConfig>({
    numTorres: 1,
    pisosPorTorre: 5,
    depasPorPiso: 4,
    cocherasPorPiso: 2,
    depositosPorPiso: 1,
  });

  const handleGeneralSubmit = (data: ProjectFormData) => {
    setGeneralData(data);
    setStep("INVENTORY");
  };

  const handleCreateProject = async (config: InventoryConfig) => {
    setInventoryConfig(config);
    setIsLoading(true);
    setError(null);

    try {
      setLoadingMessage("Creando proyecto general...");
      const { id: projectId } = await createProject(generalData);

      setLoadingMessage("Generando estructura física y unidades...");
      await createInventory(projectId, config);

      setLoadingMessage("Proyecto creado exitosamente.");
      setTimeout(() => {
        router.push(`/proyectos/${projectId}`);
        router.refresh();
      }, 1200);
    } catch (err: unknown) {
      console.error("Error creating project:", err);
      setError(err instanceof Error ? err.message : "Ocurrió un error al crear el proyecto. Revisa la consola.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm md:p-8">
      {isLoading && <LoadingOverlay message={loadingMessage} />}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
          <span className="font-bold">Error:</span> {error}
        </div>
      )}

      <div className="mb-8 flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-6">
        <div className={`flex items-center gap-3 ${step === "GENERAL" ? "opacity-100" : "opacity-50"}`}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step === "GENERAL" ? "bg-build-main text-white" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60"}`}>
            1
          </div>
          <span className="font-semibold text-build-main dark:text-white">Datos generales</span>
        </div>

        <div className="mx-6 h-px flex-1 bg-slate-200 dark:bg-white/15" />

        <div className={`flex items-center gap-3 ${step === "INVENTORY" ? "opacity-100" : "opacity-50"}`}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step === "INVENTORY" ? "bg-build-main text-white" : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60"}`}>
            2
          </div>
          <span className="font-semibold text-build-main dark:text-white">Previsualización de inventario</span>
        </div>
      </div>

      {step === "GENERAL" && (
        <GeneralDataForm
          initialData={generalData}
          onSubmit={handleGeneralSubmit}
          onCancel={() => router.push("/proyectos")}
        />
      )}

      {step === "INVENTORY" && (
        <InventoryConfigurator
          initialData={inventoryConfig}
          onBack={() => setStep("GENERAL")}
          onSubmit={handleCreateProject}
        />
      )}
    </div>
  );
}
