/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import ThemeToggle from "./ThemeToggle";

const mockSetTheme = vi.fn();
const mockUseTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => mockUseTheme(),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    mockUseTheme.mockReturnValue({
      theme: "light",
      setTheme: mockSetTheme,
      resolvedTheme: "light",
    });
  });

  it("muestra skeleton mientras no está montado", () => {
    const { container } = render(<ThemeToggle />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeDefined();
  });

  it("muestra el botón de tema después de montarse", async () => {
    render(<ThemeToggle />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    const btn = screen.getByLabelText("Toggle theme");
    expect(btn).toBeDefined();
  });

  it("abre el dropdown al hacer clic en el botón", async () => {
    render(<ThemeToggle />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    const btn = screen.getByLabelText("Toggle theme");
    fireEvent.click(btn);
    expect(screen.getByText("Claro")).toBeDefined();
    expect(screen.getByText("Oscuro")).toBeDefined();
    expect(screen.getByText("Sistema")).toBeDefined();
  });

  it("llama a setTheme con 'dark' al hacer clic en Oscuro", async () => {
    render(<ThemeToggle />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    fireEvent.click(screen.getByLabelText("Toggle theme"));
    fireEvent.click(screen.getByText("Oscuro"));
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("llama a setTheme con 'light' al hacer clic en Claro", async () => {
    render(<ThemeToggle />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    fireEvent.click(screen.getByLabelText("Toggle theme"));
    fireEvent.click(screen.getByText("Claro"));
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("llama a setTheme con 'system' al hacer clic en Sistema", async () => {
    render(<ThemeToggle />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    fireEvent.click(screen.getByLabelText("Toggle theme"));
    fireEvent.click(screen.getByText("Sistema"));
    expect(mockSetTheme).toHaveBeenCalledWith("system");
  });

  it("cierra el dropdown al hacer clic fuera", async () => {
    render(<ThemeToggle />);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    fireEvent.click(screen.getByLabelText("Toggle theme"));
    expect(screen.getByText("Claro")).toBeDefined();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Claro")).toBeNull();
  });
});
