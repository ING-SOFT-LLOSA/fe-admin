import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ClienteProfilePage from '@/app/(admin)/clientes/[id]/page';

vi.mock("@/modules/clientes/components/ClienteProfileView", () => ({
  default: ({ clientId }: any) => (
    <div data-testid="cliente-profile-view" data-client-id={clientId} />
  ),
}));

describe("ClienteProfilePage", () => {
  it("renders ClienteProfileView with clientId from params", async () => {
    const element = await ClienteProfilePage({
      params: Promise.resolve({ id: "42" }),
    });
    render(element);
    const el = screen.getByTestId("cliente-profile-view");
    expect(el).toBeDefined();
    expect(el.getAttribute("data-client-id")).toBe("42");
  });
});
