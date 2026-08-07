import { useMemo, useState } from 'react';
import { Search, Filter, ChevronRight } from 'lucide-react';
import { queueData, formatCurrency, formatHours, type QueueItem, type RiskLevel } from '@/data';
import { StatusBadge } from './StatusBadge';

interface Props {
  selectedId: string | null;
  onSelect: (item: QueueItem) => void;
}

const filters: { key: RiskLevel | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'red', label: 'High' },
  { key: 'amber', label: 'Medium' },
  { key: 'green', label: 'Low' },
];

export function QueuePanel({ selectedId, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<RiskLevel | 'all'>('all');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return queueData.filter((it) => {
      const matchesFilter = filter === 'all' || it.status === filter;
      const matchesQuery =
        !q ||
        it.customer.toLowerCase().includes(q) ||
        it.orderId.toLowerCase().includes(q) ||
        it.reason.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [query, filter]);

  return (
    <section className="flex h-full flex-col rounded-xl border border-fiori-border bg-fiori-surface shadow-sm">
      <header className="flex flex-col gap-3 border-b border-fiori-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-fiori-ink">Release Queue</h2>
            <p className="text-xs text-fiori-muted">{rows.length} pending items</p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-md bg-fiori-bg px-2.5 py-1 text-xs font-medium text-fiori-muted sm:inline-flex">
            <Filter className="h-3.5 w-3.5" /> Credit block
          </span>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fiori-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer, order, or reason..."
            className="w-full rounded-lg border border-fiori-border bg-fiori-bg py-2 pl-9 pr-3 text-sm text-fiori-ink placeholder:text-fiori-muted focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-brand-500 text-white'
                    : 'bg-fiori-bg text-fiori-muted hover:bg-brand-50 hover:text-brand-600'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        {rows.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8 text-sm text-fiori-muted">
            No items match your filters.
          </div>
        ) : (
          <ul className="divide-y divide-fiori-border">
            {rows.map((item, i) => {
              const active = item.id === selectedId;
              const overdue = item.ageHours >= 6;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onSelect(item)}
                    style={{ animationDelay: `${i * 30}ms` }}
                    className={`animate-row-in flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                      active ? 'bg-brand-50' : 'hover:bg-fiori-bg'
                    }`}
                  >
                    <span
                      className={`h-10 w-1 shrink-0 rounded-full ${
                        item.status === 'red'
                          ? 'bg-danger-500'
                          : item.status === 'amber'
                          ? 'bg-warn-500'
                          : 'bg-success-500'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-fiori-ink">{item.customer}</p>
                        <p className="shrink-0 text-sm font-semibold text-fiori-ink">
                          {formatCurrency(item.blockedValue)}
                        </p>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-fiori-muted">
                          {item.orderId} · {item.reason}
                        </p>
                        <p className={`shrink-0 text-xs ${overdue ? 'font-medium text-danger-500' : 'text-fiori-muted'}`}>
                          {formatHours(item.ageHours)}
                        </p>
                      </div>
                      <div className="mt-2">
                        <StatusBadge level={item.status} size="xs" />
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 shrink-0 ${active ? 'text-brand-500' : 'text-fiori-muted'}`} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
