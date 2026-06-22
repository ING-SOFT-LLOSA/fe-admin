import { describe, it, expect } from "vitest";
import { Role } from '@/app/types/roles';

describe("Role enum", () => {
  it("has the expected values", () => {
    expect(Role.USER).toBe("USER");
    expect(Role.ADMIN).toBe("ADMIN");
    expect(Role.LEGAL).toBe("LEGAL");
    expect(Role.ASESOR).toBe("ASESOR");
    expect(Role.POSTVENTA).toBe("POSTVENTA");
  });

  it("has 5 members", () => {
    expect(Object.keys(Role).length).toBe(5);
  });
});
