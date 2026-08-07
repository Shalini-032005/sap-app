import type { RiskLevel } from '@/data';

const config: Record<RiskLevel, { label: string; dot: string; badge: string }> = {
  green: {
    label: 'Low Risk',
    dot: 'bg-success-500',
    badge: 'bg-success-50 text-success-700 border-success-100',
  },
  amber: {
    label: 'Medium Risk',
    dot: 'bg-warn-500',
    badge: 'bg-warn-50 text-warn-700 border-warn-100',
  },
  red: {
    label: 'High Risk',
    dot: 'bg-danger-500',
    badge: 'bg-danger-50 text-danger-700 border-danger-100',
  },
};

export function StatusBadge({ level, size = 'sm' }: { level: RiskLevel; size?: 'sm' | 'xs' }) {
  const c = config[level];
  const padding = size === 'xs' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${c.badge} ${padding}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
