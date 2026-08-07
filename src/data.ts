export type RiskLevel = 'green' | 'amber' | 'red';

export interface LineItem {
  sku: string;
  description: string;
  qty: number;
  unitPrice: number;
}

export interface QueueItem {
  id: string;
  customer: string;
  orderId: string;
  blockedValue: number;
  status: RiskLevel;
  reason: string;
  ageHours: number;
  creditLimit: number;
  exposure: number;
  items: LineItem[];
}

export const queueData: QueueItem[] = [
  {
    id: 'q-1001',
    customer: 'Northwind Traders GmbH',
    orderId: 'SO-48213',
    blockedValue: 84200,
    status: 'red',
    reason: 'Credit limit exceeded by 18%',
    ageHours: 7.4,
    creditLimit: 120000,
    exposure: 141600,
    items: [
      { sku: 'A-10043', description: 'Industrial Pump Unit 5HP', qty: 12, unitPrice: 4200 },
      { sku: 'A-10044', description: 'Replacement Seal Kit', qty: 40, unitPrice: 180 },
      { sku: 'B-22010', description: 'Stainless Hose 2m', qty: 80, unitPrice: 95 },
    ],
  },
  {
    id: 'q-1002',
    customer: 'Contoso Retail Ltd',
    orderId: 'SO-48214',
    blockedValue: 31800,
    status: 'amber',
    reason: 'Payment terms deviation requested',
    ageHours: 2.1,
    creditLimit: 80000,
    exposure: 64300,
    items: [
      { sku: 'C-31002', description: 'LED Panel 60x60', qty: 150, unitPrice: 112 },
      { sku: 'C-31005', description: 'Driver Unit 40W', qty: 150, unitPrice: 100 },
    ],
  },
  {
    id: 'q-1003',
    customer: 'Fabrikam Holdings',
    orderId: 'SO-48218',
    blockedValue: 156000,
    status: 'red',
    reason: 'Account flagged for review',
    ageHours: 11.8,
    creditLimit: 200000,
    exposure: 256000,
    items: [
      { sku: 'D-44001', description: 'CNC Spindle Assembly', qty: 4, unitPrice: 28500 },
      { sku: 'D-44003', description: 'Calibration Module', qty: 6, unitPrice: 3400 },
    ],
  },
  {
    id: 'q-1004',
    customer: 'Tailspin Toys Inc',
    orderId: 'SO-48220',
    blockedValue: 9450,
    status: 'green',
    reason: 'Minor credit hold pending confirm',
    ageHours: 0.6,
    creditLimit: 50000,
    exposure: 22300,
    items: [
      { sku: 'E-55012', description: 'Plastic Resin Pellets 1kg', qty: 300, unitPrice: 31.5 },
    ],
  },
  {
    id: 'q-1005',
    customer: 'Wide World Importers',
    orderId: 'SO-48225',
    blockedValue: 62300,
    status: 'amber',
    reason: 'Overdue invoice > 30 days',
    ageHours: 4.3,
    creditLimit: 150000,
    exposure: 121400,
    items: [
      { sku: 'F-66021', description: 'Aluminum Frame Section', qty: 220, unitPrice: 180 },
      { sku: 'F-66024', description: 'Mounting Bracket', qty: 500, unitPrice: 46 },
    ],
  },
  {
    id: 'q-1006',
    customer: 'Adventure Works Cycles',
    orderId: 'SO-48231',
    blockedValue: 27600,
    status: 'green',
    reason: 'Auto-hold, limit near reached',
    ageHours: 1.2,
    creditLimit: 90000,
    exposure: 54200,
    items: [
      { sku: 'G-77031', description: 'Road Bike Frame', qty: 30, unitPrice: 620 },
      { sku: 'G-77034', description: 'Carbon Fork', qty: 30, unitPrice: 300 },
    ],
  },
  {
    id: 'q-1007',
    customer: 'Litware Publishing',
    orderId: 'SO-48240',
    blockedValue: 48900,
    status: 'red',
    reason: 'Credit limit exceeded by 6%',
    ageHours: 9.0,
    creditLimit: 100000,
    exposure: 106000,
    items: [
      { sku: 'H-88041', description: 'Hardcover Binding Stock', qty: 600, unitPrice: 58 },
      { sku: 'H-88044', description: 'Print Toner Magenta', qty: 120, unitPrice: 120 },
    ],
  },
];

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
