import { useEffect } from 'react';
import { CheckCircle2, XCircle, Send } from 'lucide-react';

export interface Toast {
  id: number;
  action: 'approve' | 'reject' | 'override';
  orderId: string;
  customer: string;
}

const config = {
  approve: { icon: CheckCircle2, color: 'text-success-500', label: 'Order released' },
  reject: { icon: XCircle, color: 'text-danger-500', label: 'Order rejected' },
  override: { icon: Send, color: 'text-brand-500', label: 'Override requested' },
};

export function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-xs flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const c = config[toast.action];
  const Icon = c.icon;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div className="animate-drawer-in pointer-events-auto flex items-start gap-3 rounded-lg border border-fiori-border bg-fiori-surface p-3 shadow-lg">
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${c.color}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-fiori-ink">{c.label}</p>
        <p className="truncate text-xs text-fiori-muted">
          {toast.orderId} · {toast.customer}
        </p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-xs text-fiori-muted transition-colors hover:text-fiori-ink"
      >
        Dismiss
      </button>
    </div>
  );
}
