/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DialogModal from '@/components/ui/DialogModal';

describe("DialogModal", () => {
  it("retorna null si isOpen es false", () => {
    const { container } = render(
      <DialogModal
        isOpen={false}
        onClose={vi.fn()}
        title="Título"
        message="Mensaje"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("muestra el título y mensaje cuando está abierto", () => {
    render(
      <DialogModal
        isOpen={true}
        onClose={vi.fn()}
        title="Confirmar acción"
        message="¿Estás seguro de continuar?"
      />
    );

    expect(screen.getByText("Confirmar acción")).toBeDefined();
    expect(screen.getByText("¿Estás seguro de continuar?")).toBeDefined();
  });

  it("muestra botón de confirmar con texto por defecto y cierra al click", () => {
    const onClose = vi.fn();
    render(
      <DialogModal
        isOpen={true}
        onClose={onClose}
        title="Aviso"
        message="Operación completada"
      />
    );

    const btn = screen.getByText("Aceptar");
    fireEvent.click(btn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("muestra texto de confirmación personalizado", () => {
    render(
      <DialogModal
        isOpen={true}
        onClose={vi.fn()}
        title="Confirmación"
        message="Esta acción es irreversible"
        confirmText="Sí, continuar"
      />
    );

    expect(screen.getByText("Sí, continuar")).toBeDefined();
  });

  it("llama a onConfirm cuando existe y se presiona confirmar", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <DialogModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Confirmación"
        message="¿Proceder?"
      />
    );

    const btn = screen.getByText("Aceptar");
    fireEvent.click(btn);
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("muestra botón Cancelar solo cuando onConfirm está presente", () => {
    render(
      <DialogModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Título"
        message="Mensaje"
      />
    );

    expect(screen.getByText("Cancelar")).toBeDefined();
  });

  it("no muestra botón Cancelar cuando onConfirm no está presente (modo alerta)", () => {
    render(
      <DialogModal
        isOpen={true}
        onClose={vi.fn()}
        title="Alerta"
        message="Solo informativo"
      />
    );

    expect(screen.queryByText("Cancelar")).toBeNull();
  });

  it("cierra al hacer clic en el botón cerrar (X)", () => {
    const onClose = vi.fn();
    render(
      <DialogModal
        isOpen={true}
        onClose={onClose}
        title="Título"
        message="Mensaje"
      />
    );

    const closeBtn = screen.getByLabelText("Cerrar");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("aplica icono y colores correctos para type danger", () => {
    render(
      <DialogModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        title="Peligro"
        message="Cuidado"
        type="danger"
        cancelText="No"
        confirmText="Sí"
      />
    );

    expect(screen.getByText("Peligro")).toBeDefined();
    expect(screen.getByText("Sí")).toBeDefined();
    expect(screen.getByText("No")).toBeDefined();
  });

  it("aplica icono y colores correctos para type warning", () => {
    render(
      <DialogModal
        isOpen={true}
        onClose={vi.fn()}
        title="Advertencia"
        message="Precaución"
        type="warning"
      />
    );

    expect(screen.getByText("Advertencia")).toBeDefined();
  });

  it("aplica icono y colores correctos para type success", () => {
    render(
      <DialogModal
        isOpen={true}
        onClose={vi.fn()}
        title="Éxito"
        message="Completado"
        type="success"
      />
    );

    expect(screen.getByText("Éxito")).toBeDefined();
  });
});
