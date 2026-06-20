import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AgendaPage from "./page";

vi.mock("@/modules/agenda/components/AgendaView", () => ({
  default: () => <div data-testid="agenda-view" />,
}));

describe("AgendaPage", () => {
  it("renders AgendaView component", () => {
    render(<AgendaPage />);
    expect(screen.getByTestId("agenda-view")).toBeDefined();
  });
});
