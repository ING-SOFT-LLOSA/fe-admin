import { describe, it, expect } from "vitest";
import {
  deleteProyecto,
  fetchProyectos,
  updateProyecto,
} from "./services";

describe("proyectos services (re-exports)", () => {
  it("deleteProyecto es una función", () => {
    expect(typeof deleteProyecto).toBe("function");
  });

  it("fetchProyectos es una función", () => {
    expect(typeof fetchProyectos).toBe("function");
  });

  it("updateProyecto es una función", () => {
    expect(typeof updateProyecto).toBe("function");
  });
});
