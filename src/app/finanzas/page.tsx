"use client";
import React, { useState } from "react";
import AdminLayout from "@/components/AdminLayout";

// --- Types ---
type PaymentStatus = "Pendiente" | "Mora" | "Pagado" | "Pago Parcial";
type Cuota = { id: string; num: number; date: string; amount: number; status: PaymentStatus; voucherUrl?: string };
type ClientFinance = {
  id: string;
  name: string;
  project: string;
  unit: string;
  totalValue: number;
  finalActSigned: boolean;
  schedule: Cuota[];
};

// --- Mocks ---
const INITIAL_CLIENTS: ClientFinance[] = [
  {
    id: "C001", name: "Carlos Mendoza", project: "Torre Aviana", unit: "1402", totalValue: 245000, finalActSigned: false,
    schedule: [
      { id: "Q1", num: 1, date: "2024-01-15", amount: 50000, status: "Pagado", voucherUrl: "s3://voucher_123.pdf" },
      { id: "Q2", num: 2, date: "2024-06-15", amount: 95000, status: "Mora" },
      { id: "Q3", num: 3, date: "2024-12-15", amount: 100000, status: "Pendiente" },
    ]
  },
  {
    id: "C002", name: "Maria Fernanda Rojas", project: "Parque Sur", unit: "501", totalValue: 340000, finalActSigned: true,
    schedule: [
      { id: "R1", num: 1, date: "2023-01-10", amount: 100000, status: "Pagado", voucherUrl: "s3://voucher_x.pdf" },
      { id: "R2", num: 2, date: "2023-06-10", amount: 140000, status: "Pagado", voucherUrl: "s3://voucher_y.pdf" },
      { id: "R3", num: 3, date: "2023-10-10", amount: 100000, status: "Pagado", voucherUrl: "s3://voucher_z.pdf" },
    ]
  }
];

