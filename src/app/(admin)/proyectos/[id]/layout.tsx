import ProjectWorkspaceShell from "@/modules/proyectos/components/ProjectWorkspaceShell";

type ProjectWorkspaceLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectWorkspaceLayout({
  children,
  params,
}: ProjectWorkspaceLayoutProps) {
  const { id } = await params;

  return <ProjectWorkspaceShell projectId={id}>{children}</ProjectWorkspaceShell>;
}
