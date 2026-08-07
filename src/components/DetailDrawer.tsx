import { X, CheckCircle2, XCircle, Send } from 'lucide-react';
import {
  formatCurrency,
  type QueueItem,
} from '@/data';
import { StatusBadge } from './StatusBadge';

interface Props {
  item: QueueItem | null;
  onClose: () => void;
  onDecision: (action: 'approve' | 'reject' | 'override', item: QueueItem) => void;
}

export function DetailDrawer({ item, onClose, onDecision }: Props) {
  if (!item) {
    return (
      <aside className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-fiori-border bg-fiori-surface/60 p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-fiori-bg text-fiori-muted">
          <Send className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-medium text-fiori-ink">No item selected</p>
        <p className="mt-1 max-w-xs text-xs text-fiori-muted">
          Select an item from the release queue to review its credit details and take action.
        </p>
      </aside>
    );
  }

  const pct = Math.min(100, Math.round((item.exposure / item.creditLimit) * 100));
  const overLimit = item.exposure > item.creditLimit;

  return (
    <aside className="animate-drawer-in flex h-full flex-col rounded-xl border border-fiori-border bg-fiori-surface shadow-sm">
      <header className="flex items-start justify-between gap-3 border-b border-fiori-border p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-base font-semibold text-fiori-ink">{item.customer}</h2>
          </div>
          <p className="mt-0.5 text-xs text-fiori-muted">
            Order {item.orderId} · Blocked {formatCurrency(item.blockedValue)}
          </p>
          <div className="mt-2">
            <StatusBadge level={item.status} />
          </div>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded-md p-1.5 text-fiori-muted transition-colors hover:bg-fiori-bg hover:text-fiori-ink"
          aria-label="Close detail"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 space-y-5 overflow-auto p-4">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-fiori-muted">Hold Reason</h3>
          <p className="mt-1.5 rounded-lg bg-warn-50 px-3 py-2 text-sm text-warn-700">{item.reason}</p>
        </section>

        <section>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-fiori-muted">Credit Exposure</h3>
            <span
              className={`text-xs font-medium ${overLimit ? 'text-danger-500' : 'text-fiori-muted'}`}
            >
              {overLimit ? 'Over limit' : 'Within limit'}
            </span>
          </div>
          <div className="mt-2 flex items-end justify-between text-sm">
            <span className="font-semibold text-fiori-ink">{formatCurrency(item.exposure)}</span>
            <span className="text-fiori-muted">/ {formatCurrency(item.creditLimit)}</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-fiori-bg">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overLimit ? 'bg-danger-500' : pct > 80 ? 'bg-warn-500' : 'bg-success-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-fiori-muted">
            Line Items ({item.items.length})
          </h3>
          <div className="mt-2 overflow-hidden rounded-lg border border-fiori-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-fiori-bg text-left text-[11px] uppercase tracking-wide text-fiori-muted">
                  <th className="px-3 py-2 font-medium">SKU</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-3 py-2 text-right font-medium">Qty</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fiori-border">
                {item.items.map((li) => (
                  <tr key={li.sku} className="hover:bg-fiori-bg">
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-fiori-ink">{li.sku}</td>
                    <td className="px-3 py-2 text-fiori-ink">{li.description}</td>
                    <td className="px-3 py-2 text-right text-fiori-muted">{li.qty}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-medium text-fiori-ink">
                      {formatCurrency(li.qty * li.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <footer className="grid grid-cols-1 gap-2 border-t border-fiori-border p-4 sm:grid-cols-3">
        <button
          onClick={() => onDecision('approve', item)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-success-500 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-success-700 hover:shadow active:scale-[0.98]"
        >
          <CheckCircle2 className="h-4 w-4" /> Approve
        </button>
        <button
          onClick={() => onDecision('reject', item)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-danger-100 bg-white px-3 py-2.5 text-sm font-semibold text-danger-700 transition-all hover:bg-danger-50 active:scale-[0.98]"
        >
          <XCircle className="h-4 w-4" /> Reject
        </button>
        <button
          onClick={() => onDecision('override', item)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow active:scale-[0.98]"
        >
          <Send className="h-4 w-4" /> Override
        </button>
      </footer>
    </aside>
  );
}
