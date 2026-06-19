import { describe, it, expect } from "vitest";
import {
  createActivo,
  deleteActivo,
  fetchActivosPorProyecto,
  updateActivo,
} from "./services";

describe("inventario services (re-exports)", () => {
  it("createActivo es una función", () => {
    expect(typeof createActivo).toBe("function");
  });

  it("deleteActivo es una función", () => {
    expect(typeof deleteActivo).toBe("function");
  });

  it("fetchActivosPorProyecto es una función", () => {
    expect(typeof fetchActivosPorProyecto).toBe("function");
  });

  it("updateActivo es una función", () => {
    expect(typeof updateActivo).toBe("function");
  });
});
