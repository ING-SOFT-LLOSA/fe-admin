import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProjectsLoading from '@/app/(admin)/proyectos/loading';

describe("ProjectsLoading", () => {
  it("renders skeleton elements", () => {
    const { container } = render(<ProjectsLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders 3 skeleton cards", () => {
    const { container } = render(<ProjectsLoading />);
    const cards = container.querySelectorAll(".rounded-xl");
    expect(cards.length).toBe(3);
  });
});
