import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ObraProjectPage from "./page";

vi.mock("@/modules/obra/components/ConstructionProgressView", () => ({
  default: ({ projectId, context }: any) => (
    <div data-testid="construction-progress-obra" data-project-id={projectId} data-context={context} />
  ),
}));

describe("ObraProjectPage", () => {
  it("renders ConstructionProgressView with projectId and context='obra'", async () => {
    const element = await ObraProjectPage({
      params: Promise.resolve({ projectId: "proj-77" }),
    });
    render(element);
    const el = screen.getByTestId("construction-progress-obra");
    expect(el).toBeDefined();
    expect(el.getAttribute("data-project-id")).toBe("proj-77");
    expect(el.getAttribute("data-context")).toBe("obra");
  });
});
