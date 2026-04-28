"use client";

type Props = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  pending = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/70 p-4"
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
    >
      <div
        className="w-full max-w-sm rounded-sm bg-white shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-brand-red" />
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-brand-dark">{title}</h2>
            <p className="mt-1 text-sm text-brand-muted">{description}</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-sm border border-brand-border bg-white px-3 py-1.5 text-sm"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={pending}
              className="rounded-sm bg-brand-red px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-red/90 disabled:opacity-50 transition-colors"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
