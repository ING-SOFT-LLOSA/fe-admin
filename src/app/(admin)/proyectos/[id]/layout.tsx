import ProjectWorkspaceShell from "@/modules/proyectos/components/ProjectWorkspaceShell";

type ProjectWorkspaceLayoutProps = {
  readonly children: React.ReactNode;
  readonly params: Promise<{
    readonly id: string;
  }>;
};

export default async function ProjectWorkspaceLayout({
  children,
  params,
}: Readonly<ProjectWorkspaceLayoutProps>) {
  const { id } = await params;

  return <ProjectWorkspaceShell projectId={id}>{children}</ProjectWorkspaceShell>;
}
