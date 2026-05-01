"use client";
import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";

type Employee = {
  id: number;
  initials: string;
  color: string;
  name: string;
  email: string;
  role: string;
  status: "ACTIVE" | "INACTIVE";
  phone: string;
  area: string;
};

const EMPLOYEES: Employee[] = [
  { id: 1, initials: "ER", color: "bg-[#023143] text-white", name: "Elena Rodriguez",  email: "elena.r@llosa.com",   role: "Asesor Comercial", status: "ACTIVE", phone: "+51 999 111 222", area: "Comercial" },
  { id: 2, initials: "CM", color: "bg-[#442605] text-[#ffdcbf]", name: "Carlos Mendez",    email: "c.mendez@llosa.com",  role: "Legal",             status: "ACTIVE", phone: "+51 998 223 344", area: "Legal" },
  { id: 3, initials: "ST", color: "bg-[#e9e0e1] text-[#635d5e]", name: "Sofia Torres",     email: "s.torres@llosa.com",  role: "Post-venta",        status: "INACTIVE", phone: "+51 997 445 566", area: "Postventa" },
  { id: 4, initials: "DC", color: "bg-[#c2e8ff] text-[#001b27]", name: "David Chen",       email: "d.chen@llosa.com",    role: "Super Admin",       status: "ACTIVE", phone: "+51 996 778 899", area: "Dirección" },
];

const ROLES = ["Asesor Comercial", "Legal", "Post-venta", "Administrador", "Super Admin"];

