import ProjectDetailView from "@/modules/proyectos/components/ProjectDetailView";

export const dynamic = "force-dynamic";

type ProjectDetailPageProps = {
  readonly params: Promise<{
    readonly id: string;
  }>;
};

export default async function ProjectDetailPage({ params }: Readonly<ProjectDetailPageProps>) {
  const { id } = await params;

  return <ProjectDetailView projectId={id} />;
}
