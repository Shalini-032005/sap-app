import { useMemo, useState } from "react";
import {
  Gauge,
  Bell,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Clock3,
  User,
  ChevronRight,
  Lock,
} from "lucide-react";

import orders from "@/data/orders.json";

type RiskLevel = "High" | "Medium" | "Low";

type Order = {
  salesOrderId: string;
  customerBP: string;
  customerId: string;
  creditLimit: number;
  currentExposure: number;
  orderValue: number;
  status: string;
  blockReason: string;
  riskLevel: RiskLevel;
  timeInQueue: string;
  lineItems: {
    materialId: string;
    description: string;
    qty: number;
    netPrice: number;
  }[];
  paymentHistory: string;
};

type Filter = "All" | RiskLevel;

const initialOrderData = orders as Order[];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

// =========================================================
// AI SMART COPILOT — RISK ASSESSMENT HELPER
// =========================================================
interface AIRiskAssessment {
  recommendation: string;
  explanation: string;
  confidence: string;
  riskBadgeColor: string;
}

const getAIRiskAssessment = (order: any): AIRiskAssessment => {
  if (!order)
    return {
      recommendation: "",
      explanation: "",
      confidence: "",
      riskBadgeColor: "",
    };

  const creditBreachRatio =
    (order.currentExposure / order.creditLimit) * 100;

  if (creditBreachRatio > 115) {
    return {
      recommendation: "REJECT / ESCALATE",
      explanation: `Customer is operating at ${creditBreachRatio.toFixed(
        0
      )}% of their credit limit ($${order.currentExposure.toLocaleString()} / $${order.creditLimit.toLocaleString()}). ${
        order.paymentHistory || "Historical payment delay detected."
      } Requires CFO level sign-off.`,
      confidence: "94%",
      riskBadgeColor: "bg-red-100 text-red-800 border-red-300",
    };
  } else if (creditBreachRatio > 100) {
    return {
      recommendation: "APPROVE WITH OVERRIDE",
      explanation: `Exposure slightly breaches limit by ${(
        creditBreachRatio - 100
      ).toFixed(
        1
      )}%, but order contains high-demand core inventory with low default probability.`,
      confidence: "88%",
      riskBadgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    };
  }
  return {
    recommendation: "AUTO-RELEASE APPROVED",
    explanation:
      "Order total and customer exposure are well within approved credit boundaries.",
    confidence: "99%",
    riskBadgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
  };
};

// =========================================================
// BUSINESS VALIDATION CONSTANTS
// =========================================================
const CREDIT_CEILING_PERCENT = 120;
const CFO_OVERRIDE_CODE = "CFO-2026";

// =========================================================
// KPI BASELINE / TARGET BENCHMARKS
// Named, quantified process metrics used on the summary tiles.
// Baselines reflect the pre-automation manual credit-release
// process; targets reflect the projected state once this
// workbench + AI copilot are in production.
// =========================================================
const DSO_BASELINE_DAYS = 24.5;
const DSO_TARGET_DAYS = 18.2;
const DSO_REDUCTION_PERCENT =
  ((DSO_BASELINE_DAYS - DSO_TARGET_DAYS) / DSO_BASELINE_DAYS) * 100;

const OTIF_BASELINE_PERCENT = 91.4;
const OTIF_TARGET_PERCENT = 97.8;
const OTIF_IMPROVEMENT_POINTS =
  OTIF_TARGET_PERCENT - OTIF_BASELINE_PERCENT;

