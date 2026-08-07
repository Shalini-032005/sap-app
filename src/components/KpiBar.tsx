import { TrendingDown, Clock, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatHours } from '@/data';

interface Kpis {
  totalBlocked: number;
  avgResolutionHours: number;
  highRiskCount: number;
}

const tiles: { key: keyof Kpis; label: string; icon: typeof TrendingDown; render: (v: number) => string }[] = [
  { key: 'totalBlocked', label: 'Total Blocked Value', icon: TrendingDown, render: (v) => formatCurrency(v) },
  { key: 'avgResolutionHours', label: 'Avg. Resolution Time', icon: Clock, render: (v) => formatHours(v) },
  { key: 'highRiskCount', label: 'High Risk Count', icon: AlertTriangle, render: (v) => `${v} orders` },
];

export function KpiBar({ kpis }: { kpis: Kpis }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {tiles.map(({ key, label, icon: Icon, render }) => (
        <div
          key={key}
          className="group rounded-xl border border-fiori-border bg-fiori-surface p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-fiori-muted">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-fiori-ink">{render(kpis[key])}</p>
            </div>
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                key === 'highRiskCount'
                  ? 'bg-danger-50 text-danger-500'
                  : key === 'avgResolutionHours'
                  ? 'bg-warn-50 text-warn-500'
                  : 'bg-brand-50 text-brand-500'
              }`}
            >
              <Icon className="h-5 w-5" />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
