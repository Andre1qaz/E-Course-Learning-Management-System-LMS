"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

export type CheatEventType =
  | "TAB_SWITCH"
  | "WINDOW_BLUR"
  | "COPY_ATTEMPT"
  | "CONTEXT_MENU"
  | "FULLSCREEN_EXIT";

interface UseAntiCheatOptions {
  /** Only listen while the attempt is active */
  enabled: boolean;
  /** Bearer token for reporting violations to backend */
  token?: string;
  /** Backend endpoint WITHOUT /api prefix, e.g. `/exams/attempts/<id>/cheat-log` */
  reportEndpoint?: string;
  /** Auto-submit after this many violations (0 = disabled) */
  maxViolations?: number;
  /** Called when violations reach maxViolations (typically triggers submit) */
  onMaxViolations?: () => void;
  /** Called on every violation */
  onViolation?: (count: number, type: CheatEventType) => void;
}

/**
 * Anti-cheat hook for exam/quiz taking pages.
 * - Detects tab switch (visibilitychange) and window blur
 * - Blocks right-click context menu and copy while active
 * - Reports every violation to the backend (fire-and-forget)
 * - Optionally auto-submits after maxViolations
 */
export function useAntiCheat({
  enabled,
  token,
  reportEndpoint,
  maxViolations = 3,
  onMaxViolations,
  onViolation,
}: UseAntiCheatOptions) {
  const [violations, setViolations] = useState(0);
  const countRef = useRef(0);
  const maxReachedRef = useRef(false);
  const onMaxRef = useRef(onMaxViolations);
  const onViolationRef = useRef(onViolation);
  onMaxRef.current = onMaxViolations;
  onViolationRef.current = onViolation;

  const report = useCallback(
    async (eventType: CheatEventType) => {
      if (!token || !reportEndpoint) return;
      try {
        await apiFetch(
          reportEndpoint,
          {
            method: "POST",
            body: JSON.stringify({
              eventType,
              details: `Violation #${countRef.current} via ${eventType}`,
            }),
          },
          token,
        );
      } catch {
        // Fire-and-forget: never block the student on reporting failure
      }
    },
    [token, reportEndpoint],
  );

  const registerViolation = useCallback(
    (eventType: CheatEventType) => {
      countRef.current += 1;
      const count = countRef.current;
      setViolations(count);

      toast.warning(
        `Peringatan anti-kecurangan (${count}${maxViolations > 0 ? `/${maxViolations}` : ""}): jangan pindah tab/window saat ujian!`,
      );

      void report(eventType);
      onViolationRef.current?.(count, eventType);

      if (
        maxViolations > 0 &&
        count >= maxViolations &&
        !maxReachedRef.current
      ) {
        maxReachedRef.current = true;
        toast.error(
          "Batas pelanggaran tercapai. Jawaban akan dikumpulkan otomatis.",
        );
        onMaxRef.current?.();
      }
    },
    [maxViolations, report],
  );

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        registerViolation("TAB_SWITCH");
      }
    };

    const handleBlur = () => {
      registerViolation("WINDOW_BLUR");
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      registerViolation("COPY_ATTEMPT");
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      registerViolation("CONTEXT_MENU");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [enabled, registerViolation]);

  return { violations };
}
