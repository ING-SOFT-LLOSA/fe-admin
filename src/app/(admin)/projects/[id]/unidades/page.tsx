import UnitsOverviewView from "@/components/backoffice/UnitsOverviewView";
import { apiFetch } from "@/lib/api/http";

type ProjectUnitsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateStaticParams() {
  try {
    const proyectos = await apiFetch<any[]>("/api/proyectos");
    return proyectos.map((project) => ({
      id: project.id,
    }));
  } catch (error) {
    console.error("Error fetching projects for static params:", error);
    return [];
  }
}

export default async function ProjectUnitsPage({ params }: ProjectUnitsPageProps) {
  const { id } = await params;

  return (
    <>
      <UnitsOverviewView projectId={id} />
    </>
  );
}
