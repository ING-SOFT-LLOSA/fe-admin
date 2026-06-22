import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="next-themes-provider" data-props={JSON.stringify(props)}>
      {children}
    </div>
  ),
}));

import { ThemeProvider } from '@/components/ThemeProvider';

describe("ThemeProvider", () => {
  it("renders children inside next-themes provider", () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="dark">
        <span data-testid="child">Hello</span>
      </ThemeProvider>,
    );
    expect(screen.getByTestId("next-themes-provider")).toBeDefined();
    expect(screen.getByTestId("child")).toBeDefined();
    expect(screen.getByText("Hello")).toBeDefined();
  });

  it("passes props through to NextThemesProvider", () => {
    render(
      <ThemeProvider attribute="class" enableSystem defaultTheme="light">
        <span>Test</span>
      </ThemeProvider>,
    );
    const provider = screen.getByTestId("next-themes-provider");
    const props = JSON.parse(provider.dataset.props || "{}");
    expect(props.attribute).toBe("class");
    expect(props.enableSystem).toBe(true);
    expect(props.defaultTheme).toBe("light");
  });
});
