import { useMemo, useState, useCallback } from 'react';
import { Gauge, Bell } from 'lucide-react';
import { queueData, formatCurrency, type QueueItem } from '@/data';
import { KpiBar } from '@/components/KpiBar';
import { QueuePanel } from '@/components/QueuePanel';
import { DetailDrawer } from '@/components/DetailDrawer';
import { ToastStack, type Toast } from '@/components/Toast';

export default function App() {
  const [selected, setSelected] = useState<QueueItem | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const kpis = useMemo(() => {
    const totalBlocked = queueData.reduce((s, i) => s + i.blockedValue, 0);
    const avgResolution = queueData.reduce((s, i) => s + i.ageHours, 0) / queueData.length;
    const highRisk = queueData.filter((i) => i.status === 'red').length;
    return { totalBlocked, avgResolutionHours: avgResolution, highRiskCount: highRisk };
  }, []);

  const pushToast = useCallback((toast: Omit<Toast, 'id'>) => {
    setToasts((prev) => [...prev, { ...toast, id: Date.now() + Math.random() }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleDecision = useCallback(
    (action: Toast['action'], item: QueueItem) => {
      pushToast({ action, orderId: item.orderId, customer: item.customer });
      setSelected(null);
      setMobileOpen(false);
    },
    [pushToast]
  );

  const handleSelect = useCallback((item: QueueItem) => {
    setSelected(item);
    setMobileOpen(true);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-fiori-bg">
      <header className="sticky top-0 z-30 border-b border-fiori-border bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white shadow-sm">
              <Gauge className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-sm font-semibold leading-tight text-fiori-ink sm:text-base">
                Flash Sale Dispatch Cockpit
              </h1>
              <p className="hidden text-xs text-fiori-muted sm:block">Credit block release workbench</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-success-500" /> Live
            </span>
            <button className="relative rounded-md p-1.5 text-fiori-muted transition-colors hover:bg-fiori-bg hover:text-fiori-ink">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger-500" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-6">
        <KpiBar kpis={kpis} />

        <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-5">
          <div className="lg:col-span-3 lg:h-full h-[55vh] min-h-0">
            <QueuePanel selectedId={selected?.id ?? null} onSelect={handleSelect} />
          </div>

          <div className="hidden min-h-0 lg:col-span-2 lg:flex lg:h-full">
            <DetailDrawer
              item={selected}
              onClose={() => setSelected(null)}
              onDecision={handleDecision}
            />
          </div>
        </div>

        <p className="text-center text-xs text-fiori-muted">
          Showing {queueData.length} blocked orders · {formatCurrency(kpis.totalBlocked)} under review
        </p>
      </main>

      <div className="lg:hidden">
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/30 transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <div
          className={`fixed inset-y-0 right-0 z-50 w-full max-w-md transform bg-fiori-bg p-3 shadow-2xl transition-transform duration-300 ease-out ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <DetailDrawer
            item={selected}
            onClose={() => {
              setMobileOpen(false);
              setSelected(null);
            }}
            onDecision={handleDecision}
          />
        </div>
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
