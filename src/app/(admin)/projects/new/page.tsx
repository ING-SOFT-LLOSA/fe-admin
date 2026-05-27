import NewProjectWizard from "./_components/NewProjectWizard";

export const metadata = {
  title: "Crear Nuevo Proyecto - Portal Empresa",
};

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-[-0.01em] text-build-main">
          Crear Nuevo Proyecto
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Completa los datos generales y configura la estructura de inventario del proyecto.
        </p>
      </header>

      <NewProjectWizard />
    </div>
  );
}
