import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ProjectsPage from '@/app/(admin)/proyectos/page';

vi.mock("@/modules/proyectos/components/ProjectsOverview", () => ({
  default: () => <div data-testid="projects-overview" />,
}));

describe("ProjectsPage", () => {
  it("renders ProjectsOverview component", () => {
    render(<ProjectsPage />);
    expect(screen.getByTestId("projects-overview")).toBeDefined();
  });
});
