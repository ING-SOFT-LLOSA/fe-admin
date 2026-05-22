import { getMockProjects } from "../_data/mock-projects";
import ProjectDetailView from "../_components/ProjectDetailView";

type ProjectDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export function generateStaticParams() {
  return getMockProjects().map((project) => ({
    id: project.slug,
  }));
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;

  return <ProjectDetailView projectId={id} />;
}
