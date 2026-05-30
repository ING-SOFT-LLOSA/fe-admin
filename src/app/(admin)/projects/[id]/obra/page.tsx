import ConstructionProgressView from "@/components/backoffice/ConstructionProgressView";
import { apiFetch } from "@/lib/api/http";

type ProjectObraPageProps = {
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

export default async function ProjectObraPage({ params }: ProjectObraPageProps) {
  const { id } = await params;

  return (
    <>
      <ConstructionProgressView projectId={id} />
    </>
  );
}
