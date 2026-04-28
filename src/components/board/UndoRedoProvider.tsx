"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { createUndoRedoStack, type UndoEntry, type UndoRedoStack } from "@/lib/undo-redo";

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const UndoRedoCtx = createContext<UndoRedoStack | null>(null);

export function UndoRedoProvider({ children }: { children: ReactNode }) {
  const stackRef = useRef<UndoRedoStack>(createUndoRedoStack());
  const stack = stackRef.current;

  /* ── Keyboard: Ctrl+Z / Ctrl+Shift+Z ─────────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input / textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const isZ = e.key === "z" || e.key === "Z";
      if (!isZ) return;
      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;

      e.preventDefault();

      if (e.shiftKey) {
        // Redo
        stack.redo().then((entry) => {
          if (entry) toast.success(`Redo: ${entry.description}`);
        });
      } else {
        // Undo
        stack.undo().then((entry) => {
          if (entry) toast.success(`Undo: ${entry.description}`);
        });
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [stack]);

  return (
    <UndoRedoCtx.Provider value={stack}>{children}</UndoRedoCtx.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook: useUndoRedo                                                  */
/* ------------------------------------------------------------------ */

export function useUndoRedo() {
  const stack = useContext(UndoRedoCtx);
  if (!stack) throw new Error("useUndoRedo must be used inside <UndoRedoProvider>");

  // Cache the snapshot to avoid creating new objects on every call
  const snapRef = useRef({
    canUndo: false,
    canRedo: false,
    undoDescription: null as string | null,
    redoDescription: null as string | null,
  });

  const getSnapshot = useCallback(() => {
    const next = {
      canUndo: stack.canUndo,
      canRedo: stack.canRedo,
      undoDescription: stack.undoDescription,
      redoDescription: stack.redoDescription,
    };
    // Only return a new object if something actually changed
    const prev = snapRef.current;
    if (
      prev.canUndo === next.canUndo &&
      prev.canRedo === next.canRedo &&
      prev.undoDescription === next.undoDescription &&
      prev.redoDescription === next.redoDescription
    ) {
      return prev;
    }
    snapRef.current = next;
    return next;
  }, [stack]);

  // Static empty snapshot for SSR
  const serverSnapshot = useRef({
    canUndo: false,
    canRedo: false,
    undoDescription: null as string | null,
    redoDescription: null as string | null,
  }).current;

  const subscribe = useCallback((fn: () => void) => stack.subscribe(fn), [stack]);
  const snap = useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);

  const push = useCallback(
    (entry: UndoEntry) => {
      stack.push(entry);
      // Show "Undo" toast — critical for mobile where there's no Ctrl+Z
      toast(entry.description, {
        action: {
          label: "Undo",
          onClick: () => {
            stack.undo().then((e) => {
              if (e) toast.success(`Undo: ${e.description}`);
            });
          },
        },
        duration: 5000,
      });
    },
    [stack],
  );

  const undo = useCallback(async () => {
    const entry = await stack.undo();
    if (entry) toast.success(`Undo: ${entry.description}`);
    return entry;
  }, [stack]);

  const redo = useCallback(async () => {
    const entry = await stack.redo();
    if (entry) toast.success(`Redo: ${entry.description}`);
    return entry;
  }, [stack]);

  const clear = useCallback(() => stack.clear(), [stack]);

  return useMemo(
    () => ({ push, undo, redo, clear, ...snap }),
    [push, undo, redo, clear, snap],
  );
}