export default function EmployeesPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(EMPLOYEES[0]);
  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedRole, setSelectedRole] = useState(EMPLOYEES[0].role);
  const [name, setName] = useState(EMPLOYEES[0].name);
  const [email, setEmail] = useState(EMPLOYEES[0].email);
  const [phone, setPhone] = useState(EMPLOYEES[0].phone);
  const [area, setArea] = useState(EMPLOYEES[0].area);
  const [statusFilter, setStatusFilter] = useState<"Todos" | "Activo" | "Inactivo">("Activo");
  const [roleFilter, setRoleFilter] = useState("Todos los Roles");

  const filtered = EMPLOYEES.filter(e =>
    (statusFilter === "Todos" || e.status === (statusFilter === "Activo" ? "ACTIVE" : "INACTIVE")) &&
    (roleFilter === "Todos los Roles" || e.role === roleFilter)
  );

  function openPanel(emp: Employee) {
    setSelectedEmployee(emp);
    setSelectedRole(emp.role);
    setName(emp.name);
    setEmail(emp.email);
    setPhone(emp.phone);
    setArea(emp.area);
    setPanelOpen(true);
  }

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-[36px] leading-[44px] font-bold tracking-[-0.02em] text-[#1a1c1d]">
            Directorio de Empleados
          </h2>
          <p className="text-sm text-[#3d6377] mt-1">
            Prioriza la administración de usuarios y edición de datos de cada empleado.
          </p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-[#023143] text-white text-sm font-semibold rounded-lg hover:bg-[#001b27] transition-colors shadow-sm">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Crear Empleado (Super Admin)
        </button>
      </div>

      {/* Layout: table + slide panel */}
      <div className="flex gap-6 items-start">
        {/* Table Card */}
        <div className={`flex-1 bg-white rounded-xl border border-[#e2e2e4] shadow-[0_4px_20px_rgba(2,49,67,0.04)] overflow-hidden transition-all duration-300 ${panelOpen ? "min-w-0" : ""}`}>
          {/* Filter Bar */}
          <div className="px-6 py-4 border-b border-[#e2e2e4] flex items-center gap-3">
            {/* Role filter */}
            <div className="relative">
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 bg-[#f4f3f5] border border-[#c1c7cc] rounded-lg text-sm text-[#1a1c1d] font-medium focus:outline-none focus:border-[#023143] cursor-pointer"
              >
                <option>Todos los Roles</option>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#72787c] text-[16px] pointer-events-none">expand_more</span>
            </div>
            {/* Status filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as "Todos" | "Activo" | "Inactivo")}
                className="appearance-none pl-3 pr-8 py-1.5 bg-[#f4f3f5] border border-[#c1c7cc] rounded-lg text-sm text-[#1a1c1d] font-medium focus:outline-none focus:border-[#023143] cursor-pointer"
              >
                <option>Todos</option>
                <option>Activo</option>
                <option>Inactivo</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#72787c] text-[16px] pointer-events-none">expand_more</span>
            </div>
            <span className="ml-auto text-sm text-[#72787c]">
              Mostrando <span className="font-semibold text-[#1a1c1d]">{filtered.length}</span> de{" "}
              <span className="font-semibold text-[#023143]">42</span>
            </span>
          </div>

          {/* Table */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e2e2e4] bg-[#f9f9fb]">
                {["Empleado", "Rol", "Estado", "Acciones"].map(h => (
                  <th key={h} className={`py-3 px-6 text-[12px] font-semibold text-[#72787c] uppercase tracking-wider ${h === "Acciones" ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e2e4]">
              {filtered.map(emp => {
                const isSelected = selectedEmployee?.id === emp.id && panelOpen;
                return (
                  <tr
                    key={emp.id}
                    className={`transition-colors cursor-pointer group ${isSelected ? "bg-[#f4f3f5]" : "hover:bg-[#f9f9fb]"}`}
                    onClick={() => openPanel(emp)}
                  >
                    {/* Employee */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${emp.color}`}>
                          {emp.initials}
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${isSelected ? "text-[#023143]" : "text-[#1a1c1d]"}`}>{emp.name}</p>
                          <p className="text-xs text-[#3d6377] mt-0.5">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    {/* Role */}
                    <td className="py-4 px-6 text-sm text-[#41484c]">{emp.role}</td>
                    {/* Status */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        emp.status === "ACTIVE"
                          ? "bg-[#E8F5E9] text-[#2E7D32]"
                          : "bg-[#e2e2e4] text-[#41484c]"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.status === "ACTIVE" ? "bg-[#2E7D32]" : "bg-[#72787c]"}`} />
                        {emp.status === "ACTIVE" ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={e => { e.stopPropagation(); openPanel(emp); }}
                        className={`p-1.5 rounded-md transition-colors ${isSelected ? "text-[#023143] bg-[#c2e8ff]" : "text-[#72787c] hover:text-[#023143] hover:bg-[#c2e8ff] opacity-0 group-hover:opacity-100"}`}
                        title="Editar empleado"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-16 text-center text-[#72787c] text-sm">Ningún empleado coincide con los filtros.</div>
          )}
        </div>

        {/* Edit Employee Panel */}
        {panelOpen && selectedEmployee && (
          <div className="w-[320px] shrink-0 bg-white rounded-xl border border-[#e2e2e4] shadow-[0_8px_32px_rgba(2,49,67,0.10)] overflow-hidden">
            {/* Panel Header */}
            <div className="px-6 py-5 border-b border-[#e2e2e4] flex items-start justify-between bg-[#f9f9fb]">
              <div>
                <h3 className="text-base font-bold text-[#1a1c1d]">Editar Empleado</h3>
                <p className="text-sm text-[#41484c] mt-0.5">{selectedEmployee.name}</p>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-[#72787c] hover:bg-[#e2e2e4] hover:text-[#1a1c1d] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="px-6 py-5 space-y-3">
              <div>
                <label className="text-[12px] font-semibold text-[#41484c] uppercase tracking-wider block mb-1.5">Nombre</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-[#c1c7cc] rounded-lg text-sm focus:outline-none focus:border-[#023143]" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#41484c] uppercase tracking-wider block mb-1.5">Correo</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-[#c1c7cc] rounded-lg text-sm focus:outline-none focus:border-[#023143]" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#41484c] uppercase tracking-wider block mb-1.5">Teléfono</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border border-[#c1c7cc] rounded-lg text-sm focus:outline-none focus:border-[#023143]" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#41484c] uppercase tracking-wider block mb-1.5">Área</label>
                <input value={area} onChange={(e) => setArea(e.target.value)} className="w-full px-3 py-2 border border-[#c1c7cc] rounded-lg text-sm focus:outline-none focus:border-[#023143]" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#41484c] uppercase tracking-wider block mb-1.5">Rol</label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  className="w-full appearance-none pl-3 pr-9 py-2.5 bg-white border border-[#c1c7cc] rounded-lg text-sm text-[#1a1c1d] font-medium focus:outline-none focus:border-[#023143] cursor-pointer"
                >
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-[#41484c] uppercase tracking-wider block mb-1.5">Estado</label>
                <select className="w-full px-3 py-2.5 bg-white border border-[#c1c7cc] rounded-lg text-sm focus:outline-none focus:border-[#023143]">
                  <option>Activo</option>
                  <option>Inactivo</option>
                </select>
              </div>
              <div className="pt-2 text-[11px] text-[#72787c]">
                La gestión de permisos por empleado se realiza en el módulo de Permisos.
              </div>
            </div>

            {/* Panel Footer */}
            <div className="px-6 py-4 border-t border-[#e2e2e4] flex gap-3 bg-[#f9f9fb]">
              <button
                onClick={() => setPanelOpen(false)}
                className="flex-1 py-2 rounded-lg border border-[#c1c7cc] text-sm font-semibold text-[#41484c] hover:bg-[#e2e2e4] transition-colors"
              >
                Cancelar
              </button>
              <button className="flex-1 py-2 rounded-lg bg-[#023143] text-white text-sm font-semibold hover:bg-[#001b27] transition-colors shadow-sm">
                Guardar Cambios
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