export default function FinancePage() {
  const [clients, setClients] = useState<ClientFinance[]>(INITIAL_CLIENTS);
  const [activeClient, setActiveClient] = useState<ClientFinance | null>(null);

  // CU010: Schedule Editor
  const [editingSchedule, setEditingSchedule] = useState<Cuota[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleSuccess, setScheduleSuccess] = useState("");

  // CU011: Payment Conciliation
  const [conciliationModal, setConciliationModal] = useState(false);
  const [conciliateCuota, setConciliateCuota] = useState<Cuota | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentBank, setPaymentBank] = useState("BCP");
  const [paymentOp, setPaymentOp] = useState("");

  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const [voucherError, setVoucherError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [conciliationSuccess, setConciliationSuccess] = useState("");

  // Number Format helper
  const fmt = (num: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);

  // --- CU010: Manage Schedule ---
  function handleClientSelect(c: ClientFinance) {
    setActiveClient(c);
    setEditingSchedule(JSON.parse(JSON.stringify(c.schedule))); // Deep copy for editing
    setScheduleError("");
    setScheduleSuccess("");
  }

  function addCuota() {
    if (activeClient?.finalActSigned) return;
    setEditingSchedule([...editingSchedule, { id: `NEW_${Date.now()}`, num: editingSchedule.length + 1, date: "", amount: 0, status: "Pendiente" }]);
  }

  function updateCuotaAmount(id: string, newAmt: number) {
    setEditingSchedule(prev => prev.map(q => q.id === id ? { ...q, amount: newAmt } : q));
  }
  function updateCuotaDate(id: string, newDate: string) {
    setEditingSchedule(prev => prev.map(q => q.id === id ? { ...q, date: newDate } : q));
  }
  function deleteCuota(id: string) {
    if (activeClient?.finalActSigned) return;
    setEditingSchedule(prev => prev.filter(q => q.id !== id).map((q, i) => ({ ...q, num: i + 1 })));
  }

  function saveSchedule() {
    if (!activeClient) return;
    setScheduleError("");

    // Integrity Check
    const totalSum = editingSchedule.reduce((acc, q) => acc + q.amount, 0);
    if (totalSum !== activeClient.totalValue) {
      setScheduleError(`Error de Integridad: La suma de cuotas (${fmt(totalSum)}) no coincide con el valor total del contrato (${fmt(activeClient.totalValue)}). Faltan ${fmt(activeClient.totalValue - totalSum)}.`);
      return;
    }

    const hasPastDates = editingSchedule.some(q => q.status === "Pendiente" && new Date(q.date) < new Date());
    if (hasPastDates) {
      setScheduleError(`Error: Existen cuotas 'Pendientes' con fecha de vencimiento en el pasado. Ajústelas antes de guardar.`);
      return;
    }

    setScheduleLoading(true);

    // Mock Save and Google Calendar API Call
    setTimeout(() => {
      setScheduleLoading(false);
      setScheduleSuccess("Cronograma actualizado. Eventos sincronizados exitosamente con Google Calendar.");

      // Update root cache
      setClients(prev => prev.map(c => c.id === activeClient.id ? { ...c, schedule: editingSchedule } : c));
      setActiveClient({ ...activeClient, schedule: editingSchedule });

      setTimeout(() => setScheduleSuccess(""), 4500);
    }, 1800);
  }

  // --- CU011: Payment Conciliation ---
  function openConciliate(cuota: Cuota) {
    setConciliateCuota(cuota);
    setPaymentAmount(cuota.amount);
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentOp("");
    setVoucherFile(null);
    setVoucherError("");
    setConciliationSuccess("");
    setConciliationModal(true);
  }

  function handleVoucherSelection(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setVoucherError("");

    const validTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) {
      setVoucherError("Error: El comprobante debe estar en formato PDF, JPG o PNG.");
      setVoucherFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setVoucherError("Error: El archivo excede los 10MB permitidos.");
      setVoucherFile(null);
      return;
    }

    setVoucherFile(file);
  }

  function submitConciliation() {
    if (!conciliateCuota || !activeClient) return;
    setIsUploading(true);
    setVoucherError("");

    setTimeout(() => {
      setIsUploading(false);

      const isPartial = paymentAmount < conciliateCuota.amount;
      let newSchedule = [...activeClient.schedule];
      const idx = newSchedule.findIndex(q => q.id === conciliateCuota.id);

      if (isPartial) {
        // Modify current cuota to partial
        newSchedule[idx].status = "Pago Parcial";
        newSchedule[idx].amount = paymentAmount;
        newSchedule[idx].voucherUrl = `s3://mock_voucher_${Date.now()}.png`;

        // Create a new remaining cuota
        const remainder = conciliateCuota.amount - paymentAmount;
        newSchedule.splice(idx + 1, 0, {
          id: `REMAIN_${Date.now()}`,
          num: newSchedule[idx].num, // Usually renumbered, we simplify here
          date: conciliateCuota.date, // Same due date
          amount: remainder,
          status: "Pendiente"
        });

        // Renumber
        newSchedule = newSchedule.map((q, i) => ({ ...q, num: i + 1 }));
      } else {
        // Full payment
        newSchedule[idx].status = "Pagado";
        newSchedule[idx].voucherUrl = `s3://mock_voucher_${Date.now()}.png`;
      }

      // Apply
      setClients(prev => prev.map(c => c.id === activeClient.id ? { ...c, schedule: newSchedule } : c));
      setActiveClient({ ...activeClient, schedule: newSchedule });
      setEditingSchedule(newSchedule);

      setConciliationSuccess(`¡Pago conciliado! Se procesó un ${isPartial ? "Pago Parcial" : "Pago Total"}. Comprobante cargado a S3 y Cliente Notificado vía Email automatizado.`);

      setTimeout(() => {
        setConciliationModal(false);
      }, 4000);
    }, 2000);
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-[36px] leading-[44px] font-bold tracking-[-0.02em] text-[#001b27]">Finanzas y Cronogramas</h1>
          <p className="text-base text-[#41484c] mt-2">Gestiona el flujo de caja, estructura de pagos y conciliación bancaria obligatoria de cuotas (RN-006).</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Col: Client Selection */}
        <div className="col-span-12 xl:col-span-4">
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-[0_4px_20px_rgba(2,49,67,0.05)] h-[calc(100vh-140px)] flex flex-col">
            <div className="p-4 border-b border-[#E5E7EB] bg-[#f9f9fb]">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#72787c] text-[18px]">search</span>
                <input type="text" placeholder="Buscar cliente o DNI..." className="w-full bg-white border border-[#E5E7EB] rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#023143]" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {clients.map(c => (
                <div
                  key={c.id}
                  onClick={() => handleClientSelect(c)}
                  className={`p-4 border-b border-[#E5E7EB] cursor-pointer transition-colors flex flex-col gap-1 ${activeClient?.id === c.id ? "bg-[#e5f5ff] border-l-4 border-l-[#023143]" : "hover:bg-[#f4f3f5]"}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <h3 className={`text-[14px] font-bold ${activeClient?.id === c.id ? "text-[#001b27]" : "text-[#1a1c1d]"}`}>{c.name}</h3>
                    {c.finalActSigned && <span className="material-symbols-outlined text-[#72787c] text-[16px]" title="Acta de Entrega Firmada">verified</span>}
                  </div>
                  <p className="text-[12px] text-[#41484c]">{c.project} - Unidad {c.unit}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[11px] font-bold text-[#72787c] uppercase">Valor Total</span>
                    <span className="text-[13px] font-bold text-[#001b27]">{fmt(c.totalValue)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Timeline & Actions */}
        <div className="col-span-12 xl:col-span-8 flex flex-col">
          {activeClient ? (
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-[0_4px_20px_rgba(2,49,67,0.05)] h-[calc(100vh-140px)] flex flex-col relative overflow-hidden animate-fade-in">

              {/* Header detail */}
              <div className="p-6 border-b border-[#E5E7EB] bg-white z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-[20px] font-bold text-[#001b27] mb-1">Cronograma Autorizado</h2>
                    <h3 className="text-[14px] text-[#41484c]">{activeClient.name} • {fmt(activeClient.totalValue)}</h3>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {activeClient.finalActSigned && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f3f5] text-[#1a1c1d] border border-[#E5E7EB] rounded-lg text-xs font-bold font-mono">
                        <span className="material-symbols-outlined text-[16px]">lock</span>
                        Cronograma Histórico (Sólo Lectura)
                      </div>
                    )}
                    {!activeClient.finalActSigned && (
                      <div className="flex gap-2">
                        <button onClick={addCuota} className="px-4 py-2 border border-[#E5E7EB] bg-white text-[#1a1c1d] rounded-lg text-xs font-bold hover:bg-[#f4f3f5] flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">add</span> Añadir Cuota
                        </button>
                        <button onClick={saveSchedule} disabled={scheduleLoading} className="px-4 py-2 bg-[#023143] text-white rounded-lg text-xs font-bold hover:bg-[#001b27] flex items-center gap-2 shadow-sm">
                          {scheduleLoading ? <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>}
                          Guardar y Sync Calendar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Alerts CU010 */}
                {scheduleError && (
                  <div className="mt-4 p-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-lg flex items-start gap-2 text-[#ba1a1a] animate-slide-up">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <p className="text-[12px] font-bold leading-tight">{scheduleError}</p>
                  </div>
                )}
                {scheduleSuccess && (
                  <div className="mt-4 p-3 bg-[#d6f0e0] border border-[#27a85e]/20 rounded-lg flex items-center gap-2 text-[#1c663b] animate-slide-up">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <p className="text-[12px] font-bold">{scheduleSuccess}</p>
                  </div>
                )}
              </div>

              {/* Table Flow */}
              <div className="flex-1 overflow-y-auto p-6 bg-[#f9f9fb]">
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-[11px] font-bold text-[#72787c] uppercase">Nro</th>
                      <th className="px-4 py-2 text-[11px] font-bold text-[#72787c] uppercase">F. Vencimiento</th>
                      <th className="px-4 py-2 text-[11px] font-bold text-[#72787c] uppercase">Monto a Pagar</th>
                      <th className="px-4 py-2 text-[11px] font-bold text-[#72787c] uppercase">Estado</th>
                      <th className="px-4 py-2 text-[11px] font-bold text-[#72787c] uppercase text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editingSchedule.map((q) => (
                      <tr key={q.id} className="bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)] rounded-lg overflow-hidden group border border-[#E5E7EB]">
                        <td className="px-4 py-4 text-[13px] font-bold text-[#1a1c1d] rounded-l-lg border-y border-l border-[#E5E7EB]">
                          {q.num < 10 ? `0${q.num}` : q.num}
                        </td>
                        <td className="px-4 py-4 border-y border-[#E5E7EB]">
                          <input
                            type="date"
                            value={q.date}
                            onChange={(e) => updateCuotaDate(q.id, e.target.value)}
                            disabled={q.status === "Pagado" || activeClient.finalActSigned}
                            className="border border-[#E5E7EB] bg-[#f9f9fb] px-2 py-1 rounded text-[13px] focus:outline-none focus:border-[#023143] disabled:opacity-60 disabled:bg-transparent disabled:border-transparent"
                          />
                        </td>
                        <td className="px-4 py-4 text-[#001b27] font-mono border-y border-[#E5E7EB]">
                          <div className="flex items-center gap-1">
                            <span className="text-[13px]">$</span>
                            <input
                              type="number"
                              value={q.amount}
                              onChange={(e) => updateCuotaAmount(q.id, Number(e.target.value))}
                              disabled={q.status === "Pagado" || activeClient.finalActSigned}
                              className="border border-[#E5E7EB] bg-[#f9f9fb] px-2 py-1 rounded text-[13px] w-28 focus:outline-none focus:border-[#023143] disabled:opacity-60 disabled:bg-transparent disabled:border-transparent"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4 border-y border-[#E5E7EB] w-32">
                          <span className={`inline-flex items-center justify-center px-2 py-1 w-full rounded text-[10px] font-bold uppercase ${q.status === "Pagado" ? "bg-[#d6f0e0] text-[#1c663b]" :
                              q.status === "Mora" ? "bg-[#ffdad6] text-[#ba1a1a]" :
                                q.status === "Pago Parcial" ? "bg-[#fff3e0] text-[#e65100]" :
                                  "bg-[#e2e2e4] text-[#41484c]"
                            }`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right rounded-r-lg border-y border-r border-[#E5E7EB]">
                          <div className="flex justify-end gap-2">
                            {(!activeClient.finalActSigned && q.status !== "Pagado") && (
                              <button
                                onClick={() => deleteCuota(q.id)}
                                className="w-8 h-8 flex items-center justify-center rounded border border-[#E5E7EB] text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors bg-white shadow-sm"
                                title="Eliminar Cuota"
                              >
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            )}

                            {/* CU011 Trigger */}
                            {(!activeClient.finalActSigned && (q.status === "Pendiente" || q.status === "Mora" || q.status === "Pago Parcial")) && (
                              <button
                                onClick={() => openConciliate(q)}
                                className="px-3 py-1.5 flex items-center gap-1 rounded bg-[#27a85e] text-white text-[11px] font-bold hover:bg-[#1c663b] transition-colors shadow-sm"
                              >
                                <span className="material-symbols-outlined text-[14px]">price_check</span> Conciliar Pago
                              </button>
                            )}

                            {q.status === "Pagado" && (
                              <button className="px-3 py-1.5 flex items-center gap-1 rounded border border-[#E5E7EB] bg-white text-[#023143] text-[11px] font-bold hover:bg-[#f4f3f5] transition-colors shadow-sm">
                                <span className="material-symbols-outlined text-[14px]">receipt_long</span> Ver Voucher
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-[#E5E7EB] bg-white flex justify-between items-center z-10">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#72787c] uppercase">Suma Cronograma Actual</span>
                  <span className={`text-[16px] font-bold font-mono ${(editingSchedule.reduce((a, b) => a + b.amount, 0) !== activeClient.totalValue) ? "text-[#ba1a1a]" : "text-[#001b27]"}`}>
                    {fmt(editingSchedule.reduce((a, b) => a + b.amount, 0))}
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[11px] font-bold text-[#72787c] uppercase">Total del Contrato</span>
                  <span className="text-[16px] font-bold font-mono text-[#001b27]">
                    {fmt(activeClient.totalValue)}
                  </span>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-[#E5E7EB] text-center h-[calc(100vh-140px)] shadow-[0_4px_20px_rgba(2,49,67,0.05)]">
              <div className="w-16 h-16 bg-[#f9f9fb] rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[#72787c] text-[32px]">price_change</span>
              </div>
              <h3 className="text-[18px] font-bold text-[#1a1c1d]">Gestión Financiera Vacia</h3>
              <p className="text-[14px] text-[#41484c] mt-2 max-w-md">Selecciona un cliente de la lista para gestionar su cronograma, recalcular moras o conciliar sus depósitos.</p>
            </div>
          )}
        </div>
      </div>

      {/* CU011 Conciliation Modal */}
      {conciliationModal && conciliateCuota && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#050a0e]/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col relative overflow-hidden">

            {!conciliationSuccess && (
              <div className="px-6 py-5 border-b border-[#E5E7EB] bg-[#f9f9fb] flex justify-between items-center">
                <div>
                  <h2 className="text-[20px] font-bold text-[#1a1c1d]">Conciliar Pago</h2>
                  <p className="text-[12px] text-[#41484c]">
                    Cuota Nro {conciliateCuota.num} - Vence: {conciliateCuota.date}
                    <span className="font-bold ml-1 text-[#ba1a1a]">({fmt(conciliateCuota.amount)})</span>
                  </p>
                </div>
                <button onClick={() => setConciliationModal(false)} disabled={isUploading} className="text-[#72787c] hover:text-[#ba1a1a]">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            )}

            <div className="p-6">
              {conciliationSuccess ? (
                <div className="flex flex-col items-center text-center py-6">
                  <span className="material-symbols-outlined text-[#27a85e] text-[64px] mb-4">task_alt</span>
                  <h3 className="text-[20px] font-bold text-[#1a1c1d] mb-2">{conciliationSuccess}</h3>
                  <p className="text-[13px] text-[#41484c] max-w-[300px]">Los flujos de correos automatizados se acaban de despachar. El documento está anexado inmutablemente.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[11px] font-bold text-[#72787c] uppercase mb-1">Monto Depositado $</label>
                      <input
                        type="number"
                        max={conciliateCuota.amount}
                        value={paymentAmount || ""}
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm font-mono focus:outline-none focus:border-[#023143]"
                      />
                      {(paymentAmount > 0 && paymentAmount < conciliateCuota.amount) && (
                        <p className="text-[10px] text-[#e65100] mt-1 font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">info</span>
                          Se detecta abono Parcial. Generará residual de {fmt(conciliateCuota.amount - paymentAmount)}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#72787c] uppercase mb-1">Fecha Operación</label>
                      <input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:border-[#023143]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#72787c] uppercase mb-1">Banco Origen</label>
                      <select
                        value={paymentBank}
                        onChange={(e) => setPaymentBank(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:border-[#023143] bg-white"
                      >
                        <option>BCP</option>
                        <option>BBVA</option>
                        <option>Interbank</option>
                        <option>Scotiabank</option>
                        <option>BanBif</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#72787c] uppercase mb-1">Nro Operación</label>
                      <input
                        type="text"
                        value={paymentOp}
                        onChange={(e) => setPaymentOp(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm focus:outline-none focus:border-[#023143]"
                      />
                    </div>
                  </div>

                  <div className="mt-6 border-t border-[#E5E7EB] pt-6">
                    <h4 className="text-[13px] font-bold text-[#1a1c1d] mb-3">Respaldar Comprobante (Obligatorio)</h4>

                    <label className={`w-full border-2 border-dashed ${voucherError ? "border-[#ba1a1a] bg-[#ffdad6]/20" : "border-[#c1c7cc] bg-[#f9f9fb]"} hover:bg-[#e2e2e4] transition-colors rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer`}>
                      <span className="material-symbols-outlined text-[28px] text-[#023143] mb-1">upload_file</span>
                      <span className="text-[13px] font-bold text-[#1a1c1d]">Adjuntar Voucher</span>
                      <span className="text-[11px] text-[#72787c] mt-1">Soporta PDF, JPG, PNG (Max 10MB)</span>
                      <input type="file" accept=".pdf,image/jpeg,image/png" className="hidden" onChange={handleVoucherSelection} />
                    </label>

                    {voucherFile && !voucherError && (
                      <div className="mt-3 flex items-center justify-between p-2 px-3 bg-[#e5f5ff] text-[#001b27] rounded-lg text-[12px] font-bold">
                        <span className="truncate flex-1">{voucherFile.name} ({Math.round(voucherFile.size / 1024)} KB)</span>
                        <span className="material-symbols-outlined text-[16px] text-[#27a85e]">check_circle</span>
                      </div>
                    )}
                    {voucherError && (
                      <p className="text-[11px] text-[#ba1a1a] mt-2 font-bold">{voucherError}</p>
                    )}
                  </div>
                </>
              )}

              {isUploading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center">
                  <svg className="animate-spin w-10 h-10 text-[#023143] mb-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <p className="text-[13px] font-bold text-[#1a1c1d]">Verificando y enviando a S3...</p>
                </div>
              )}
            </div>

            {!conciliationSuccess && (
              <div className="px-6 py-4 flex justify-end gap-3 bg-[#f9f9fb] border-t border-[#E5E7EB]">
                <button onClick={() => setConciliationModal(false)} disabled={isUploading} className="px-5 py-2 text-[13px] font-bold text-[#41484c] hover:bg-[#e2e2e4] rounded-lg transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={submitConciliation}
                  disabled={Object.values({ paymentAmount, paymentDate, paymentBank, paymentOp, voucherFile }).some(x => !x) || isUploading}
                  className="px-6 py-2 bg-[#27a85e] text-white rounded-lg text-[13px] font-bold hover:bg-[#1c663b] disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">how_to_reg</span> Aplicar Conciliación
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </AdminLayout>
  );
}
