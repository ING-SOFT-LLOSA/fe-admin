import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LegalPage from "./page";

vi.mock("@/modules/legal/components/LegalOverview", () => ({
  default: () => <div data-testid="legal-overview" />,
}));

describe("LegalPage", () => {
  it("renders LegalOverview component", () => {
    render(<LegalPage />);
    expect(screen.getByTestId("legal-overview")).toBeDefined();
  });
});
