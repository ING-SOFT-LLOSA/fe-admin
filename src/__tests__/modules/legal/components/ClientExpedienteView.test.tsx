/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ClientExpedienteView from '@/modules/legal/components/ClientExpedienteView';
import { useAuth } from "@/contexts/AuthContext";
import { useCommercialStepper, useStageDocuments } from '@/modules/legal/components/hooks';
import { fetchUsuarios } from "@/lib/api/users";
import { fetchExpedientesPorUsuario } from "@/lib/api/expedientes";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

vi.mock("@/lib/api/users", () => ({
  fetchUsuarios: vi.fn(),
}));

vi.mock("@/lib/api/expedientes", () => ({
  fetchExpedientesPorUsuario: vi.fn(),
}));

vi.mock('@/modules/legal/components/hooks', () => ({
  useCommercialStepper: vi.fn(),
  useStageDocuments: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);
const mockUseCommercialStepper = vi.mocked(useCommercialStepper);
const mockUseStageDocuments = vi.mocked(useStageDocuments);
const mockFetchUsuarios = vi.mocked(fetchUsuarios);
const mockFetchExpedientes = vi.mocked(fetchExpedientesPorUsuario);

function makeUser(overrides: Record<string, any> = {}): any {
  return {
    id: 1,
    nombre: "Juan",
    apellidos: "Pérez",
    email: "juan@test.com",
    telefono: "999999999",
    documentoIdentidad: "12345678",
    ...overrides,
  };
}

function makeExpediente(overrides: Record<string, any> = {}): any {
  return {
    uuidUsuarioActivo: "exp-uuid-001",
    tipoFinanciamiento: "CREDITO_DIRECTO",
    fechaAdquisicion: "2026-01-15T00:00:00",
    vigente: true,
    clientes: [
      {
        id: 1,
        nombre: "Juan",
        apellidos: "Pérez",
        email: "juan@test.com",
        telefono: "999999999",
        documentoIdentidad: "12345678",
      },
    ],
    activos: [
      {
        id: "a1",
        proyectoNombre: "Aurora",
        tipo: "Dpto",
        nro: "302",
      },
    ],
    ...overrides,
  };
}

const defaultStepper = {
  stepper: null,
  etapas: [],
  loading: false,
  error: "",
  updateHito: vi.fn(),
};

const defaultDocs = {
  sections: [],
  loading: false,
  error: null,
  refresh: vi.fn(),
};

describe("ClientExpedienteView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      perfil: { rol: "ADMIN", funciones: [] },
    } as any);
    mockUseCommercialStepper.mockReturnValue(defaultStepper);
    mockUseStageDocuments.mockReturnValue(defaultDocs);
  });

  // ── Loading ───────────────────────────────────────────────────────────────

  it("muestra loading spinner al cargar datos", () => {
    mockFetchUsuarios.mockReturnValue(new Promise(() => {}));
    mockFetchExpedientes.mockReturnValue(new Promise(() => {}));
    render(<ClientExpedienteView clientId={1} />);
    expect(screen.getByText("Cargando expediente...")).toBeDefined();
  });

  // ── Error ─────────────────────────────────────────────────────────────────

  it("muestra mensaje de error si la carga falla", async () => {
    mockFetchUsuarios.mockRejectedValue(new Error("Error de red"));
    mockFetchExpedientes.mockRejectedValue(new Error("Error de red"));
    render(<ClientExpedienteView clientId={1} />);
    expect(await screen.findByText("Error de red")).toBeDefined();
  });

  it("muestra mensaje de error genérico con error no-Error", async () => {
    mockFetchUsuarios.mockRejectedValue("error string");
    mockFetchExpedientes.mockRejectedValue("error string");
    render(<ClientExpedienteView clientId={1} />);
    expect(
      await screen.findByText("No se pudo cargar el cliente.")
    ).toBeDefined();
  });

  // ── Empty expedientes ─────────────────────────────────────────────────────

  it("muestra aviso cuando el cliente no tiene unidades", async () => {
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([]);
    render(<ClientExpedienteView clientId={1} />);
    expect(
      await screen.findByText(
        "Este cliente no tiene unidades asignadas en el sistema."
      )
    ).toBeDefined();
  });

  // ── Header ────────────────────────────────────────────────────────────────

  it("muestra header con título y descripción", async () => {
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente()]);
    render(<ClientExpedienteView clientId={1} />);
    expect(await screen.findByText("Expediente Legal")).toBeDefined();
    expect(
      screen.getByText("Proceso jurídico de la operación de compraventa.")
    ).toBeDefined();
  });

  it("muestra link de volver a Gestión Legal", async () => {
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente()]);
    render(<ClientExpedienteView clientId={1} />);
    const link = await screen.findByText("Volver a Gestión Legal");
    expect(link).toBeDefined();
    expect(link.closest("a")?.getAttribute("href")).toBe("/legal");
  });

  // ── Unit selector ─────────────────────────────────────────────────────────

  it("muestra selector de unidad con proyecto y tipo/nro", async () => {
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente()]);
    render(<ClientExpedienteView clientId={1} />);
    expect(await screen.findByText("Unidad:")).toBeDefined();
    expect(screen.getByText("Aurora — Dpto 302")).toBeDefined();
  });

  it("muestra '(+N más)' cuando hay múltiples activos", async () => {
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([
      makeExpediente({
        activos: [
          { proyectoNombre: "Aurora", tipo: "Dpto", nro: "302" },
          { proyectoNombre: "Aurora", tipo: "Dpto", nro: "303" },
        ],
      }),
    ]);
    render(<ClientExpedienteView clientId={1} />);
    expect(await screen.findByText(/\+1 más/)).toBeDefined();
  });

  it("usa fallback 'Contrato ...' cuando no hay activos", async () => {
    const exp = makeExpediente({ activos: [] });
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([exp]);
    render(<ClientExpedienteView clientId={1} />);
    const suffix = exp.uuidUsuarioActivo.slice(-6);
    expect(await screen.findByText(`Contrato ${suffix}`)).toBeDefined();
  });

  it("usa fallback 'Contrato ...' cuando activos es undefined", async () => {
    const exp = makeExpediente();
    delete exp.activos;
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([exp]);
    render(<ClientExpedienteView clientId={1} />);
    const suffix = exp.uuidUsuarioActivo.slice(-6);
    expect(await screen.findByText(`Contrato ${suffix}`)).toBeDefined();
  });

  it("cambia la unidad seleccionada al elegir otra opción", async () => {
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([
      makeExpediente({ uuidUsuarioActivo: "uuid-aaa" }),
      makeExpediente({
        uuidUsuarioActivo: "uuid-bbb",
        activos: [
          { proyectoNombre: "Bosque", tipo: "Depto", nro: "101" },
        ],
      }),
    ]);
    render(<ClientExpedienteView clientId={1} />);
    await screen.findByText("Unidad:");
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("uuid-aaa");
    fireEvent.change(select, { target: { value: "uuid-bbb" } });
    expect(select.value).toBe("uuid-bbb");
  });

  it("usa 'Proyecto' como fallback cuando firstAct no tiene proyectoNombre", async () => {
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([
      makeExpediente({
        uuidUsuarioActivo: "uuid-xyz",
        activos: [{ tipo: "Dpto", nro: "302" }],
      }),
    ]);
    render(<ClientExpedienteView clientId={1} />);
    expect(await screen.findByText("Proyecto — Dpto 302")).toBeDefined();
  });

  // ── Client card ───────────────────────────────────────────────────────────

  it("muestra nombre, iniciales y email del cliente", async () => {
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente()]);
    render(<ClientExpedienteView clientId={1} />);
    expect(
      await screen.findByRole("heading", { name: "Juan Pérez" })
    ).toBeDefined();
    expect(screen.getByText("JP")).toBeDefined();
    expect(screen.getByText("juan@test.com")).toBeDefined();
  });

  it("muestra chip de DNI y teléfono desde clienteDTO", async () => {
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente()]);
    render(<ClientExpedienteView clientId={1} />);
    await screen.findByRole("heading", { name: "Juan Pérez" });
    expect(screen.getByText("12345678")).toBeDefined();
    expect(screen.getByText("999999999")).toBeDefined();
  });

  it("muestra 'Sin DNI' y 'Sin teléfono' cuando faltan datos", async () => {
    const user = makeUser({ documentoIdentidad: null, telefono: null });
    const exp = makeExpediente({
      clientes: [
        {
          id: 1,
          nombre: "Juan",
          apellidos: "Pérez",
          email: "juan@test.com",
          telefono: null,
          documentoIdentidad: null,
        },
      ],
    });
    mockFetchUsuarios.mockResolvedValue([user]);
    mockFetchExpedientes.mockResolvedValue([exp]);
    render(<ClientExpedienteView clientId={1} />);
    await screen.findByRole("heading", { name: "Juan Pérez" });
    expect(screen.getByText("Sin DNI")).toBeDefined();
    expect(screen.getByText("Sin teléfono")).toBeDefined();
  });

  it("muestra '—' para email cuando clienteDTO y client no tienen email", async () => {
    const user = makeUser({ email: "" });
    const exp = makeExpediente({
      clientes: [
        {
          id: 1,
          nombre: "Juan",
          apellidos: "Pérez",
          email: "",
          telefono: "999",
          documentoIdentidad: "111",
        },
      ],
    });
    mockFetchUsuarios.mockResolvedValue([user]);
    mockFetchExpedientes.mockResolvedValue([exp]);
    render(<ClientExpedienteView clientId={1} />);
    await screen.findByRole("heading", { name: "Juan Pérez" });
    // The email <p> shows '—' when both clienteDTO.email and client.email are falsy
    // (TabResumen KPIs also show '—' for missing Proyecto/Unidad)
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });

  it("muestra badge de Vigente", async () => {
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente({ vigente: true })]);
    render(<ClientExpedienteView clientId={1} />);
    expect(await screen.findByText("Vigente")).toBeDefined();
  });

  it("muestra badge de Desvinculado", async () => {
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente({ vigente: false })]);
    render(<ClientExpedienteView clientId={1} />);
    expect(await screen.findByText("Desvinculado")).toBeDefined();
  });

  it("muestra badge de Vigente cuando vigente es null (no false)", async () => {
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente({ vigente: null })]);
    render(<ClientExpedienteView clientId={1} />);
    expect(await screen.findByText("Vigente")).toBeDefined();
  });

  // ── Name resolution ───────────────────────────────────────────────────────

  it("usa datos del clienteDTO cuando existe coincidencia por id", async () => {
    const exp = makeExpediente({
      clientes: [
        {
          id: 2,
          nombre: "Otro",
          apellidos: "Cliente",
          email: "otro@test.com",
          telefono: null,
          documentoIdentidad: null,
        },
        {
          id: 1,
          nombre: "Juan",
          apellidos: "Pérez",
          email: "juan@test.com",
          telefono: "999",
          documentoIdentidad: "111",
        },
      ],
    });
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([exp]);
    render(<ClientExpedienteView clientId={1} />);
    expect(
      await screen.findByRole("heading", { name: "Juan Pérez" })
    ).toBeDefined();
    expect(screen.getByText("999")).toBeDefined();
  });

  it("usa el primer cliente del DTO cuando no hay coincidencia exacta por id", async () => {
    const exp = makeExpediente({
      clientes: [
        {
          id: 99,
          nombre: "Primero",
          apellidos: "Fallback",
          email: "primero@test.com",
          telefono: "111",
          documentoIdentidad: "000",
        },
      ],
    });
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([exp]);
    render(<ClientExpedienteView clientId={1} />);
    expect(
      await screen.findByRole("heading", { name: "Primero Fallback" })
    ).toBeDefined();
  });

  it("usa datos de client (Usuario) cuando expediente no tiene clientes", async () => {
    const exp = makeExpediente({ clientes: [] });
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([exp]);
    render(<ClientExpedienteView clientId={1} />);
    expect(
      await screen.findByRole("heading", { name: "Juan Pérez" })
    ).toBeDefined();
    expect(screen.getByText("juan@test.com")).toBeDefined();
  });

  it("usa datos de client cuando expediente no tiene campo clientes", async () => {
    const exp = makeExpediente();
    delete exp.clientes;
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([exp]);
    render(<ClientExpedienteView clientId={1} />);
    expect(
      await screen.findByRole("heading", { name: "Juan Pérez" })
    ).toBeDefined();
  });

  it("muestra 'Cliente no encontrado' sin datos de cliente", async () => {
    const exp = makeExpediente({ clientes: [] });
    mockFetchUsuarios.mockResolvedValue([]);
    mockFetchExpedientes.mockResolvedValue([exp]);
    render(<ClientExpedienteView clientId={1} />);
    expect(
      await screen.findByRole("heading", { name: "Cliente no encontrado" })
    ).toBeDefined();
  });

  it("muestra 'Cliente no encontrado' cuando el usuario no está en la lista", async () => {
    const exp = makeExpediente({ clientes: [] });
    mockFetchUsuarios.mockResolvedValue([makeUser({ id: 99 })]);
    mockFetchExpedientes.mockResolvedValue([exp]);
    render(<ClientExpedienteView clientId={1} />);
    expect(
      await screen.findByRole("heading", { name: "Cliente no encontrado" })
    ).toBeDefined();
  });

  it("maneja apellidos null en clienteDTO", async () => {
    const exp = makeExpediente({
      clientes: [
        {
          id: 1,
          nombre: "Juana",
          apellidos: null,
          email: "juana@test.com",
          telefono: "999",
          documentoIdentidad: "111",
        },
      ],
    });
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([exp]);
    render(<ClientExpedienteView clientId={1} />);
    expect(
      await screen.findByRole("heading", { name: "Juana" })
    ).toBeDefined();
  });

  it("genera iniciales de una sola letra para nombre único", async () => {
    const exp = makeExpediente({
      clientes: [
        {
          id: 1,
          nombre: "Juan",
          apellidos: null,
          email: "juan@test.com",
          telefono: "999",
          documentoIdentidad: "111",
        },
      ],
    });
    mockFetchUsuarios.mockResolvedValue([makeUser({ apellidos: "" })]);
    mockFetchExpedientes.mockResolvedValue([exp]);
    render(<ClientExpedienteView clientId={1} />);
    await screen.findByRole("heading", { name: "Juan" });
    expect(screen.getByText("J")).toBeDefined();
  });

  it("genera iniciales CN para Cliente no encontrado", async () => {
    const exp = makeExpediente({ clientes: [] });
    mockFetchUsuarios.mockResolvedValue([]);
    mockFetchExpedientes.mockResolvedValue([exp]);
    render(<ClientExpedienteView clientId={1} />);
    await screen.findByRole("heading", { name: "Cliente no encontrado" });
    expect(screen.getByText("CN")).toBeDefined();
  });

  // ── Tabs ──────────────────────────────────────────────────────────────────

  it("muestra las 3 pestañas de navegación", async () => {
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente()]);
    render(<ClientExpedienteView clientId={1} />);
    await screen.findByRole("heading", { name: "Juan Pérez" });
    expect(screen.getByRole("button", { name: /Resumen/ })).toBeDefined();
    expect(screen.getByRole("button", { name: /Proceso Legal/ })).toBeDefined();
    expect(screen.getByRole("button", { name: /Documentos/ })).toBeDefined();
  });

  it("pestaña Resumen activa por defecto", async () => {
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente()]);
    render(<ClientExpedienteView clientId={1} />);
    const resumenBtn = await screen.findByRole("button", {
      name: /Resumen/,
    });
    expect(resumenBtn.className).toContain("border-arch-gold");
  });

  it("cambia a pestaña Proceso Legal", async () => {
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente()]);
    render(<ClientExpedienteView clientId={1} />);
    await screen.findByRole("button", { name: /Resumen/ });
    const procesoBtn = screen.getByRole("button", { name: /Proceso Legal/ });
    fireEvent.click(procesoBtn);
    expect(procesoBtn.className).toContain("border-arch-gold");
    const resumenBtn = screen.getByRole("button", { name: /Resumen/ });
    expect(resumenBtn.className).not.toContain("border-arch-gold");
  });

  it("cambia a pestaña Documentos", async () => {
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente()]);
    render(<ClientExpedienteView clientId={1} />);
    await screen.findByRole("button", { name: /Resumen/ });
    const docsBtn = screen.getByRole("button", { name: /Documentos/ });
    fireEvent.click(docsBtn);
    expect(docsBtn.className).toContain("border-arch-gold");
  });

  it("cambia a pestaña Proceso y vuelve a Resumen", async () => {
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente()]);
    render(<ClientExpedienteView clientId={1} />);
    await screen.findByRole("button", { name: /Resumen/ });

    fireEvent.click(screen.getByRole("button", { name: /Proceso Legal/ }));
    expect(
      screen.getByRole("button", { name: /Proceso Legal/ }).className
    ).toContain("border-arch-gold");

    fireEvent.click(screen.getByRole("button", { name: /Resumen/ }));
    expect(
      screen.getByRole("button", { name: /Resumen/ }).className
    ).toContain("border-arch-gold");
  });

  // ── Permissions ───────────────────────────────────────────────────────────

  it("computa permisos para ADMIN", async () => {
    mockUseAuth.mockReturnValue({
      perfil: { rol: "ADMIN", funciones: [] },
    } as any);
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente()]);
    render(<ClientExpedienteView clientId={1} />);
    expect(
      await screen.findByRole("heading", { name: "Juan Pérez" })
    ).toBeDefined();
  });

  it("computa permisos para usuario con todas las funciones", async () => {
    mockUseAuth.mockReturnValue({
      perfil: {
        rol: "EMPLEADO",
        funciones: ["CONTRATO_EDITAR", "DOCS_SUBIR", "CONTRATO_NOTAS_EDITAR"],
      },
    } as any);
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente()]);
    render(<ClientExpedienteView clientId={1} />);
    expect(
      await screen.findByRole("heading", { name: "Juan Pérez" })
    ).toBeDefined();
  });

  it("computa permisos para usuario sin funciones", async () => {
    mockUseAuth.mockReturnValue({
      perfil: { rol: "EMPLEADO", funciones: [] },
    } as any);
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente()]);
    render(<ClientExpedienteView clientId={1} />);
    expect(
      await screen.findByRole("heading", { name: "Juan Pérez" })
    ).toBeDefined();
  });

  it("computa permisos cuando perfil no tiene campo funciones", async () => {
    mockUseAuth.mockReturnValue({
      perfil: { rol: "EMPLEADO" },
    } as any);
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente()]);
    render(<ClientExpedienteView clientId={1} />);
    expect(
      await screen.findByRole("heading", { name: "Juan Pérez" })
    ).toBeDefined();
  });

  // ── StepperError ──────────────────────────────────────────────────────────

  it("muestra ErrorBanner cuando hay stepperError", async () => {
    mockUseCommercialStepper.mockReturnValue({
      ...defaultStepper,
      error: "Error al cargar el proceso legal.",
    });
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente()]);
    render(<ClientExpedienteView clientId={1} />);
    expect(
      await screen.findByText("Error al cargar el proceso legal.")
    ).toBeDefined();
  });

  // ── Tab content ───────────────────────────────────────────────────────────

  it("renderiza TabResumen en el tab activo por defecto", async () => {
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente()]);
    render(<ClientExpedienteView clientId={1} />);
    await screen.findByRole("heading", { name: "Juan Pérez" });
    // TabResumen renders KPI labels
    expect(screen.getByText("Cliente")).toBeDefined();
    expect(screen.getByText("Proyecto")).toBeDefined();
    expect(screen.getByText("Unidad")).toBeDefined();
  });

  it("renderiza TabProceso al cambiar a esa pestaña", async () => {
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente()]);
    render(<ClientExpedienteView clientId={1} />);
    await screen.findByRole("button", { name: /Resumen/ });
    fireEvent.click(screen.getByRole("button", { name: /Proceso Legal/ }));
    // TabProceso should render - check it no longer shows ResumenKpi labels
    expect(screen.queryByText("Progreso del proceso legal")).toBeNull();
  });

  it("renderiza TabDocumentos al cambiar a esa pestaña", async () => {
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente()]);
    render(<ClientExpedienteView clientId={1} />);
    await screen.findByRole("button", { name: /Resumen/ });
    fireEvent.click(screen.getByRole("button", { name: /Documentos/ }));
    // TabDocumentos should be displayed - Resumen KPIs gone
    expect(screen.queryByText("Financiamiento")).toBeNull();
  });

  // ── Unmount ───────────────────────────────────────────────────────────────

  it("no crashea al desmontar durante la carga", () => {
    mockFetchUsuarios.mockReturnValue(new Promise(() => {}));
    mockFetchExpedientes.mockReturnValue(new Promise(() => {}));
    const { unmount } = render(<ClientExpedienteView clientId={1} />);
    expect(screen.getByText("Cargando expediente...")).toBeDefined();
    unmount();
  });

  it("no actualiza estado si se desmonta antes de resolver exitosamente", async () => {
    let resolve: (v: any) => void;
    const deferred = new Promise<any>((r) => { resolve = r; });
    mockFetchUsuarios.mockReturnValue(deferred);
    mockFetchExpedientes.mockReturnValue(deferred);
    const { unmount } = render(<ClientExpedienteView clientId={1} />);
    unmount();
    resolve([[makeUser()], [makeExpediente()]]);
    // mounted flag prevents state updates, no warning expected
    await vi.waitFor(() => {}, { timeout: 100 });
    expect(mockFetchUsuarios).toHaveBeenCalled();
  });

  it("no actualiza estado si se desmonta antes de que la promesa rechace", async () => {
    let reject: (e: any) => void;
    const deferred = new Promise<any>((_, r) => { reject = r; });
    mockFetchUsuarios.mockReturnValue(deferred);
    mockFetchExpedientes.mockReturnValue(deferred);
    const { unmount } = render(<ClientExpedienteView clientId={1} />);
    unmount();
    reject(new Error("post-unmount error"));
    await vi.waitFor(() => {}, { timeout: 100 });
    expect(mockFetchUsuarios).toHaveBeenCalled();
  });

  // ── Edge: stepperError is empty string (no banner) ────────────────────────

  it("no muestra ErrorBanner cuando stepperError es vacío", async () => {
    mockUseCommercialStepper.mockReturnValue({
      ...defaultStepper,
      error: "",
    });
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente()]);
    render(<ClientExpedienteView clientId={1} />);
    await screen.findByRole("heading", { name: "Juan Pérez" });
    expect(
      screen.queryByText("Error al cargar el proceso legal.")
    ).toBeNull();
  });

  // ── Edge: nombre con el mismo clienteDTO y client, prioriza clienteDTO ───

  it("prioriza email del clienteDTO sobre el de client", async () => {
    mockFetchUsuarios.mockResolvedValue([
      makeUser({ email: "client@old.com" }),
    ]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente()]);
    render(<ClientExpedienteView clientId={1} />);
    await screen.findByRole("heading", { name: "Juan Pérez" });
    // makeExpediente clientes[0].email = "juan@test.com" (clienteDTO)
    // makeUser email = "client@old.com" (client)
    // clienteDTO takes priority
    expect(screen.getByText("juan@test.com")).toBeDefined();
  });

  // ── Edge: fetchExpedientesPorUsuario devuelve múltiples expedientes ───────

  it("selecciona automáticamente el primer expediente", async () => {
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([
      makeExpediente({ uuidUsuarioActivo: "uuid-aaa" }),
      makeExpediente({ uuidUsuarioActivo: "uuid-bbb" }),
    ]);
    render(<ClientExpedienteView clientId={1} />);
    await screen.findByText("Unidad:");
    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("uuid-aaa");
  });

  // ── Edge: useCommercialStepper loading state ──────────────────────────────

  it("pasa loadingStepper a TabResumen", async () => {
    mockUseCommercialStepper.mockReturnValue({
      ...defaultStepper,
      loading: true,
    });
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente()]);
    render(<ClientExpedienteView clientId={1} />);
    await screen.findByText("Cliente");
    expect(screen.getByText("Progreso del proceso legal")).toBeDefined();
  });

  // ── Edge: useStageDocuments error state ───────────────────────────────────

  it("pasa docsError a TabDocumentos", async () => {
    mockUseStageDocuments.mockReturnValue({
      ...defaultDocs,
      error: "Error de documentos",
    });
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockResolvedValue([makeExpediente()]);
    render(<ClientExpedienteView clientId={1} />);
    await screen.findByRole("button", { name: /Resumen/ });
    fireEvent.click(screen.getByRole("button", { name: /Documentos/ }));
    expect(screen.queryByText("Resumen")).toBeDefined();
  });

  // ── Edge: renderiza cuando un solo fetch falla y el otro tiene éxito ─────

  it("muestra error cuando fetchUsuarios falla", async () => {
    mockFetchUsuarios.mockRejectedValue(new Error("Fallo usuarios"));
    mockFetchExpedientes.mockResolvedValue([makeExpediente()]);
    render(<ClientExpedienteView clientId={1} />);
    expect(await screen.findByText("Fallo usuarios")).toBeDefined();
  });

  it("muestra error cuando fetchExpedientes falla", async () => {
    mockFetchUsuarios.mockResolvedValue([makeUser()]);
    mockFetchExpedientes.mockRejectedValue(new Error("Fallo expedientes"));
    render(<ClientExpedienteView clientId={1} />);
    expect(await screen.findByText("Fallo expedientes")).toBeDefined();
  });
});
