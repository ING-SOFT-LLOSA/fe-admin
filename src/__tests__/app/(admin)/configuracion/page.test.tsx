/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act, within } from "@testing-library/react";
import EmployeeManagementPage from '@/app/(admin)/configuracion/page';

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api/users", () => ({
  fetchUsuarios: vi.fn(),
  fetchRoles: vi.fn(),
  registerEmpleado: vi.fn(),
  asignarRol: vi.fn(),
  desactivarUsuario: vi.fn(),
}));

vi.mock("@/components/auth/PermissionGuard", () => ({
  default: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/components/ui/DialogModal", () => ({
  default: ({ isOpen, title, message, onConfirm, onClose }: any) =>
    isOpen ? (
      <div data-testid="dialog">
        <h2>{title}</h2>
        <p>{message}</p>
        {onConfirm && (
          <button type="button" onClick={onConfirm} data-testid="dialog-confirm">
            Confirmar
          </button>
        )}
        <button type="button" onClick={onClose} data-testid="dialog-close">
          Cerrar
        </button>
      </div>
    ) : null,
}));

import { useAuth } from "@/contexts/AuthContext";
import {
  fetchUsuarios,
  fetchRoles,
  registerEmpleado,
  asignarRol,
  desactivarUsuario,
} from "@/lib/api/users";

const mockUseAuth = vi.mocked(useAuth);
const mockFetchUsuarios = vi.mocked(fetchUsuarios);
const mockFetchRoles = vi.mocked(fetchRoles);
const mockRegisterEmpleado = vi.mocked(registerEmpleado);
const mockAsignarRol = vi.mocked(asignarRol);
const mockDesactivar = vi.mocked(desactivarUsuario);

const sampleRoles = [
  {
    idRol: 1,
    nombre: "ADMIN",
    descripcion: "Administrador del sistema",
    funciones: [
      { idFuncion: 1, nombreCodigo: "USER_GESTIONAR", descripcion: "Gestionar usuarios" },
      { idFuncion: 2, nombreCodigo: "ROL_GESTIONAR", descripcion: "Gestionar roles" },
    ],
  },
  {
    idRol: 2,
    nombre: "ASESOR",
    descripcion: "Asesor comercial",
    funciones: [
      { idFuncion: 3, nombreCodigo: "CLIENTE_VER", descripcion: "Ver clientes" },
    ],
  },
  {
    idRol: 3,
    nombre: "LEGAL",
    descripcion: "Área legal",
    funciones: [],
  },
  {
    idRol: 4,
    nombre: "CLIENTE",
    descripcion: "Cliente externo",
    funciones: [],
  },
];

const sampleEmployees = [
  {
    id: 10,
    nombre: "Ana",
    apellidos: "García",
    email: "ana@empresa.com",
    tipoUsuario: "EMPLEADO",
    rol: "ADMIN",
    activo: true,
    telefono: "999111222",
    documentoIdentidad: "11111111",
    createdAt: "2026-01-01",
    funciones: ["USER_GESTIONAR"],
  },
  {
    id: 11,
    nombre: "Luis",
    apellidos: "Pérez",
    email: "luis@empresa.com",
    tipoUsuario: "EMPLEADO",
    rol: "ASESOR",
    activo: true,
    telefono: "999222333",
    documentoIdentidad: "22222222",
    createdAt: "2026-01-15",
    funciones: ["CLIENTE_VER"],
  },
  {
    id: 12,
    nombre: "Marta",
    apellidos: "López",
    email: "marta@empresa.com",
    tipoUsuario: "EMPLEADO",
    rol: "LEGAL",
    activo: false,
    telefono: "999333444",
    funciones: [],
  },
  {
    id: 99,
    nombre: "ClienteX",
    apellidos: "Test",
    email: "cx@test.com",
    tipoUsuario: "CLIENTE",
    rol: "USER",
    activo: true,
    funciones: [],
  },
];

// Helper: encontrar la fila de la tabla de un empleado por su nombre
function getRowByEmployeeName(name: string): HTMLElement {
  const rows = screen.getAllByRole("row");
  for (const r of rows) {
    if (r.textContent?.includes(name)) return r;
  }
  throw new Error(`Row not found for ${name}`);
}

