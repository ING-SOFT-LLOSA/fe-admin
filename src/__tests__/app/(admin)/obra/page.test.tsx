import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ObraPage from '@/app/(admin)/obra/page';

vi.mock("@/modules/obra/components/ObraOverview", () => ({
  default: () => <div data-testid="obra-overview" />,
}));

describe("ObraPage", () => {
  it("renders ObraOverview component", () => {
    render(<ObraPage />);
    expect(screen.getByTestId("obra-overview")).toBeDefined();
  });
});
