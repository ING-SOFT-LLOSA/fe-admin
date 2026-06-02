import ProjectDetailView from "@/modules/proyectos/components/ProjectDetailView";

export const dynamic = "force-dynamic";

type ProjectDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;

  return <ProjectDetailView projectId={id} />;
}
