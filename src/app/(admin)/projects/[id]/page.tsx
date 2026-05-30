import ProjectDetailView from "../_components/ProjectDetailView";
import { apiFetch } from "@/lib/api/http";

type ProjectDetailPageProps = {
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

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;

  return <ProjectDetailView projectId={id} />;
}
