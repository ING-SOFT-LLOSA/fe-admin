import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ClientExpedientePage from '@/app/(admin)/clientes/[id]/expediente/page';

vi.mock("@/modules/legal/components/ClientExpedienteView", () => ({
  default: ({ clientId }: any) => (
    <div data-testid="client-expediente-view" data-client-id={clientId} />
  ),
}));

describe("ClientExpedientePage", () => {
  it("renders ClientExpedienteView with clientId as number from params", async () => {
    const element = await ClientExpedientePage({
      params: Promise.resolve({ id: "7" }),
    });
    render(element);
    const el = screen.getByTestId("client-expediente-view");
    expect(el).toBeDefined();
    expect(el.getAttribute("data-client-id")).toBe("7");
  });
});
