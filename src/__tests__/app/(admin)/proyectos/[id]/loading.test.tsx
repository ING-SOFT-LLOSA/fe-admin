import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import ProjectDetailLoading from '@/app/(admin)/proyectos/[id]/loading';

describe("ProjectDetailLoading", () => {
  it("renders skeleton elements", () => {
    const { container } = render(<ProjectDetailLoading />);
    const skeletons = container.querySelectorAll(".skeleton");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders 2 skeleton cards", () => {
    const { container } = render(<ProjectDetailLoading />);
    const cards = container.querySelectorAll(".rounded-xl");
    expect(cards.length).toBe(2);
  });
});
