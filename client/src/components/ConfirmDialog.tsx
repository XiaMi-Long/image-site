interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, confirmText = '确认', cancelText = '取消', onConfirm, onCancel }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 modal-enter" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-lg border border-border bg-elevated p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold text-text">{title}</h3>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="btn-outline text-xs">{cancelText}</button>
          <button onClick={onConfirm} className="btn-danger text-xs">{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
