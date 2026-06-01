"use client";

import { useState, useSyncExternalStore } from "react";

import { createSeedWorkspace } from "@/modules/shared/workspace/seed";
import type {
  BackofficeProject,
  BackofficeUnit,
  BackofficeWorkspace,
  PortfolioIndicator,
} from "@/modules/shared/workspace/types";
import { CONSTRUCTION_STAGE_ORDER } from "@/modules/shared/workspace/config";

const STORAGE_KEY = "llosa_backoffice_workspace_v2";

function cloneSeed() {
  return JSON.parse(JSON.stringify(createSeedWorkspace())) as BackofficeWorkspace;
}

function readWorkspace(): BackofficeWorkspace {
  if (typeof window === "undefined") return cloneSeed();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return cloneSeed();
  try {
    return JSON.parse(raw) as BackofficeWorkspace;
  } catch {
    return cloneSeed();
  }
}

export function computeProjectGlobalPercent(project: BackofficeProject) {
  if (project.constructionProgress.manualOverrideEnabled) {
    return project.constructionProgress.manualOverridePercent;
  }
  const values = CONSTRUCTION_STAGE_ORDER.map(
    (key) => project.constructionProgress.stages[key].percent,
  );
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

export function computeUnitPortfolioIndicator(unit: BackofficeUnit): PortfolioIndicator {
  if (unit.paymentSchedule.length === 0) return "al_dia";
  if (unit.paymentSchedule.every((entry) => entry.status === "pagado")) return "liquidado";
  if (unit.paymentSchedule.some((entry) => entry.status === "en_mora")) return "en_mora";
  if (unit.paymentSchedule.some((entry) => entry.status === "por_vencer")) return "en_riesgo";
  return "al_dia";
}

export function useBackofficeWorkspace() {
  const [workspace, setWorkspace] = useState<BackofficeWorkspace>(() => readWorkspace());
  const isHydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const updateWorkspace = (updater: (current: BackofficeWorkspace) => BackofficeWorkspace) => {
    setWorkspace((current) => {
      const next = updater(current);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const resetWorkspace = () => {
    const seed = cloneSeed();
    setWorkspace(seed);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    }
  };

  return {
    workspace,
    isHydrated,
    updateWorkspace,
    resetWorkspace,
  };
}
