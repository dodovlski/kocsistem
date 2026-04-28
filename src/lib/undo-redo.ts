/**
 * Generic Undo / Redo engine using the Command pattern.
 *
 * Each `UndoEntry` captures:
 *   - `description`  – human-readable label shown in toasts
 *   - `undo()`       – function that reverses the action
 *   - `redo()`       – function that re-applies the action
 *
 * The stack lives entirely on the client.  Server actions are
 * called inside undo/redo so persistence stays in sync.
 */

export type UndoEntry = {
  /** Short label like "Moved card" or "Deleted column" */
  description: string;
  /** Reverse the action (client state + server call) */
  undo: () => void | Promise<void>;
  /** Re-apply the action (client state + server call) */
  redo: () => void | Promise<void>;
};

const MAX_STACK = 30;

export function createUndoRedoStack() {
  let undoStack: UndoEntry[] = [];
  let redoStack: UndoEntry[] = [];
  let listeners: Array<() => void> = [];

  function notify() {
    for (const fn of listeners) fn();
  }

  return {
    /** Push a new undoable action. Clears the redo stack. */
    push(entry: UndoEntry) {
      undoStack = [...undoStack.slice(-(MAX_STACK - 1)), entry];
      redoStack = [];
      notify();
    },

    /** Undo the last action. Returns the entry or null. */
    async undo(): Promise<UndoEntry | null> {
      const entry = undoStack.at(-1);
      if (!entry) return null;
      undoStack = undoStack.slice(0, -1);
      redoStack = [...redoStack, entry];
      await entry.undo();
      notify();
      return entry;
    },

    /** Redo the last undone action. Returns the entry or null. */
    async redo(): Promise<UndoEntry | null> {
      const entry = redoStack.at(-1);
      if (!entry) return null;
      redoStack = redoStack.slice(0, -1);
      undoStack = [...undoStack, entry];
      await entry.redo();
      notify();
      return entry;
    },

    /** Clear both stacks (e.g. on board navigation). */
    clear() {
      undoStack = [];
      redoStack = [];
      notify();
    },

    get canUndo() {
      return undoStack.length > 0;
    },
    get canRedo() {
      return redoStack.length > 0;
    },
    get undoDescription() {
      return undoStack.at(-1)?.description ?? null;
    },
    get redoDescription() {
      return redoStack.at(-1)?.description ?? null;
    },

    subscribe(fn: () => void) {
      listeners = [...listeners, fn];
      return () => {
        listeners = listeners.filter((l) => l !== fn);
      };
    },
  };
}

export type UndoRedoStack = ReturnType<typeof createUndoRedoStack>;