describe("EmployeeManagementPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      perfil: { id: 10, nombre: "Admin", rol: "ADMIN", funciones: [] },
    } as any);
    mockFetchUsuarios.mockResolvedValue(sampleEmployees as any);
    mockFetchRoles.mockResolvedValue(sampleRoles as any);
    mockRegisterEmpleado.mockResolvedValue({} as any);
    mockAsignarRol.mockResolvedValue({} as any);
    mockDesactivar.mockResolvedValue(undefined);
  });

  it("muestra el título y descripción de la página", async () => {
    render(<EmployeeManagementPage />);
    expect(screen.getByText("Gestion de Empleados")).toBeDefined();
    expect(
      screen.getByText(/Administra usuarios internos, roles base, permisos y accesos/i),
    ).toBeDefined();
  });

  it("muestra el estado de carga inicialmente", () => {
    mockFetchUsuarios.mockReturnValue(new Promise(() => {}));
    render(<EmployeeManagementPage />);
    expect(screen.getByText("Cargando empleados...")).toBeDefined();
  });

  it("muestra los tabs Usuarios, Roles y Permisos", async () => {
    render(<EmployeeManagementPage />);
    expect(screen.getByText("Usuarios")).toBeDefined();
    expect(screen.getByText("Roles")).toBeDefined();
    expect(screen.getByText("Permisos")).toBeDefined();
  });

  it("filtra solo los usuarios tipo EMPLEADO en la lista", async () => {
    render(<EmployeeManagementPage />);
    const anaMatches = await screen.findAllByText("Ana García");
    expect(anaMatches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Luis Pérez")).toBeDefined();
    expect(screen.getByText("Marta López")).toBeDefined();
    expect(screen.queryByText("ClienteX Test")).toBeNull();
  });

  it("muestra el badge Activo/Inactivo según el estado del empleado", async () => {
    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García");
    const activos = screen.getAllByText("Activo");
    expect(activos.length).toBeGreaterThanOrEqual(2);
    const inactivos = screen.getAllByText("Inactivo");
    expect(inactivos.length).toBeGreaterThanOrEqual(1);
  });

  it("muestra el rol legible del empleado (ROLE_LABELS)", async () => {
    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García");
    expect(screen.getAllByText("Asesor (Comercial)").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Legal").length).toBeGreaterThanOrEqual(1);
  });

  it("permite cambiar entre tabs", async () => {
    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García");

    fireEvent.click(screen.getByText("Roles"));
    expect(screen.getAllByText("Permisos del rol").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Administrador del sistema")).toBeDefined();

    fireEvent.click(screen.getByText("Permisos"));
    expect(screen.getByText(/Catalogo de permisos/i)).toBeDefined();
    expect(screen.getByText("USER_GESTIONAR")).toBeDefined();
    expect(screen.getByText("Gestionar usuarios")).toBeDefined();

    fireEvent.click(screen.getByText("Usuarios"));
    expect(screen.getAllByText("Ana García").length).toBeGreaterThanOrEqual(1);
  });

  it("permite abrir el modal de crear usuario", async () => {
    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García"); // esperar a que carguen los datos
    const openBtn = screen.getByRole("button", { name: /Crear usuario/i });
    fireEvent.click(openBtn);

    expect(screen.getByText("Correo corporativo")).toBeDefined();
    expect(screen.getByText("Teléfono")).toBeDefined();
    expect(screen.getAllByText("Nombres").length).toBeGreaterThanOrEqual(1);
  });

  it("crea un usuario correctamente", async () => {
    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García");
    const openBtn = screen.getByRole("button", { name: /Crear usuario/i });
    fireEvent.click(openBtn);

    // Campos del modal (en orden: Nombres, Apellidos, Correo corporativo, Teléfono)
    const inputs = document.querySelectorAll("input[type='text'], input[type='email'], input[type='tel'], input:not([type])");
    fireEvent.change(inputs[0], { target: { value: "Carlos" } });
    fireEvent.change(inputs[1], { target: { value: "Ramírez" } });
    fireEvent.change(inputs[2], { target: { value: "carlos@empresa.com" } });

    const submitBtn = screen.getAllByRole("button", { name: /Crear usuario/i })
      .find((b) => b.getAttribute("type") === "submit");
    expect(submitBtn).toBeDefined();
    await act(async () => {
      fireEvent.click(submitBtn!);
    });

    await waitFor(() => {
      expect(mockRegisterEmpleado).toHaveBeenCalled();
    });
    const callArgs = mockRegisterEmpleado.mock.calls[0][0];
    expect(callArgs.nombre).toBe("Carlos");
    expect(callArgs.apellidos).toBe("Ramírez");
    expect(callArgs.email).toBe("carlos@empresa.com");
    expect(callArgs.tipoUsuario).toBe("EMPLEADO");
  });

  it("muestra error si el rol seleccionado no existe", async () => {
    // Forzamos que el form.rol no coincida con ningún rol
    mockFetchRoles.mockResolvedValue([]);

    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García");
    const openBtn = screen.getByRole("button", { name: /Crear usuario/i });
    fireEvent.click(openBtn);

    // Llenar campos requeridos
    const inputs = document.querySelectorAll("input[type='text'], input[type='email'], input[type='tel'], input:not([type])");
    fireEvent.change(inputs[0], { target: { value: "Carlos" } });
    fireEvent.change(inputs[1], { target: { value: "Ramírez" } });
    fireEvent.change(inputs[2], { target: { value: "carlos@empresa.com" } });

    const submitBtn = screen.getAllByRole("button", { name: /Crear usuario/i })
      .find((b) => b.getAttribute("type") === "submit");
    await act(async () => {
      fireEvent.click(submitBtn!);
    });

    expect(await screen.findAllByText("Selecciona un rol base valido.")).toBeDefined();
  });

  it("muestra mensaje de éxito al crear el usuario", async () => {
    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García");
    const openBtn = screen.getByRole("button", { name: /Crear usuario/i });
    fireEvent.click(openBtn);

    const inputs = document.querySelectorAll("input[type='text'], input[type='email'], input[type='tel'], input:not([type])");
    fireEvent.change(inputs[0], { target: { value: "Carlos" } });
    fireEvent.change(inputs[1], { target: { value: "Ramírez" } });
    fireEvent.change(inputs[2], { target: { value: "carlos@empresa.com" } });

    const submitBtn = screen.getAllByRole("button", { name: /Crear usuario/i })
      .find((b) => b.getAttribute("type") === "submit");
    await act(async () => {
      fireEvent.click(submitBtn!);
    });

    await waitFor(() => {
      expect(screen.getByText(/Usuario interno creado correctamente/i)).toBeDefined();
    });
  });

  it("muestra error al fallar la creación del usuario", async () => {
    mockRegisterEmpleado.mockRejectedValue(new Error("Correo duplicado"));

    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García");
    const openBtn = screen.getByRole("button", { name: /Crear usuario/i });
    fireEvent.click(openBtn);

    const inputs = document.querySelectorAll("input[type='text'], input[type='email'], input[type='tel'], input:not([type])");
    fireEvent.change(inputs[0], { target: { value: "Carlos" } });
    fireEvent.change(inputs[1], { target: { value: "Ramírez" } });
    fireEvent.change(inputs[2], { target: { value: "dup@empresa.com" } });

    const submitBtn = screen.getAllByRole("button", { name: /Crear usuario/i })
      .find((b) => b.getAttribute("type") === "submit");
    await act(async () => {
      fireEvent.click(submitBtn!);
    });

    expect(await screen.findAllByText("Correo duplicado")).toBeDefined();
  });

  it("muestra error genérico al fallar la creación con un error no-Error", async () => {
    mockRegisterEmpleado.mockRejectedValue("fallo crudo");

    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García");
    const openBtn = screen.getByRole("button", { name: /Crear usuario/i });
    fireEvent.click(openBtn);

    const inputs = document.querySelectorAll("input[type='text'], input[type='email'], input[type='tel'], input:not([type])");
    fireEvent.change(inputs[0], { target: { value: "Ana" } });
    fireEvent.change(inputs[1], { target: { value: "López" } });
    fireEvent.change(inputs[2], { target: { value: "a@b.com" } });

    const submitBtn = screen.getAllByRole("button", { name: /Crear usuario/i })
      .find((b) => b.getAttribute("type") === "submit");
    await act(async () => {
      fireEvent.click(submitBtn!);
    });

    expect(await screen.findAllByText("No se pudo crear el usuario.")).toBeDefined();
  });

  it("permite cancelar el modal de creación", async () => {
    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García");
    const openBtn = screen.getByRole("button", { name: /Crear usuario/i });
    fireEvent.click(openBtn);

    const cancelBtn = screen.getByRole("button", { name: /^Cancelar$/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText("Correo corporativo")).toBeNull();
    });
  });

  it("permite cerrar el modal con el botón X", async () => {
    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García");
    const openBtn = screen.getByRole("button", { name: /Crear usuario/i });
    fireEvent.click(openBtn);

    const allButtons = screen.getAllByRole("button");
    const closeBtn = allButtons.find(
      (b) =>
        b.querySelector(".material-symbols-outlined")?.textContent === "close" &&
        (b.className.includes("absolute") ||
          b.className.includes("hover:text-build-main") ||
          b.className.includes("text-slate-400 hover:text-build-main")),
    );
    expect(closeBtn).toBeDefined();
    if (closeBtn) fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText("Correo corporativo")).toBeNull();
    });
  });

  it("permite cambiar el rol de un empleado desde el sidebar", async () => {
    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García");

    const luisRow = getRowByEmployeeName("Luis Pérez");
    fireEvent.click(luisRow);

    const selects = screen.getAllByRole("combobox");
    const rolSelect = selects.find(
      (s) => (s as HTMLSelectElement).tagName === "SELECT",
    ) as HTMLSelectElement;
    expect(rolSelect).toBeDefined();
    fireEvent.change(rolSelect, { target: { value: "LEGAL" } });

    await waitFor(() => {
      expect(mockAsignarRol).toHaveBeenCalled();
    });
  });

  it("no permite cambiar el rol del propio usuario (admin)", async () => {
    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García");

    // Ana (id=10) es el admin logueado
    const selects = screen.getAllByRole("combobox");
    const rolSelect = selects.find(
      (s) => (s as HTMLSelectElement).tagName === "SELECT",
    ) as HTMLSelectElement;
    fireEvent.change(rolSelect, { target: { value: "LEGAL" } });

    expect(
      await screen.findByText(
        "No puedes cambiar tu propio rol ni degradar tu cuenta administrativa.",
      ),
    ).toBeDefined();
    expect(mockAsignarRol).not.toHaveBeenCalled();
  });

  it("muestra error al fallar el cambio de rol", async () => {
    mockAsignarRol.mockRejectedValue(new Error("Backend caído"));

    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García");
    const luisRow = getRowByEmployeeName("Luis Pérez");
    fireEvent.click(luisRow);

    const selects = screen.getAllByRole("combobox");
    const rolSelect = selects.find(
      (s) => (s as HTMLSelectElement).tagName === "SELECT",
    ) as HTMLSelectElement;
    fireEvent.change(rolSelect, { target: { value: "LEGAL" } });

    expect(await screen.findAllByText("Backend caído")).toBeDefined();
  });

  it("muestra error genérico si el cambio de rol falla con un error no-Error", async () => {
    mockAsignarRol.mockRejectedValue("fallo crudo");

    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García");
    const luisRow = getRowByEmployeeName("Luis Pérez");
    fireEvent.click(luisRow);

    const selects = screen.getAllByRole("combobox");
    const rolSelect = selects.find(
      (s) => (s as HTMLSelectElement).tagName === "SELECT",
    ) as HTMLSelectElement;
    fireEvent.change(rolSelect, { target: { value: "LEGAL" } });

    expect(await screen.findAllByText("Error al cambiar el rol.")).toBeDefined();
  });

  it("abre el diálogo de desactivación al hacer clic en el botón desactivar", async () => {
    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García");

    const deactivateBtns = screen.getAllByTitle("Desactivar usuario");
    fireEvent.click(deactivateBtns[0]);

    expect(await screen.findByText("Desactivar usuario")).toBeDefined();
    expect(
      screen.getByText(/¿Estás seguro de que deseas desactivar al usuario/),
    ).toBeDefined();
  });

  it("desactiva un usuario al confirmar el diálogo", async () => {
    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García");

    const deactivateBtns = screen.getAllByTitle("Desactivar usuario");
    fireEvent.click(deactivateBtns[0]);

    fireEvent.click(await screen.findByTestId("dialog-confirm"));

    await waitFor(() => {
      expect(mockDesactivar).toHaveBeenCalledWith(11);
    });
  });

  it("no permite desactivar al propio usuario (botón deshabilitado)", async () => {
    mockUseAuth.mockReturnValue({
      perfil: { id: 11, nombre: "Luis", rol: "ADMIN", funciones: [] },
    } as any);

    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García");

    const ownDeactivateBtn = screen.getAllByTitle("No puedes desactivar tu propio usuario");
    expect(ownDeactivateBtn.length).toBeGreaterThanOrEqual(1);
    ownDeactivateBtn.forEach((btn) => {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it("muestra error al fallar la desactivación", async () => {
    mockDesactivar.mockRejectedValue(new Error("Backend caído"));

    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García");

    const deactivateBtns = screen.getAllByTitle("Desactivar usuario");
    fireEvent.click(deactivateBtns[0]);

    fireEvent.click(await screen.findByTestId("dialog-confirm"));

    expect(await screen.findAllByText("Backend caído")).toBeDefined();
  });

  it("muestra error genérico al fallar la desactivación con error no-Error", async () => {
    mockDesactivar.mockRejectedValue("crudo");

    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García");

    const deactivateBtns = screen.getAllByTitle("Desactivar usuario");
    fireEvent.click(deactivateBtns[0]);

    fireEvent.click(await screen.findByTestId("dialog-confirm"));

    expect(
      await screen.findAllByText("Error al desactivar el usuario."),
    ).toBeDefined();
  });

  it("muestra error si la carga inicial de datos falla", async () => {
    mockFetchUsuarios.mockRejectedValue(new Error("No se pudo cargar"));

    render(<EmployeeManagementPage />);

    expect(await screen.findByText("No se pudo cargar")).toBeDefined();
  });

  it("muestra error genérico si la carga inicial falla con error no-Error", async () => {
    mockFetchUsuarios.mockRejectedValue("crudo");

    render(<EmployeeManagementPage />);

    expect(
      await screen.findByText("No se pudo cargar gestion de empleados."),
    ).toBeDefined();
  });

  it("muestra el sidebar con datos del usuario seleccionado", async () => {
    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García");
    expect(screen.getByText("Informacion general")).toBeDefined();
    expect(screen.getByText("Permisos personalizados")).toBeDefined();
    expect(screen.getAllByText("Rol base").length).toBeGreaterThanOrEqual(1);
  });

  it("muestra la lista de permisos del rol en el sidebar", async () => {
    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García");
    expect(screen.getByText("Gestionar usuarios")).toBeDefined();
  });

  it("permite seleccionar un empleado haciendo clic en la fila", async () => {
    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García");

    const luisRow = getRowByEmployeeName("Luis Pérez");
    fireEvent.click(luisRow);

    const aside = screen.getByText("Informacion general").closest("aside");
    expect(aside).toBeDefined();
    expect(aside?.textContent).toContain("Luis");
  });

  it("muestra el tab Permisos con el catálogo completo", async () => {
    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García");

    fireEvent.click(screen.getByText("Permisos"));
    expect(screen.getByText("USER_GESTIONAR")).toBeDefined();
    expect(screen.getByText("ROL_GESTIONAR")).toBeDefined();
    expect(screen.getByText("CLIENTE_VER")).toBeDefined();
  });

  it("renderiza el tab Roles con la descripción de cada rol", async () => {
    render(<EmployeeManagementPage />);
    await screen.findAllByText("Ana García");

    fireEvent.click(screen.getByText("Roles"));
    expect(screen.getByText("Asesor comercial")).toBeDefined();
    expect(screen.getByText("Área legal")).toBeDefined();
  });
});
