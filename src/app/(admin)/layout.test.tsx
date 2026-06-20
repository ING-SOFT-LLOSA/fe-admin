import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminRouteLayout from "./layout";

vi.mock("@/components/SideNav", () => ({
  default: () => <div data-testid="side-nav" />,
}));

vi.mock("@/components/TopNav", () => ({
  default: () => <div data-testid="top-nav" />,
}));

vi.mock("@/components/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));

vi.mock("@/components/auth/RoleGuard", () => ({
  default: ({ children }: any) => <div data-testid="role-guard">{children}</div>,
}));

describe("AdminRouteLayout", () => {
  it("renders SideNav", () => {
    render(<AdminRouteLayout><div /></AdminRouteLayout>);
    expect(screen.getByTestId("side-nav")).toBeDefined();
  });

  it("renders TopNav", () => {
    render(<AdminRouteLayout><div /></AdminRouteLayout>);
    expect(screen.getByTestId("top-nav")).toBeDefined();
  });

  it("renders Footer", () => {
    render(<AdminRouteLayout><div /></AdminRouteLayout>);
    expect(screen.getByTestId("footer")).toBeDefined();
  });

  it("renders RoleGuard wrapper", () => {
    render(<AdminRouteLayout><div /></AdminRouteLayout>);
    expect(screen.getByTestId("role-guard")).toBeDefined();
  });

  it("renders children", () => {
    render(
      <AdminRouteLayout>
        <div data-testid="child">Hello</div>
      </AdminRouteLayout>,
    );
    expect(screen.getByTestId("child")).toBeDefined();
    expect(screen.getByText("Hello")).toBeDefined();
  });
});
