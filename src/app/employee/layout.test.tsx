import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import EmployeeRouteLayout from "./layout";

vi.mock("@/components/EmployeeSideNav", () => ({
  default: () => <div data-testid="employee-side-nav" />,
}));

vi.mock("@/components/TopNav", () => ({
  default: () => <div data-testid="top-nav" />,
}));

vi.mock("@/components/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));

describe("EmployeeRouteLayout", () => {
  it("renders EmployeeSideNav", () => {
    render(<EmployeeRouteLayout><div /></EmployeeRouteLayout>);
    expect(screen.getByTestId("employee-side-nav")).toBeDefined();
  });

  it("renders TopNav", () => {
    render(<EmployeeRouteLayout><div /></EmployeeRouteLayout>);
    expect(screen.getByTestId("top-nav")).toBeDefined();
  });

  it("renders Footer", () => {
    render(<EmployeeRouteLayout><div /></EmployeeRouteLayout>);
    expect(screen.getByTestId("footer")).toBeDefined();
  });

  it("renders children", () => {
    render(
      <EmployeeRouteLayout>
        <div data-testid="child">Hello</div>
      </EmployeeRouteLayout>,
    );
    expect(screen.getByTestId("child")).toBeDefined();
    expect(screen.getByText("Hello")).toBeDefined();
  });
});