export default function App() {
  // Orders are now held in state so approvals/releases can mutate status
  const [orderList, setOrderList] = useState<Order[]>(initialOrderData);

  // First order is selected by default
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(
    initialOrderData[0] ?? null
  );

  const [activeFilter, setActiveFilter] = useState<Filter>("All");

  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);

  // CFO override modal state
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideKey, setOverrideKey] = useState("");
  const [overrideError, setOverrideError] = useState("");

  // Orders still awaiting action (released orders drop out of the queue/KPIs)
  const activeOrders = useMemo(
    () => orderList.filter((order) => order.status !== "RELEASED"),
    [orderList]
  );

  // Filter Release Queue dynamically
  const filteredOrders = useMemo(() => {
    if (activeFilter === "All") {
      return activeOrders;
    }

    return activeOrders.filter(
      (order) => order.riskLevel === activeFilter
    );
  }, [activeOrders, activeFilter]);

  // KPI calculations
  const totalBlockedValue = useMemo(() => {
    return activeOrders.reduce(
      (total, order) => total + order.orderValue,
      0
    );
  }, [activeOrders]);

  // Decrements automatically as High risk orders are released
  const highRiskCount = activeOrders.filter(
    (order) => order.riskLevel === "High"
  ).length;

  // Credit utilization percentage
  const exposurePercentage = selectedOrder
    ? (selectedOrder.currentExposure / selectedOrder.creditLimit) * 100
    : 0;

  /*
   * The visual progress bar is capped at 100%.
   * This prevents an exposure of 130% from overflowing the container.
   */
  const progressWidth = Math.min(exposurePercentage, 100);

  const getExposureColor = () => {
    if (!selectedOrder) return "bg-gray-400";

    if (
      selectedOrder.currentExposure >
      selectedOrder.creditLimit
    ) {
      return "bg-red-500";
    }

    if (exposurePercentage >= 90) {
      return "bg-amber-500";
    }

    return "bg-emerald-500";
  };

  const showToast = (
    message: string,
    variant: "success" | "error" | "info" = "info"
  ) => {
    setToast({ message, variant });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // =========================================================
  // ORDER RELEASE — mutates orderList + syncs selectedOrder
  // =========================================================
  const releaseOrder = (
    salesOrderId: string,
    viaOverride: boolean = false
  ) => {
    setOrderList((prev) =>
      prev.map((order) =>
        order.salesOrderId === salesOrderId
          ? { ...order, status: "RELEASED" }
          : order
      )
    );

    setSelectedOrder((prev) =>
      prev && prev.salesOrderId === salesOrderId
        ? { ...prev, status: "RELEASED" }
        : prev
    );

    showToast(
      viaOverride
        ? `CFO override accepted. Credit release approved for ${salesOrderId}`
        : `Credit release approved for ${salesOrderId}`,
      "success"
    );
  };

  // =========================================================
  // APPROVE BUTTON — enforces the 120% credit ceiling
  // =========================================================
  const handleApproveClick = () => {
    if (!selectedOrder) return;

    const exposureRatio =
      (selectedOrder.currentExposure / selectedOrder.creditLimit) * 100;

    if (exposureRatio > CREDIT_CEILING_PERCENT) {
      // Block direct release — require CFO override
      setOverrideKey("");
      setOverrideError("");
      setShowOverrideModal(true);
      return;
    }

    releaseOrder(selectedOrder.salesOrderId);
  };

  const handleOverrideSubmit = () => {
    if (!selectedOrder) return;

    if (overrideKey.trim().toUpperCase() === CFO_OVERRIDE_CODE) {
      releaseOrder(selectedOrder.salesOrderId, true);
      setShowOverrideModal(false);
      setOverrideKey("");
      setOverrideError("");
    } else {
      setOverrideError(
        "Invalid override key. Enter a valid CFO approval code to proceed."
      );
    }
  };

  const closeOverrideModal = () => {
    setShowOverrideModal(false);
    setOverrideKey("");
    setOverrideError("");
  };

  const handleAction = (action: "reject" | "override") => {
    if (!selectedOrder) return;

    const messages = {
      reject: `Order ${selectedOrder.salesOrderId} has been rejected`,
      override: `Management override requested for ${selectedOrder.salesOrderId}`,
    };

    showToast(messages[action], action === "reject" ? "error" : "info");
  };

  const selectedExposureRatio = selectedOrder
    ? (selectedOrder.currentExposure / selectedOrder.creditLimit) * 100
    : 0;

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7f9] text-slate-900">

      {/* =========================================================
          HEADER
      ========================================================= */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Gauge size={22} />
            </div>

            <div>
              <h1 className="text-lg font-semibold">
                Flash Sale Dispatch Cockpit
              </h1>

              <p className="text-sm text-slate-500">
                Credit block release workbench
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live
            </div>

            <button
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              title="Notifications"
            >
              <Bell size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================
          MAIN
      ========================================================= */}
      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 overflow-hidden p-4 sm:p-6">

        {/* =====================================================
            KPI BAR — quantified baseline vs. target impact
        ===================================================== */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* KPI 1: Blocked Revenue */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Total Blocked Revenue
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatCurrency(totalBlockedValue)}
            </p>

            <p className="mt-1 text-xs font-medium text-amber-600">
              ⚠️ {activeOrders.length} order
              {activeOrders.length === 1 ? "" : "s"} requiring manual
              decision{highRiskCount > 0 ? ` (${highRiskCount} High Risk)` : ""}
            </p>
          </div>

          {/* KPI 2: DSO Impact */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Target DSO Reduction
            </p>

            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {DSO_TARGET_DAYS.toFixed(1)} Days
              </span>

              <span className="text-xs font-bold text-emerald-600">
                ↓ {DSO_REDUCTION_PERCENT.toFixed(0)}% vs Baseline (
                {DSO_BASELINE_DAYS.toFixed(1)}d)
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-400">
              Accelerating cash application flow
            </p>
          </div>

          {/* KPI 3: OTIF Adherence */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-slate-500">
              OTIF Delivery Adherence
            </p>

            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {OTIF_TARGET_PERCENT.toFixed(1)}%
              </span>

              <span className="text-xs font-bold text-emerald-600">
                ↑ +{OTIF_IMPROVEMENT_POINTS.toFixed(1)}% projected
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-400">
              Prevents dispatch cut-off delays
            </p>
          </div>

        </section>

        {/* =====================================================
            CONTENT GRID
        ===================================================== */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-5">

          {/* ===================================================
              LEFT — RELEASE QUEUE
          =================================================== */}
          <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-3">

            {/* Queue Header */}
            <div className="border-b border-slate-200 p-5">

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <div>
                  <h2 className="text-base font-semibold">
                    Release Queue
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Select an order to review and release
                  </p>
                </div>

                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-2">

                  {(["All", "High", "Medium", "Low"] as Filter[]).map(
                    (filter) => (
                      <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                          activeFilter === filter
                            ? "bg-blue-600 text-white shadow-sm"
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {filter}
                      </button>
                    )
                  )}

                </div>
              </div>
            </div>

            {/* Queue Cards */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4">

              {filteredOrders.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  No orders match this filter.
                </div>
              ) : (
                <div className="space-y-3">

                  {filteredOrders.map((order) => {

                    const isSelected =
                      selectedOrder?.salesOrderId ===
                      order.salesOrderId;

                    const isOverLimit =
                      order.currentExposure >
                      order.creditLimit;

                    return (
                      <button
                        key={order.salesOrderId}
                        onClick={() => setSelectedOrder(order)}
                        className={`w-full rounded-xl border p-4 text-left transition ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >

                        {/* Top row */}
                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">

                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${
                                  order.riskLevel === "High"
                                    ? "bg-red-500"
                                    : order.riskLevel === "Medium"
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                }`}
                              />

                              <span className="text-sm font-semibold text-slate-900">
                                {order.salesOrderId}
                              </span>
                            </div>

                            <p className="mt-1 truncate text-sm text-slate-600">
                              {order.customerBP}
                            </p>

                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                              order.riskLevel === "High"
                                ? "bg-red-100 text-red-700"
                                : order.riskLevel === "Medium"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {order.riskLevel}
                          </span>

                        </div>

                        {/* Values */}
                        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">

                          <div>
                            <p className="text-xs text-slate-500">
                              Order Value
                            </p>

                            <p className="mt-1 text-sm font-semibold">
                              {formatCurrency(order.orderValue)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Exposure
                            </p>

                            <p
                              className={`mt-1 text-sm font-semibold ${
                                isOverLimit
                                  ? "text-red-600"
                                  : "text-slate-900"
                              }`}
                            >
                              {formatCurrency(
                                order.currentExposure
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Queue Time
                            </p>

                            <p className="mt-1 flex items-center gap-1 text-sm font-semibold">
                              <Clock3 size={14} />
                              {order.timeInQueue}
                            </p>
                          </div>

                        </div>

                        {/* Block reason */}
                        <div className="mt-4 flex items-start justify-between gap-3">

                          <p className="line-clamp-2 text-xs text-slate-500">
                            {order.blockReason}
                          </p>

                          <ChevronRight
                            size={18}
                            className={`shrink-0 ${
                              isSelected
                                ? "text-blue-600"
                                : "text-slate-400"
                            }`}
                          />

                        </div>

                      </button>
                    );
                  })}

                </div>
              )}

            </div>
          </section>

          {/* ===================================================
              RIGHT — DETAIL DRAWER
          =================================================== */}
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">

            {!selectedOrder ? (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-500">
                Select an order from the Release Queue.
              </div>
            ) : (
              <>
                {/* Detail Header */}
                <div className="border-b border-slate-200 p-5">

                  <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0">

                      <div className="flex items-center gap-2">
                        <User
                          size={18}
                          className="text-blue-600"
                        />

                        <h2 className="truncate text-base font-semibold">
                          {selectedOrder.customerBP}
                        </h2>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        Sales Order{" "}
                        <span className="font-semibold text-slate-700">
                          {selectedOrder.salesOrderId}
                        </span>
                      </p>

                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        selectedOrder.riskLevel === "High"
                          ? "bg-red-100 text-red-700"
                          : selectedOrder.riskLevel === "Medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {selectedOrder.riskLevel} Risk
                    </span>

                  </div>

                  {/* Order Value */}
                  <div className="mt-5 rounded-lg bg-slate-50 p-4">

                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Order Value
                    </p>

                    <p className="mt-1 text-2xl font-bold text-slate-900">
                      {formatCurrency(selectedOrder.orderValue)}
                    </p>

                  </div>

                  {/* Released confirmation banner */}
                  {selectedOrder.status === "RELEASED" && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                      <CheckCircle2 size={16} />
                      This order has been released.
                    </div>
                  )}

                </div>

                {/* Detail Body */}
                <div className="min-h-0 flex-1 overflow-y-auto p-5">

                  {/* =================================================
                      AI SMART COPILOT RECOMMENDATION
                  ================================================= */}
                  {selectedOrder && (() => {
                    const aiAssessment = getAIRiskAssessment(selectedOrder);
                    return (
                      /* AI Smart Copilot Container Box */
                      <div className="my-4 p-4 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-white shadow-sm">

                        {/* Header Bar */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {/* Sparkles / AI Icon */}
                            <span className="p-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs">
                              ✨ Joule AI
                            </span>
                            <h4 className="text-sm font-semibold text-gray-900">
                              Smart Copilot Recommendation
                            </h4>
                          </div>
                          <span className="text-xs font-medium text-gray-500">
                            Confidence:{" "}
                            <strong className="text-indigo-600">
                              {aiAssessment.confidence}
                            </strong>
                          </span>
                        </div>

                        {/* Recommendation Badge */}
                        <div className="mt-2 mb-2">
                          <span
                            className={`inline-block px-2.5 py-1 text-xs font-bold rounded-md border ${aiAssessment.riskBadgeColor}`}
                          >
                            RECOMMENDATION: {aiAssessment.recommendation}
                          </span>
                        </div>

                        {/* Grounded Rationale Explanation */}
                        <p className="text-xs text-gray-700 leading-relaxed font-normal">
                          {aiAssessment.explanation}
                        </p>

                        {/* Grounding Citation Footer */}
                        <div className="mt-3 pt-2 border-t border-indigo-100/60 flex items-center justify-between text-[11px] text-gray-400">
                          <span>
                            Grounded on: SAP S/4HANA Credit Master (BP-
                            {selectedOrder.customerId || "10029"})
                          </span>
                          <span className="text-indigo-500 font-medium cursor-pointer hover:underline">
                            Explain drivers →
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* =================================================
                      CREDIT EXPOSURE
                  ================================================= */}
                  <section>

                    <div className="flex items-center justify-between">

                      <div>
                        <h3 className="text-sm font-semibold">
                          Credit Exposure
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Credit Limit vs Current Exposure
                        </p>
                      </div>

                      <span
                        className={`text-sm font-bold ${
                          selectedOrder.currentExposure >
                          selectedOrder.creditLimit
                            ? "text-red-600"
                            : exposurePercentage >= 90
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {exposurePercentage.toFixed(1)}%
                      </span>

                    </div>

                    {/* Progress bar */}
                    <div className="mt-4">

                      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">

                        <div
                          className={`h-full rounded-full transition-all ${getExposureColor()}`}
                          style={{
                            width: `${progressWidth}%`,
                          }}
                        />

                      </div>

                      <div className="mt-2 flex justify-between text-xs">

                        <span className="text-slate-500">
                          Limit:{" "}
                          <span className="font-semibold text-slate-700">
                            {formatCurrency(
                              selectedOrder.creditLimit
                            )}
                          </span>
                        </span>

                        <span
                          className={
                            selectedOrder.currentExposure >
                            selectedOrder.creditLimit
                              ? "font-semibold text-red-600"
                              : "font-semibold text-slate-700"
                          }
                        >
                          Exposure:{" "}
                          {formatCurrency(
                            selectedOrder.currentExposure
                          )}
                        </span>

                      </div>

                    </div>

                    {/* Exposure warning */}
                    {selectedOrder.currentExposure >
                      selectedOrder.creditLimit && (
                      <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">

                        <ShieldAlert
                          size={16}
                          className="mt-0.5 shrink-0"
                        />

                        <span>
                          Current exposure exceeds the approved
                          credit limit. Manual credit review is
                          required before release.
                        </span>

                      </div>
                    )}

                  </section>

                  {/* =================================================
                      BLOCK REASON
                  ================================================= */}
                  <section className="mt-6">

                    <h3 className="text-sm font-semibold">
                      Block Reason
                    </h3>

                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">

                      <p className="text-sm text-amber-900">
                        {selectedOrder.blockReason}
                      </p>

                    </div>

                  </section>

                  {/* =================================================
                      LINE ITEMS
                  ================================================= */}
                  <section className="mt-6">

                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">
                        Order Line Items
                      </h3>

                      <span className="text-xs text-slate-500">
                        {selectedOrder.lineItems.length} items
                      </span>
                    </div>

                    <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">

                      <div className="max-h-64 overflow-auto">

                        <table className="w-full text-left text-xs">

                          <thead className="sticky top-0 bg-slate-50">

                            <tr className="border-b border-slate-200">

                              <th className="px-3 py-2 font-semibold text-slate-600">
                                Material ID
                              </th>

                              <th className="px-3 py-2 font-semibold text-slate-600">
                                Description
                              </th>

                              <th className="px-3 py-2 text-right font-semibold text-slate-600">
                                Qty
                              </th>

                              <th className="px-3 py-2 text-right font-semibold text-slate-600">
                                Amount
                              </th>

                            </tr>

                          </thead>

                          <tbody>

                            {selectedOrder.lineItems.map(
                              (item) => {

                                const amount =
                                  item.qty *
                                  item.netPrice;

                                return (
                                  <tr
                                    key={item.materialId}
                                    className="border-b border-slate-100 last:border-0"
                                  >

                                    <td className="whitespace-nowrap px-3 py-3 font-medium text-slate-700">
                                      {item.materialId}
                                    </td>

                                    <td className="min-w-[150px] px-3 py-3 text-slate-600">
                                      {item.description}
                                    </td>

                                    <td className="px-3 py-3 text-right text-slate-600">
                                      {item.qty}
                                    </td>

                                    <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-slate-800">
                                      {formatCurrency(amount)}
                                    </td>

                                  </tr>
                                );
                              }
                            )}

                          </tbody>

                        </table>

                      </div>

                    </div>

                  </section>

                  {/* =================================================
                      CUSTOMER PAYMENT HISTORY
                  ================================================= */}
                  <section className="mt-6">

                    <h3 className="text-sm font-semibold">
                      Payment History
                    </h3>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {selectedOrder.paymentHistory}
                    </p>

                  </section>

                </div>

                {/* =================================================
                    ACTIONS
                ================================================= */}
                {selectedOrder.status !== "RELEASED" && (
                  <div className="border-t border-slate-200 bg-white p-4">

                    <div className="grid gap-2">

                      <button
                        onClick={handleApproveClick}
                        className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                      >
                        <CheckCircle2 size={17} />
                        Approve Credit Release
                      </button>

                      <button
                        onClick={() => handleAction("reject")}
                        className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                      >
                        <XCircle size={17} />
                        Reject Order
                      </button>

                      <button
                        onClick={() => handleAction("override")}
                        className="flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                      >
                        <ShieldAlert size={17} />
                        Request Management Override
                      </button>

                    </div>

                  </div>
                )}
              </>
            )}

          </aside>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500">
          Showing {filteredOrders.length} of {activeOrders.length} blocked
          orders · {formatCurrency(totalBlockedValue)} under review
        </p>

      </main>

      {/* =========================================================
          CFO OVERRIDE MODAL — 120% CREDIT CEILING BLOCK
      ========================================================= */}
      {showOverrideModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">

          <div className="w-full max-w-md rounded-xl border border-red-300 bg-white shadow-2xl">

            {/* Red alert banner */}
            <div className="flex items-start gap-3 rounded-t-xl border-b border-red-200 bg-red-50 p-4">

              <ShieldAlert
                size={22}
                className="mt-0.5 shrink-0 text-red-600"
              />

              <div>
                <p className="text-sm font-bold text-red-700">
                  CRITICAL BLOCK: Order exceeds {CREDIT_CEILING_PERCENT}%
                  credit ceiling.
                </p>

                <p className="mt-1 text-sm text-red-700">
                  Standard release prohibited. Mandatory CFO approval
                  code required.
                </p>

                <p className="mt-2 text-xs font-medium text-red-600">
                  Order {selectedOrder.salesOrderId} · Exposure at{" "}
                  {selectedExposureRatio.toFixed(1)}% of credit limit
                </p>
              </div>

            </div>

            {/* Override key input */}
            <div className="p-5">

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Manager Override Key
              </label>

              <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 focus-within:border-blue-500">

                <Lock size={16} className="text-slate-400" />

                <input
                  type="text"
                  value={overrideKey}
                  onChange={(e) => {
                    setOverrideKey(e.target.value);
                    if (overrideError) setOverrideError("");
                  }}
                  placeholder="e.g. CFO-2026"
                  className="w-full text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleOverrideSubmit();
                  }}
                />

              </div>

              {overrideError && (
                <p className="mt-2 text-xs font-medium text-red-600">
                  {overrideError}
                </p>
              )}

              <div className="mt-5 grid grid-cols-2 gap-2">

                <button
                  onClick={closeOverrideModal}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleOverrideSubmit}
                  className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Unlock Release
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* =========================================================
          TOAST
      ========================================================= */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-xl ${
            toast.variant === "success"
              ? "bg-emerald-600"
              : toast.variant === "error"
              ? "bg-red-600"
              : "bg-slate-900"
          }`}
        >
          {toast.variant === "success" && <CheckCircle2 size={16} />}
          {toast.variant === "error" && <XCircle size={16} />}
          {toast.message}
        </div>
      )}

    </div>
  );
}