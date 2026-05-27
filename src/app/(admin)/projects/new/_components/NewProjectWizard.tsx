"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GeneralDataForm from "./GeneralDataForm";
import InventoryConfigurator from "./InventoryConfigurator";
import LoadingOverlay from "./LoadingOverlay";
import { 
  ProjectFormData, 
  InventoryConfig, 
  generateStructurePayload 
} from "../_utils/wizard-logic";
import { 
  createProject, 
  createEtapasAndHitos, 
  createPhysicalStructure 
} from "../_utils/api-client";

type Step = "GENERAL" | "INVENTORY";

export default function NewProjectWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("GENERAL");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Form states
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
      // Step 1: Create the Project Shell
      setLoadingMessage("Creando proyecto general...");
      const { id: projectId } = await createProject(generalData);

      // Step 2: Inject the Predefined Templates (Etapas and Hitos)
      setLoadingMessage("Generando etapas e hitos por defecto...");
      await createEtapasAndHitos(projectId);

      // Step 3: Create the Physical Structure (Torres, Pisos, Activos)
      setLoadingMessage("Estructurando inventario (torres, pisos y unidades)...");
      const structurePayload = generateStructurePayload(config);
      await createPhysicalStructure(projectId, structurePayload);

      // Done
      setLoadingMessage("¡Proyecto creado exitosamente!");
      setTimeout(() => {
        router.push("/projects");
        router.refresh(); // Refresh the server components to show the new project
      }, 1500);

    } catch (err: any) {
      console.error("Error creating project:", err);
      setError(err.message || "Ocurrió un error al crear el proyecto. Revisa la consola.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
      {isLoading && (
        <LoadingOverlay message={loadingMessage} />
      )}

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
          <span className="font-bold">Error:</span> {error}
        </div>
      )}

      {/* Stepper Header */}
      <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-6">
        <div className={`flex items-center gap-3 ${step === "GENERAL" ? "opacity-100" : "opacity-50"}`}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step === "GENERAL" ? "bg-build-main text-white" : "bg-slate-100 text-slate-500"}`}>
            1
          </div>
          <span className="font-semibold text-build-main">Datos Generales</span>
        </div>
        
        <div className="h-px flex-1 bg-slate-200 mx-6"></div>

        <div className={`flex items-center gap-3 ${step === "INVENTORY" ? "opacity-100" : "opacity-50"}`}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step === "INVENTORY" ? "bg-build-main text-white" : "bg-slate-100 text-slate-500"}`}>
            2
          </div>
          <span className="font-semibold text-build-main">Inventario Físico</span>
        </div>
      </div>

      {step === "GENERAL" && (
        <GeneralDataForm 
          initialData={generalData} 
          onSubmit={handleGeneralSubmit} 
          onCancel={() => router.push("/projects")}
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
